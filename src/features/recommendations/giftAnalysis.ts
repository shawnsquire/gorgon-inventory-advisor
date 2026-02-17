import type { InventoryItem } from '@/types/inventory';
import type { CharacterExport } from '@/types/character';
import type { CdnItem } from '@/types/cdn/items';
import type { GameDataIndexes } from '@/lib/cdn-indexes';
import { itemMatchesPreference } from '@/shared/utils/giftMatching';

export interface GiftSuggestion {
  npcId: string;
  npcName: string;
  desire: string;
  pref: number;
  playerFavor: string;
}

/**
 * Find NPCs who would appreciate this item as a gift.
 * Uses AND logic: ALL keywords in a preference must match the item.
 */
export function analyzeGiftPotential(
  item: InventoryItem,
  cdnItem: CdnItem | undefined,
  character: CharacterExport,
  indexes: GameDataIndexes,
  ignoredNpcIds?: Set<string>,
): GiftSuggestion[] {
  if (!cdnItem) return [];

  const suggestions: GiftSuggestion[] = [];
  const seenNpcs = new Set<string>();

  for (const [npcId, npc] of indexes.npcById) {
    if (!npc.Preferences) continue;
    if (ignoredNpcIds?.has(npcId)) continue;

    for (const pref of npc.Preferences) {
      if (pref.Desire !== 'Like' && pref.Desire !== 'Love') continue;

      // ALL keywords must match (AND logic)
      if (!itemMatchesPreference(pref, cdnItem, item)) continue;

      if (seenNpcs.has(npcId)) continue;
      seenNpcs.add(npcId);

      const npcFavor = character.NPCs[npcId];
      const playerFavor = npcFavor?.FavorLevel ?? 'Unknown';

      suggestions.push({
        npcId,
        npcName: npc.Name,
        desire: pref.Desire,
        pref: pref.Pref,
        playerFavor,
      });
    }
  }

  // Sort by preference strength descending
  suggestions.sort((a, b) => b.pref - a.pref);

  return suggestions;
}

/**
 * Check if an item would be better as a gift than sold.
 * Items trending toward SELL_ALL that NPCs like can become GIFT suggestions.
 */
export function shouldSuggestGift(
  suggestions: GiftSuggestion[],
  itemValue: number,
): boolean {
  // Only suggest gifting if an NPC "loves" the item and vendor value is low
  return suggestions.some((s) => s.desire === 'Love') ||
         (suggestions.length > 0 && itemValue < 50);
}
