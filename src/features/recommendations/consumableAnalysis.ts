import type { InventoryItem } from '@/types/inventory';
import type { CharacterExport } from '@/types/character';
import type { CdnItem } from '@/types/cdn/items';

/**
 * Analyze a consumable item (food, potion, etc.) for relevance.
 */
export function analyzeConsumable(
  item: InventoryItem,
  cdnItem: CdnItem | undefined,
  character: CharacterExport,
): { useful: boolean; reason: string } {
  if (!cdnItem) return { useful: false, reason: 'Unknown consumable' };

  const behaviors = cdnItem.Behaviors ?? [];
  const hasUseVerb = behaviors.some((b) => b.UseVerb != null);

  if (!hasUseVerb) {
    return { useful: false, reason: 'No use action found' };
  }

  // Check level appropriateness
  if (item.Level) {
    let maxCombat = 0;
    for (const skill of Object.values(character.Skills)) {
      if (skill.Level > maxCombat) maxCombat = skill.Level;
    }

    if (item.Level < maxCombat - 20) {
      return { useful: false, reason: `Outleveled consumable (L${item.Level} vs your L${maxCombat})` };
    }
  }

  // Food: check Gourmand potential
  const gourmandLevel = character.Skills.Gourmand?.Level ?? 0;
  const isFood = cdnItem.Keywords?.some((k) =>
    k.includes('Food') || k.includes('Meal') || k.includes('Snack'),
  );

  if (isFood) {
    return {
      useful: true,
      reason: `Food item — eat if new for Gourmand XP (Gourmand ${gourmandLevel})`,
    };
  }

  // Potions: generally useful if level-appropriate
  const isPotion = cdnItem.Keywords?.some((k) =>
    k.includes('Potion') || k.includes('Elixir'),
  );

  if (isPotion) {
    return { useful: true, reason: 'Potion — use in combat' };
  }

  return { useful: true, reason: 'Consumable — use when needed' };
}
