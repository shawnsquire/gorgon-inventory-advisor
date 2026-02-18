import type { InventoryItem } from '@/types/inventory';
import type { CharacterExport } from '@/types/character';
import type { Recommendation, ReasonEntry, BuildConfig, ItemOverride } from '@/types/recommendations';
import { ACTIONS } from '@/types/recommendations';
import type { GameDataIndexes } from '@/lib/cdn-indexes';
import type { CdnItem } from '@/types/cdn/items';
import { DEFAULT_GEM_KEEP } from '@/lib/store';
import { scoreGear, getGearSkills, getGearSkillsFriendly, inferGearSkills } from './gearScoring';
import { analyzeRecipeUses, calculateRecipeKeepQuantity } from './recipeAnalysis';
import { analyzeQuestUses, hasActiveQuestMatch } from './questAnalysis';
import { analyzeGiftPotential, shouldSuggestGift } from './giftAnalysis';
import { analyzeConsumable } from './consumableAnalysis';
import {
  categorizeItem,
  getHeuristicRecommendation,
  ITEM_CATEGORIES,
} from './fallbackHeuristics';
import { isEquipment, isConsumable as checkConsumable } from '@/shared/utils/itemHelpers';
import { getMaxCombatLevel } from './buildDetection';

/**
 * Main recommendation engine.
 * Runs a priority chain per item to determine the best action.
 *
 * Priority:
 * 1. User overrides (highest)
 * 2. Quest item check
 * 3. Equipment evaluation (gear scoring + build synergy)
 * 4. Recipe/crafting check
 * 5. Consumable check
 * 6. NPC gift check
 * 7. Fallback heuristics
 */
export function getRecommendation(
  item: InventoryItem,
  character: CharacterExport,
  indexes: GameDataIndexes,
  build: BuildConfig,
  overrides: Record<string, ItemOverride>,
  keepQuantities: Record<string, number>,
  ignoredNpcIds?: Set<string>,
  skipOverride?: boolean,
): Recommendation {
  const cdnItem = indexes.itemsByTypeId.get(item.TypeID);
  const category = categorizeItem(item, cdnItem);
  const reasons: ReasonEntry[] = [];

  // --- 1. User overrides ---
  if (!skipOverride) {
    const overrideKey = `${item.TypeID}_${item.StorageVault}`;
    const nameOverride = overrides[item.Name];
    const keyOverride = overrides[overrideKey];
    const override = keyOverride ?? nameOverride;

    if (override) {
      // Legacy guard: persisted EVALUATE overrides from before removal
      const overrideAction = override.action === ('EVALUATE' as string) ? 'KEEP' : override.action;
      const isLegacyEvaluate = override.action === ('EVALUATE' as string);
      return {
        action: ACTIONS[overrideAction],
        reasons: [{ type: 'override', text: override.reason || 'User override', confidence: 'high' }],
        summary: override.reason || 'User override',
        category,
        ...(isLegacyEvaluate && { uncertain: true }),
      };
    }
  }

  // --- 2. Quest item check ---
  const questMatches = analyzeQuestUses(item, cdnItem, character, indexes);
  const activeQuestMatches = questMatches.filter((q) => q.isActive);

  if (activeQuestMatches.length > 0) {
    const questNames = activeQuestMatches.map((q) => q.questName).join(', ');
    return {
      action: ACTIONS.QUEST,
      reasons: activeQuestMatches.map((q) => ({
        type: 'quest' as const,
        text: `Needed for quest: ${q.questName}`,
        confidence: 'high' as const,
        detail: `${q.count} needed`,
      })),
      summary: `Quest item: ${questNames}`,
      keepQuantity: Math.max(...activeQuestMatches.map((q) => q.count)),
      category,
    };
  }

  // Heuristic quest check (name matching)
  if (category === ITEM_CATEGORIES.KEY || hasActiveQuestMatch(item.Name, character)) {
    return {
      action: ACTIONS.QUEST,
      reasons: [{ type: 'quest', text: 'Quest/dungeon access item', confidence: 'medium' }],
      summary: 'Quest/dungeon access item',
      category,
    };
  }

  // --- 3. Equipment evaluation ---
  if (isEquipment(item)) {
    return evaluateEquipment(item, cdnItem, character, indexes, build, category);
  }

  // --- 3b. Augment evaluation ---
  if (category === ITEM_CATEGORIES.AUGMENT) {
    return evaluateAugment(item, cdnItem, character, build, indexes, category);
  }

  // --- 4. Recipe/crafting check ---
  const recipeMatches = analyzeRecipeUses(item, character, indexes);
  if (recipeMatches.length > 0) {
    const craftable = recipeMatches.filter((r) => r.canCraftNow);
    const recipeKeepQty = calculateRecipeKeepQuantity(item, character, indexes);

    if (craftable.length > 0) {
      const reason: ReasonEntry = {
        type: 'recipe',
        text: `Crafting ingredient: ${craftable[0]!.reason}`,
        confidence: 'high',
      };
      reasons.push(reason);

      // Only suggest selling with a buffer to avoid petty "sell 2 out of 12" recs
      if (recipeKeepQty != null) {
        const sellThreshold = Math.max(recipeKeepQty + 5, Math.ceil(recipeKeepQty * 1.2));
        if (item.StackSize > sellThreshold) {
          return {
            action: ACTIONS.SELL_SOME,
            reasons: [reason],
            summary: `Keep ${recipeKeepQty} for crafting, sell rest`,
            keepQuantity: recipeKeepQty,
            category,
          };
        }
      }

      return {
        action: ACTIONS.INGREDIENT,
        reasons: [reason],
        summary: reason.text,
        keepQuantity: recipeKeepQty ?? undefined,
        category,
      };
    }

    // Has recipe potential but can't craft now
    if (recipeMatches.some((r) => !r.canCraftNow)) {
      const bestFuture = recipeMatches.find((r) => !r.canCraftNow);
      if (bestFuture) {
        reasons.push({
          type: 'recipe',
          text: bestFuture.reason,
          confidence: 'medium',
        });
      }
    }
  }

  // --- 5. Consumable check ---
  if (cdnItem && checkConsumable(cdnItem)) {
    const consumableResult = analyzeConsumable(item, cdnItem, character, indexes);
    if (consumableResult.status === 'usable') {
      return {
        action: ACTIONS.USE,
        reasons: [{
          type: 'consumable',
          text: consumableResult.reason,
          confidence: 'medium',
        }],
        summary: consumableResult.reason,
        category,
      };
    }
    if (consumableResult.status === 'combat_supply') {
      return {
        action: ACTIONS.USE_COMBAT,
        reasons: [{
          type: 'consumable',
          text: consumableResult.reason,
          confidence: 'medium',
        }],
        summary: consumableResult.reason,
        category,
      };
    }
    if (consumableResult.status === 'level_later') {
      return {
        action: ACTIONS.LEVEL_LATER,
        reasons: [{
          type: 'consumable',
          text: consumableResult.reason,
          confidence: 'medium',
        }],
        summary: consumableResult.reason,
        category,
        uncertain: true,
      };
    }
    // status === 'not_useful' — fall through to gift/heuristics
  }

  // --- 6. NPC gift check ---
  if (cdnItem) {
    const giftSuggestions = analyzeGiftPotential(item, cdnItem, character, indexes, ignoredNpcIds);
    if (shouldSuggestGift(giftSuggestions, item.Value) && giftSuggestions[0]) {
      const topGift = giftSuggestions[0];
      return {
        action: ACTIONS.GIFT,
        reasons: [{
          type: 'gift',
          text: `${topGift.npcName} ${topGift.desire}s this (favor: ${topGift.playerFavor})`,
          confidence: 'medium',
        }],
        summary: `Gift to ${topGift.npcName} (${topGift.desire})`,
        category,
      };
    }
  }

  // --- 7. Fallback heuristics ---
  const maxStackSize = cdnItem?.MaxStackSize;
  const heuristic = getHeuristicRecommendation(
    item, cdnItem, character, category, keepQuantities, DEFAULT_GEM_KEEP, maxStackSize,
  );

  if (heuristic) {
    return {
      action: ACTIONS[heuristic.action],
      reasons: [heuristic.reason, ...reasons],
      summary: heuristic.reason.text,
      keepQuantity: heuristic.action === 'SELL_SOME'
        ? (keepQuantities[item.Name] ?? undefined)
        : undefined,
      category,
      ...(heuristic.uncertain && { uncertain: true }),
    };
  }

  // --- Ultimate fallback ---
  return {
    action: ACTIONS.KEEP,
    reasons: reasons.length > 0
      ? reasons
      : [{ type: 'fallback', text: 'Uncategorized \u2014 review manually', confidence: 'low' }],
    summary: reasons[0]?.text ?? 'Uncategorized \u2014 review manually',
    category,
    uncertain: true,
  };
}

function evaluateEquipment(
  item: InventoryItem,
  _cdnItem: CdnItem | undefined,
  character: CharacterExport,
  indexes: GameDataIndexes,
  build: BuildConfig,
  category: string,
): Recommendation {
  const gearScore = scoreGear(item, character, build, indexes);
  let gearSkills = getGearSkills(item, indexes);
  let confidence: 'high' | 'medium' | 'low' = 'high';

  // Bug 3 fix: when TSysPowers don't resolve, try inference
  if (gearSkills.length === 0) {
    gearSkills = inferGearSkills(item, indexes);
    confidence = 'medium';
  }

  // If still empty after inference, keep but flag uncertain
  if (gearSkills.length === 0) {
    const rarity = item.Rarity ?? 'Common';
    const level = item.Level ?? 0;
    return {
      action: ACTIONS.KEEP,
      reasons: [{
        type: 'equipment',
        text: `${rarity} L${level} \u2014 unable to determine skills, review manually`,
        confidence: 'low',
      }],
      summary: `${rarity} L${level} \u2014 unable to determine skills, review manually`,
      gearScore,
      category,
      uncertain: true,
    };
  }

  const gearSkillsDisplay = getGearSkillsFriendly(item, indexes);
  // If friendly names came back empty (inference path), build display from inferred skills
  const displayNames = gearSkillsDisplay.length > 0
    ? gearSkillsDisplay
    : gearSkills.map((s) => indexes.skillsByInternalName.get(s)?.Name ?? s);
  const displayStr = displayNames.join('/');

  const maxCombat = getMaxCombatLevel(character, build);
  const allBuildSkills = new Set([...build.primarySkills, ...build.supportSkills]);
  const hasBuildSkill = gearSkills.some((s) => allBuildSkills.has(s));
  const hasPrimarySkill = gearSkills.some((s) => build.primarySkills.includes(s));

  const rarity = item.Rarity ?? 'Common';
  const level = item.Level ?? 0;

  // On-build endgame gear
  if (hasPrimarySkill && level >= 80) {
    return {
      action: ACTIONS.KEEP,
      reasons: [{
        type: 'equipment',
        text: `Endgame ${displayStr} gear \u2014 save for later`,
        confidence,
      }],
      summary: `Endgame ${displayStr} gear \u2014 save for later`,
      gearScore,
      category,
    };
  }

  // Current-tier high-rarity on-build gear
  if (hasPrimarySkill && level >= maxCombat - 5 && ['Epic', 'Legendary', 'Exceptional'].includes(rarity)) {
    return {
      action: ACTIONS.KEEP,
      reasons: [{
        type: 'equipment',
        text: `Current-tier ${rarity} gear for your build`,
        confidence,
      }],
      summary: `Current-tier ${rarity} gear for your build`,
      gearScore,
      category,
    };
  }

  // Outleveled on-build gear
  if (hasPrimarySkill && level < maxCombat - 15 && !['Epic', 'Legendary'].includes(rarity)) {
    return {
      action: ACTIONS.DISENCHANT,
      reasons: [{
        type: 'equipment',
        text: `Outleveled ${rarity} L${level} ${displayStr} \u2014 distill for phlogiston`,
        confidence,
        detail: 'On-build gear yields relevant phlogiston; more valuable than vendor price',
      }],
      summary: `Outleveled ${rarity} L${level} ${displayStr} \u2014 distill for phlogiston`,
      gearScore,
      category,
    };
  }

  // On-build gear that needs comparison
  if (hasBuildSkill) {
    return {
      action: ACTIONS.KEEP,
      reasons: [{
        type: 'equipment',
        text: `${rarity} L${level} ${displayStr} \u2014 compare to current gear`,
        confidence,
      }],
      summary: `${rarity} L${level} ${displayStr} \u2014 compare to current gear`,
      gearScore,
      category,
      uncertain: true,
    };
  }

  // Off-build gear
  if (['Legendary', 'Epic'].includes(rarity)) {
    return {
      action: ACTIONS.DISENCHANT,
      reasons: [{
        type: 'equipment',
        text: `Off-build ${rarity} ${displayStr} \u2014 good phlogiston from distilling`,
        confidence,
        detail: 'High-rarity gear yields valuable phlogiston worth more than vendor gold',
      }],
      summary: `Off-build ${rarity} ${displayStr} \u2014 good phlogiston from distilling`,
      gearScore,
      category,
    };
  }
  return {
    action: ACTIONS.SELL_ALL,
    reasons: [{
      type: 'equipment',
      text: `Off-build ${rarity} ${displayStr} \u2014 sell for gold`,
      confidence,
      detail: 'Low-rarity gear yields minimal phlogiston; vendor gold is better value',
    }],
    summary: `Off-build ${rarity} ${displayStr} \u2014 sell for gold`,
    gearScore,
    category,
  };
}

function evaluateAugment(
  item: InventoryItem,
  _cdnItem: CdnItem | undefined,
  _character: CharacterExport,
  build: BuildConfig,
  indexes: GameDataIndexes,
  category: string,
): Recommendation {
  // Check TSysPowers for skill association
  const gearSkills = getGearSkills(item, indexes);
  const gearSkillsDisplay = getGearSkillsFriendly(item, indexes);
  const displayStr = gearSkillsDisplay.join('/');
  const allBuildSkills = new Set([...build.primarySkills, ...build.supportSkills, 'AnySkill']);

  if (gearSkills.some((s) => allBuildSkills.has(s)) || gearSkills.length === 0) {
    return {
      action: ACTIONS.KEEP,
      reasons: [{
        type: 'equipment',
        text: `Augment for ${displayStr || 'general use'} \u2014 save for gear`,
        confidence: 'medium',
      }],
      summary: `Augment for ${displayStr || 'general use'} \u2014 save for gear`,
      category,
    };
  }

  return {
    action: ACTIONS.SELL_ALL,
    reasons: [{
      type: 'equipment',
      text: `Off-build augment (${displayStr})`,
      confidence: 'medium',
    }],
    summary: `Off-build augment (${displayStr})`,
    category,
  };
}

/**
 * Analyze all inventory items and return recommendations.
 */
export function analyzeInventory(
  items: InventoryItem[],
  character: CharacterExport,
  indexes: GameDataIndexes,
  build: BuildConfig,
  overrides: Record<string, ItemOverride>,
  keepQuantities: Record<string, number>,
  ignoredNpcIds?: Set<string>,
): Array<InventoryItem & { recommendation: Recommendation }> {
  // Track how many non-stacking items have been assigned each override,
  // so we can respect keepQuantities and let excess items fall through.
  const overrideCounts: Record<string, number> = {};

  return items.map((item) => {
    let skipOverride = false;

    const overrideKey = `${item.TypeID}_${item.StorageVault}`;
    const nameOverride = overrides[item.Name];
    const keyOverride = overrides[overrideKey];
    const override = keyOverride ?? nameOverride;

    if (override && item.StackSize <= 1) {
      const keepQty = keepQuantities[item.Name];
      if (keepQty != null) {
        const countKey = keyOverride ? overrideKey : item.Name;
        const assigned = overrideCounts[countKey] ?? 0;
        if (assigned >= keepQty) {
          skipOverride = true;
        } else {
          overrideCounts[countKey] = assigned + 1;
        }
      }
    }

    return {
      ...item,
      recommendation: getRecommendation(
        item, character, indexes, build, overrides, keepQuantities,
        ignoredNpcIds, skipOverride,
      ),
    };
  });
}
