import type { InventoryItem } from '@/types/inventory';
import type { CharacterExport } from '@/types/character';
import type { CdnItem } from '@/types/cdn/items';
import type { GameDataIndexes } from '@/lib/cdn-indexes';

export interface GiftSuggestion {
  npcId: string;
  npcName: string;
  desire: string;
  pref: number;
  playerFavor: string;
}

/**
 * Find NPCs who would appreciate this item as a gift.
 * Matches CDN item keywords against NPC preference index,
 * filtered by character favor levels.
 */
export function analyzeGiftPotential(
  _item: InventoryItem,
  cdnItem: CdnItem | undefined,
  character: CharacterExport,
  indexes: GameDataIndexes,
): GiftSuggestion[] {
  if (!cdnItem?.Keywords) return [];

  const suggestions: GiftSuggestion[] = [];
  const seenNpcs = new Set<string>();

  for (const keyword of cdnItem.Keywords) {
    const prefs = indexes.npcPreferenceIndex.get(keyword);
    if (!prefs) continue;

    for (const pref of prefs) {
      if (seenNpcs.has(pref.npcId)) continue;
      seenNpcs.add(pref.npcId);

      // Only suggest positive preferences (Desire = "Like" or "Love")
      if (pref.desire !== 'Like' && pref.desire !== 'Love') continue;

      // Get player's current favor with this NPC
      const npcFavor = character.NPCs[pref.npcId];
      const playerFavor = npcFavor?.FavorLevel ?? 'Unknown';

      suggestions.push({
        npcId: pref.npcId,
        npcName: pref.npcName,
        desire: pref.desire,
        pref: pref.pref,
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
