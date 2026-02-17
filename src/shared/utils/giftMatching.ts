import type { CdnItem } from '@/types/cdn/items';
import type { CdnNpcPreference } from '@/types/cdn/npcs';
import type { InventoryItem } from '@/types/inventory';

const RARITY_RANKS: Record<string, number> = {
  Common: 0,
  Uncommon: 1,
  Rare: 2,
  Exceptional: 3,
  Epic: 4,
  Legendary: 5,
};

function rarityRank(rarity: string): number {
  return RARITY_RANKS[rarity] ?? 0;
}

/**
 * Check if a single keyword matches an item.
 * Handles both regular keywords (checked against cdnItem.Keywords)
 * and virtual keywords that require matching against item fields:
 *  - SkillPrereq:X → cdnItem.SkillReqs contains skill X
 *  - EquipmentSlot:X → cdnItem.EquipSlot equals X
 *  - MinRarity:X → item rarity >= X (inventory items only)
 */
export function matchesKeyword(
  keyword: string,
  cdnItem: CdnItem,
  item?: InventoryItem,
): boolean {
  // Virtual keyword: SkillPrereq:X
  if (keyword.startsWith('SkillPrereq:')) {
    const skill = keyword.slice('SkillPrereq:'.length);
    return cdnItem.SkillReqs != null && skill in cdnItem.SkillReqs;
  }

  // Virtual keyword: EquipmentSlot:X
  if (keyword.startsWith('EquipmentSlot:')) {
    const slot = keyword.slice('EquipmentSlot:'.length);
    return cdnItem.EquipSlot === slot;
  }

  // Virtual keyword: MinRarity:X
  if (keyword.startsWith('MinRarity:')) {
    if (!item?.Rarity) return false;
    const required = keyword.slice('MinRarity:'.length);
    return rarityRank(item.Rarity) >= rarityRank(required);
  }

  // Regular keyword: check cdnItem.Keywords
  return cdnItem.Keywords?.includes(keyword) ?? false;
}

/**
 * Check if an item satisfies ALL keywords in an NPC preference (AND logic).
 * Returns true only when every keyword in the preference matches.
 */
export function itemMatchesPreference(
  pref: CdnNpcPreference,
  cdnItem: CdnItem,
  item?: InventoryItem,
): boolean {
  if (!pref.Keywords || pref.Keywords.length === 0) return false;
  return pref.Keywords.every((kw) => matchesKeyword(kw, cdnItem, item));
}
