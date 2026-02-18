import type { InventoryItem } from '@/types/inventory';
import type { CharacterExport } from '@/types/character';
import type { CdnItem } from '@/types/cdn/items';
import type { GameDataIndexes } from '@/lib/cdn-indexes';

const SKILL_GAP_CLOSE_THRESHOLD = 15;

/** Map display-name skill prefixes that differ from CDN InternalName */
const SKILL_NAME_ALIASES: Record<string, string> = {
  'Art': 'Artistry',
  'Saddlery': 'AnimalHandling',
  'Animal Handling': 'AnimalHandling',
  'Civic Pride': 'CivicPride',
  'Fairy Magic': 'FairyMagic',
  'First Aid': 'FirstAid',
  'Chest Surgery': 'ChestSurgery',
};

export type ConsumableResult =
  | { status: 'usable'; reason: string }
  | { status: 'combat_supply'; reason: string }
  | { status: 'level_later'; reason: string }
  | { status: 'not_useful'; reason: string };

function checkSkillRequirements(
  cdnItem: CdnItem,
  character: CharacterExport,
): { close: boolean; reason: string } | null {
  const reqs = cdnItem.SkillReqs;
  if (!reqs) return null;

  const unmet: Array<{ skill: string; required: number; have: number; gap: number }> = [];
  for (const [skill, required] of Object.entries(reqs)) {
    const have = character.Skills[skill]?.Level ?? 0;
    if (have < required) {
      unmet.push({ skill, required, have, gap: required - have });
    }
  }

  if (unmet.length === 0) return null;

  const parts = unmet.map((u) =>
    u.have > 0
      ? `Need ${u.skill} ${u.required} (you have ${u.have})`
      : `Need ${u.skill} ${u.required} (untrained)`,
  );
  const reason = parts.join('; ');

  const close = unmet.every((u) => u.have > 0 && u.gap <= SKILL_GAP_CLOSE_THRESHOLD);
  return { close, reason };
}

/**
 * Check if an item is an ability scroll and whether the character already knows it.
 * Returns null if the item isn't an ability scroll.
 */
function checkAbilityScroll(
  item: InventoryItem,
  character: CharacterExport,
  indexes: GameDataIndexes,
): { known: boolean; displayName: string; skill: string; level?: number } | null {
  // Ability scrolls are named "SkillName: AbilityName"
  const match = item.Name.match(/^([^:]+):\s*(.+)$/);
  if (!match) return null;

  const [, rawSkill, abilityDisplayName] = match;
  if (!rawSkill || !abilityDisplayName) return null;

  // Resolve skill prefix to CDN internal name
  const skillInternal = SKILL_NAME_ALIASES[rawSkill] ?? rawSkill;

  // Look up in the reverse ability index
  const abilities = indexes.abilitiesByDisplayNameAndSkill.get(`${skillInternal}:${abilityDisplayName}`);
  if (!abilities || abilities.length === 0) return null; // Not a recognized ability scroll

  const cdnAbility = abilities[0]!;
  const level = cdnAbility.Level;

  // Check if character already knows this ability
  const charSkill = character.Skills[skillInternal];
  if (!charSkill?.Abilities) {
    return { known: false, displayName: abilityDisplayName, skill: skillInternal, level };
  }

  // Character abilities are internal names like "Mock1" — match against CDN InternalName
  const knownSet = new Set(charSkill.Abilities);
  const alreadyKnown = abilities.some((a) => knownSet.has(a.InternalName));

  return { known: alreadyKnown, displayName: abilityDisplayName, skill: skillInternal, level };
}

/**
 * Analyze a consumable item (food, potion, etc.) for relevance.
 */
export function analyzeConsumable(
  item: InventoryItem,
  cdnItem: CdnItem | undefined,
  character: CharacterExport,
  indexes: GameDataIndexes,
): ConsumableResult {
  if (!cdnItem) return { status: 'not_useful', reason: 'Unknown consumable' };

  const behaviors = cdnItem.Behaviors ?? [];
  const hasUseVerb = behaviors.some((b) => b.UseVerb != null);

  if (!hasUseVerb) {
    return { status: 'not_useful', reason: 'No use action found' };
  }

  // Check ability scrolls — already-known check before skill requirements
  const abilityCheck = checkAbilityScroll(item, character, indexes);
  if (abilityCheck?.known) {
    return {
      status: 'not_useful',
      reason: `Already know ${abilityCheck.displayName} (${abilityCheck.skill}) — sell or gift`,
    };
  }

  // Check skill requirements
  const skillCheck = checkSkillRequirements(cdnItem, character);
  if (skillCheck) {
    if (skillCheck.close) {
      return { status: 'level_later', reason: skillCheck.reason };
    }
    // Far from requirements — fall through to gift/heuristics
    return { status: 'not_useful', reason: skillCheck.reason };
  }

  // Ability scroll the character doesn't know yet and meets skill requirements
  if (abilityCheck && !abilityCheck.known) {
    const levelStr = abilityCheck.level != null ? ` (${abilityCheck.skill} ${abilityCheck.level})` : ` (${abilityCheck.skill})`;
    return {
      status: 'usable',
      reason: `Learn ability: ${abilityCheck.displayName}${levelStr}`,
    };
  }

  // Check level appropriateness
  if (item.Level) {
    let maxCombat = 0;
    for (const skill of Object.values(character.Skills)) {
      if (skill.Level > maxCombat) maxCombat = skill.Level;
    }

    if (item.Level < maxCombat - 20) {
      return { status: 'not_useful', reason: `Outleveled consumable (L${item.Level} vs your L${maxCombat})` };
    }
  }

  // Food: check Gourmand potential
  const gourmandLevel = character.Skills.Gourmand?.Level ?? 0;
  const isFood = cdnItem.Keywords?.some((k) =>
    k.includes('Food') || k.includes('Meal') || k.includes('Snack'),
  );

  if (isFood) {
    return {
      status: 'usable',
      reason: `Food item — eat if new for Gourmand XP (Gourmand ${gourmandLevel})`,
    };
  }

  // Potions: generally useful if level-appropriate
  const isPotion = cdnItem.Keywords?.some((k) =>
    k.includes('Potion') || k.includes('Elixir'),
  );

  if (isPotion) {
    return { status: 'combat_supply', reason: 'Potion — keep for combat use' };
  }

  // First Aid / Armor Patch Kits — combat supplies to keep stocked
  const name = item.Name;
  if (name.includes('First Aid Kit') || name.includes('Armor Patch Kit')) {
    return { status: 'combat_supply', reason: 'Combat supply — keep stocked' };
  }

  return { status: 'usable', reason: 'Consumable — use when needed' };
}
