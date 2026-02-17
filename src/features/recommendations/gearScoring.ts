import type { InventoryItem } from '@/types/inventory';
import type { CharacterExport } from '@/types/character';
import type { BuildConfig } from '@/types/recommendations';
import type { GameDataIndexes } from '@/lib/cdn-indexes';

/**
 * Score equipment 0-100 based on build synergy.
 *
 * Scoring breakdown:
 * - Skill Match (40pts): TSysPowers reference skills that match build
 * - Level Appropriateness (25pts): item level vs character combat level
 * - Rarity Bonus (15pts): direct rarity mapping
 * - Power Quality (20pts): count of build-relevant powers weighted by tier
 */
export function scoreGear(
  item: InventoryItem,
  character: CharacterExport,
  build: BuildConfig,
  indexes: GameDataIndexes,
): number {
  if (!item.TSysPowers || item.TSysPowers.length === 0) return 0;

  let score = 0;

  // --- Skill Match (40 pts) ---
  const allBuildSkills = new Set([...build.primarySkills, ...build.supportSkills]);
  let matchingPowers = 0;
  let totalPowers = 0;

  for (const power of item.TSysPowers) {
    const tsysPower = indexes.tsysPowerByInternalName.get(power.Power);
    totalPowers++;
    if (tsysPower?.Skill && allBuildSkills.has(tsysPower.Skill)) {
      matchingPowers++;
    }
  }

  if (totalPowers > 0) {
    score += Math.round((matchingPowers / totalPowers) * 40);
  }

  // --- Level Appropriateness (25 pts) ---
  if (item.Level) {
    let maxCombatLevel = 0;
    for (const skill of build.primarySkills) {
      const level = character.Skills[skill]?.Level ?? 0;
      if (level > maxCombatLevel) maxCombatLevel = level;
    }

    if (maxCombatLevel > 0) {
      const levelDiff = Math.abs(item.Level - maxCombatLevel);
      if (levelDiff === 0) score += 25;
      else if (levelDiff <= 5) score += 20;
      else if (levelDiff <= 10) score += 15;
      else if (levelDiff <= 20) score += 8;
      // Items significantly above character level (banked for later) still get some points
      else if (item.Level > maxCombatLevel) score += 5;
    }
  }

  // --- Rarity Bonus (15 pts) ---
  const rarityPoints: Record<string, number> = {
    Common: 0,
    Uncommon: 3,
    Rare: 6,
    Exceptional: 9,
    Epic: 12,
    Legendary: 15,
  };
  score += rarityPoints[item.Rarity ?? 'Common'] ?? 0;

  // --- Power Quality (20 pts) ---
  // Weight by tier: higher tiers = better powers
  let powerQuality = 0;
  for (const power of item.TSysPowers) {
    const tsysPower = indexes.tsysPowerByInternalName.get(power.Power);
    if (tsysPower?.Skill && allBuildSkills.has(tsysPower.Skill)) {
      // Tier ranges roughly 1-20; normalize
      powerQuality += Math.min(power.Tier / 20, 1);
    }
  }
  score += Math.min(20, Math.round(powerQuality * 5));

  return Math.min(100, score);
}

/**
 * Get the skills an equipment item's TSysPowers reference.
 * Returns internal skill names (for comparison logic).
 */
export function getGearSkills(
  item: InventoryItem,
  indexes: GameDataIndexes,
): string[] {
  if (!item.TSysPowers) return [];

  const skills = new Set<string>();
  for (const power of item.TSysPowers) {
    const tsysPower = indexes.tsysPowerByInternalName.get(power.Power);
    if (tsysPower?.Skill) {
      skills.add(tsysPower.Skill);
    }
  }
  return [...skills];
}

/**
 * Get the display-friendly names for an equipment item's gear skills.
 * Uses CDN skill Name field (e.g., "Sword" instead of "Sword").
 */
export function getGearSkillsFriendly(
  item: InventoryItem,
  indexes: GameDataIndexes,
): string[] {
  return getGearSkills(item, indexes).map(
    (s) => indexes.skillsByInternalName.get(s)?.Name ?? s,
  );
}

/**
 * Infer gear skills from CDN item keywords and name patterns
 * when TSysPowers are missing or don't resolve.
 */
export function inferGearSkills(
  item: InventoryItem,
  indexes: GameDataIndexes,
): string[] {
  const cdnItem = indexes.itemsByTypeId.get(item.TypeID);
  if (!cdnItem) return [];
  const inferred = new Set<string>();

  // Strategy 1: CDN item keywords → skill keyword index
  if (cdnItem.Keywords) {
    for (const keyword of cdnItem.Keywords) {
      const skills = indexes.skillsByItemKeyword.get(keyword);
      if (skills) {
        for (const skill of skills) {
          if (indexes.combatSkills.has(skill)) inferred.add(skill);
        }
      }
    }
  }

  // Strategy 2: Match item name against skill names
  if (inferred.size === 0) {
    const nameLower = item.Name.toLowerCase();
    for (const [skillKey, skill] of indexes.skillsByInternalName) {
      if (!indexes.combatSkills.has(skillKey)) continue;
      const displayName = skill.Name ?? skillKey;
      const root = displayName.replace(/(y|ing|ry)$/, '');
      if (root.length >= 4 && nameLower.includes(root.toLowerCase())) {
        inferred.add(skillKey);
      }
    }
  }

  return [...inferred];
}
