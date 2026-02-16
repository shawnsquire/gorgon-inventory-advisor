import type { InventoryItem } from '@/types/inventory';
import type { CharacterExport } from '@/types/character';
import type { Recommendation, ReasonEntry, BuildConfig, ItemOverride } from '@/types/recommendations';
import { ACTIONS } from '@/types/recommendations';
import type { GameDataIndexes } from '@/lib/cdn-indexes';
import type { CdnItem } from '@/types/cdn/items';
import { DEFAULT_GEM_KEEP } from '@/lib/store';
import { scoreGear, getGearSkills } from './gearScoring';
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
): Recommendation {
  const cdnItem = indexes.itemsByTypeId.get(item.TypeID);
  const category = categorizeItem(item, cdnItem);
  const reasons: ReasonEntry[] = [];

  // --- 1. User overrides ---
  const overrideKey = `${item.TypeID}_${item.StorageVault}`;
  const nameOverride = overrides[item.Name];
  const keyOverride = overrides[overrideKey];
  const override = keyOverride ?? nameOverride;

  if (override) {
    return {
      action: ACTIONS[override.action],
      reasons: [{ type: 'override', text: override.reason || 'User override', confidence: 'high' }],
      summary: override.reason || 'User override',
      category,
    };
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

      if (recipeKeepQty && item.StackSize > recipeKeepQty) {
        return {
          action: ACTIONS.SELL_SOME,
          reasons: [reason],
          summary: `Keep ${recipeKeepQty} for crafting, sell rest`,
          keepQuantity: recipeKeepQty,
          category,
        };
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
    const consumableResult = analyzeConsumable(item, cdnItem, character);
    if (consumableResult.useful) {
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
    // Not useful consumable — may fall through to sell
  }

  // --- 6. NPC gift check ---
  if (cdnItem) {
    const giftSuggestions = analyzeGiftPotential(item, cdnItem, character, indexes);
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
  const heuristic = getHeuristicRecommendation(
    item, cdnItem, character, category, keepQuantities, DEFAULT_GEM_KEEP,
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
    };
  }

  // --- Ultimate fallback ---
  return {
    action: ACTIONS.EVALUATE,
    reasons: reasons.length > 0
      ? reasons
      : [{ type: 'fallback', text: 'Uncategorized \u2014 review manually', confidence: 'low' }],
    summary: reasons[0]?.text ?? 'Uncategorized \u2014 review manually',
    category,
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
  const gearSkills = getGearSkills(item, indexes);
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
        text: `Endgame ${gearSkills.join('/')} gear \u2014 save for later`,
        confidence: 'high',
      }],
      summary: `Endgame ${gearSkills.join('/')} gear \u2014 save for later`,
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
        confidence: 'high',
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
        text: `Outleveled ${rarity} L${level} \u2014 distill for phlogiston`,
        confidence: 'high',
      }],
      summary: `Outleveled ${rarity} L${level} \u2014 distill for phlogiston`,
      gearScore,
      category,
    };
  }

  // On-build gear that needs evaluation
  if (hasBuildSkill) {
    return {
      action: ACTIONS.EVALUATE,
      reasons: [{
        type: 'equipment',
        text: `${rarity} L${level} ${gearSkills.join('/')} \u2014 compare to current gear`,
        confidence: 'medium',
      }],
      summary: `${rarity} L${level} ${gearSkills.join('/')} \u2014 compare to current gear`,
      gearScore,
      category,
    };
  }

  // Off-build gear
  if (!hasBuildSkill) {
    if (['Legendary', 'Epic'].includes(rarity)) {
      return {
        action: ACTIONS.DISENCHANT,
        reasons: [{
          type: 'equipment',
          text: `Off-build ${rarity} \u2014 good phlogiston from distilling`,
          confidence: 'high',
        }],
        summary: `Off-build ${rarity} \u2014 good phlogiston from distilling`,
        gearScore,
        category,
      };
    }
    return {
      action: ACTIONS.SELL_ALL,
      reasons: [{
        type: 'equipment',
        text: 'Off-build gear, no relevant skills',
        confidence: 'high',
      }],
      summary: 'Off-build gear, no relevant skills',
      gearScore,
      category,
    };
  }

  return {
    action: ACTIONS.EVALUATE,
    reasons: [{
      type: 'equipment',
      text: `${rarity} L${level} \u2014 review mods`,
      confidence: 'low',
    }],
    summary: `${rarity} L${level} \u2014 review mods`,
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
  const allBuildSkills = new Set([...build.primarySkills, ...build.supportSkills, 'AnySkill']);

  if (gearSkills.some((s) => allBuildSkills.has(s)) || gearSkills.length === 0) {
    return {
      action: ACTIONS.KEEP,
      reasons: [{
        type: 'equipment',
        text: `Augment for ${gearSkills.join('/') || 'general use'} \u2014 save for gear`,
        confidence: 'medium',
      }],
      summary: `Augment for ${gearSkills.join('/') || 'general use'} \u2014 save for gear`,
      category,
    };
  }

  return {
    action: ACTIONS.SELL_ALL,
    reasons: [{
      type: 'equipment',
      text: `Off-build augment (${gearSkills.join('/')})`,
      confidence: 'medium',
    }],
    summary: `Off-build augment (${gearSkills.join('/')})`,
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
): Array<InventoryItem & { recommendation: Recommendation }> {
  return items.map((item) => ({
    ...item,
    recommendation: getRecommendation(item, character, indexes, build, overrides, keepQuantities),
  }));
}
