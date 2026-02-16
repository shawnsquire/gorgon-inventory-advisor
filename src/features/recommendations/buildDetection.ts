import type { CharacterExport } from '@/types/character';
import type { BuildConfig } from '@/types/recommendations';
import type { GameDataIndexes } from '@/lib/cdn-indexes';

/**
 * Auto-detect the character's combat build from their skill levels
 * and CDN skill metadata.
 *
 * Logic:
 * 1. Filter to combat-only skills (CDN skills.json `Combat === true`)
 * 2. Sort by Level descending
 * 3. Top 2 = primary combat skills
 * 4. Identify support skills using CDN `TSysCompatibleCombatSkills`
 */
export function detectBuild(
  character: CharacterExport,
  indexes: GameDataIndexes,
): BuildConfig {
  const charSkills = character.Skills;

  // Get all combat skills the character has, filtered by CDN combat flag
  const combatEntries: Array<{ name: string; level: number }> = [];

  // Skills marked Combat in CDN but not actual primary combat skills
  const NON_PRIMARY_COMBAT = new Set(['Riding', 'Race', 'SpiritFox']);

  for (const [skillName, skillData] of Object.entries(charSkills)) {
    // Skip anatomy sub-skills, utility skills, and non-primary combat skills
    if (skillName.startsWith('Anatomy_')) continue;
    if (skillName === 'Unknown') continue;
    if (skillName === 'Anatomy') continue;
    if (NON_PRIMARY_COMBAT.has(skillName)) continue;

    // Check CDN for combat flag
    if (indexes.combatSkills.has(skillName) && skillData.Level > 0) {
      combatEntries.push({ name: skillName, level: skillData.Level });
    }
  }

  // Sort by level descending
  combatEntries.sort((a, b) => b.level - a.level);

  // Top 2 are primary combat skills
  const primarySkills = combatEntries.slice(0, 2).map((e) => e.name);

  // Identify support skills: other combat skills that are in primary skills'
  // TSysCompatibleCombatSkills list, or that the character has at level > 10
  const supportSkills: string[] = [];
  const primarySet = new Set(primarySkills);

  for (const entry of combatEntries) {
    if (primarySet.has(entry.name)) continue;
    if (entry.level < 5) continue;

    // Check if this skill is compatible with any primary skill
    let isSupport = false;
    for (const primary of primarySkills) {
      const cdnSkill = indexes.skillsByInternalName.get(primary);
      if (cdnSkill?.TSysCompatibleCombatSkills?.includes(entry.name)) {
        isSupport = true;
        break;
      }
      if (cdnSkill?.CompatibleCombatSkills?.includes(entry.name)) {
        isSupport = true;
        break;
      }
    }

    // Also include if the character has invested significantly (level >= 15)
    if (isSupport || entry.level >= 15) {
      supportSkills.push(entry.name);
    }
  }

  return {
    primarySkills,
    supportSkills,
    autoDetected: true,
  };
}

/**
 * Check if a skill name is relevant to the player's build.
 */
export function isSkillRelevant(skillName: string, build: BuildConfig): boolean {
  return (
    build.primarySkills.includes(skillName) ||
    build.supportSkills.includes(skillName)
  );
}

/**
 * Get the max level among the player's primary combat skills.
 */
export function getMaxCombatLevel(character: CharacterExport, build: BuildConfig): number {
  let max = 0;
  for (const skill of build.primarySkills) {
    const level = character.Skills[skill]?.Level ?? 0;
    if (level > max) max = level;
  }
  return max;
}
