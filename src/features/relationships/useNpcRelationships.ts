import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { favorRank } from '@/shared/utils/favor';
import { formatArea } from '@/shared/utils/friendlyNames';
import { itemMatchesPreference } from '@/shared/utils/giftMatching';
import type { CdnItem } from '@/types/cdn/items';
import type { InventoryItem } from '@/types/inventory';
import type { NpcRelationshipView } from './types';

/** Zone tiers: lower = earlier in game progression. */
const ZONE_TIERS: Record<string, number> = {
  'Anagoge': 1, 'Anagoge Island': 1,
  'Serbule': 1,
  'Serbule Hills': 2, 'South Serbule': 2, 'Eltibule': 2,
  'Kur Mountains': 3, 'Sun Vale': 3, 'Ilmari': 3, 'Rahu': 3,
  'Gazluk': 4, 'Red Wing Casino': 4, 'Povus': 4,
  // Cave/dungeon zones
  'Serbule Caves': 5, 'Eltibule Caves': 5, 'Kur Tower': 5,
  'Labyrinth': 5, "Yeti Cave": 5, "Wolf Cave": 5,
  'Goblin Dungeon': 5, 'Dark Chapel': 5, 'Fae Realm': 5,
  'Winter Nexus': 5, 'Casino Back Room': 5,
};

function getAreaTier(areaName: string): number {
  return ZONE_TIERS[areaName] ?? 99;
}

export function useNpcRelationships() {
  const character = useAppStore((s) => s.character);
  const indexes = useAppStore((s) => s.indexes);
  const inventory = useAppStore((s) => s.inventory);
  const npcPriorities = useAppStore((s) => s.npcPriorities);

  return useMemo(() => {
    if (!indexes || !character) return { npcs: [], areas: [], favorLevels: [] };

    const npcs: NpcRelationshipView[] = [];
    const areaSet = new Set<string>();
    const favorSet = new Set<string>();

    // Build inventory CDN item cache for gift counting
    const inventoryCdnItems: Array<{ cdnItem: CdnItem; item: InventoryItem }> = [];
    if (inventory?.Items && indexes) {
      for (const item of inventory.Items) {
        const cdnItem = indexes.itemsByTypeId.get(item.TypeID);
        if (cdnItem) {
          inventoryCdnItems.push({ cdnItem, item });
        }
      }
    }

    for (const [npcId, npc] of indexes.npcById) {
      // Only include NPCs that have gift preferences
      if (!npc.Preferences || npc.Preferences.length === 0) continue;

      const playerNpc = character.NPCs[npcId];
      const isMet = !!playerNpc;
      const favorLevel = playerNpc?.FavorLevel ?? 'Unknown';
      const area = npc.AreaName ? formatArea(npc.AreaName) : 'Unknown';

      if (area !== 'Unknown') areaSet.add(area);
      if (isMet) favorSet.add(favorLevel);

      // Count gift matches using AND logic across all preference keywords
      let giftCount = 0;
      let loveCount = 0;
      for (const pref of npc.Preferences) {
        if (pref.Desire !== 'Like' && pref.Desire !== 'Love') continue;
        // Check if any inventory item satisfies ALL keywords in this preference
        const hasMatch = inventoryCdnItems.some(
          ({ cdnItem, item }) => itemMatchesPreference(pref, cdnItem, item),
        );
        if (hasMatch) {
          giftCount++;
          if (pref.Desire === 'Love') loveCount++;
        }
      }

      npcs.push({
        npcId,
        name: npc.Name,
        areaName: area,
        areaTier: getAreaTier(area),
        isMet,
        favorLevel,
        favorRank: favorRank(favorLevel),
        priority: npcPriorities[npcId] ?? 'default',
        giftCount,
        loveCount,
      });
    }

    return {
      npcs,
      areas: [...areaSet].sort((a, b) => getAreaTier(a) - getAreaTier(b)),
      favorLevels: [...favorSet].sort((a, b) => favorRank(a) - favorRank(b)),
    };
  }, [character, indexes, inventory, npcPriorities]);
}
