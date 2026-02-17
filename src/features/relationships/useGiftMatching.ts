import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { getVaultShortName, PLAYER_INVENTORY } from '@/shared/utils/friendlyNames';
import { itemMatchesPreference } from '@/shared/utils/giftMatching';
import type { NpcGiftItem } from './types';
import type { RelationshipMode } from './types';

export function useGiftMatching(npcId: string | null, mode: RelationshipMode) {
  const inventory = useAppStore((s) => s.inventory);
  const indexes = useAppStore((s) => s.indexes);
  const character = useAppStore((s) => s.character);

  return useMemo((): NpcGiftItem[] => {
    if (!npcId || !indexes || !character) return [];

    const npc = indexes.npcById.get(npcId);
    if (!npc?.Preferences) return [];

    const gifts: NpcGiftItem[] = [];
    const seenItems = new Set<string>(); // prevent duplicates by name+vault

    // --- Inventory matches ---
    if (inventory?.Items) {
      for (const item of inventory.Items) {
        const cdnItem = indexes.itemsByTypeId.get(item.TypeID);
        if (!cdnItem) continue;

        // Find best matching preference using AND logic
        let bestDesire: string | null = null;
        let bestPref = 0;
        for (const pref of npc.Preferences) {
          if (pref.Desire !== 'Like' && pref.Desire !== 'Love') continue;

          // ALL keywords must match (AND logic)
          if (!itemMatchesPreference(pref, cdnItem, item)) continue;

          if (pref.Desire === 'Love' || !bestDesire || pref.Pref > bestPref) {
            bestDesire = pref.Desire;
            bestPref = pref.Pref;
          }
        }
        if (!bestDesire) continue;

        const vault = item.StorageVault ?? PLAYER_INVENTORY;
        const dedupeKey = `${item.Name}_${vault}`;
        if (seenItems.has(dedupeKey)) continue;
        seenItems.add(dedupeKey);

        // Check for conflicts — is this item also a quest/ingredient item?
        let conflict: 'quest' | 'ingredient' | undefined;
        const questReqs = indexes.questItemRequirements.get(cdnItem.InternalName);
        if (questReqs?.some((q) => character.ActiveQuests.includes(q.questInternalName))) {
          conflict = 'quest';
        } else {
          const recipeUses = indexes.recipesByIngredient.get(item.TypeID);
          if (recipeUses && recipeUses.length > 0) {
            conflict = 'ingredient';
          }
        }

        gifts.push({
          itemName: item.Name,
          typeId: item.TypeID,
          stackSize: item.StackSize,
          value: item.Value,
          desire: bestDesire,
          pref: bestPref,
          source: 'inventory',
          conflict,
          vaultName: getVaultShortName(vault, indexes),
        });
      }
    }

    // --- Craftable matches (strategic mode) ---
    if (mode === 'strategic') {
      for (const pref of npc.Preferences) {
        if (pref.Desire !== 'Like' && pref.Desire !== 'Love') continue;
        if (!pref.Keywords || pref.Keywords.length === 0) continue;

        // Find CDN items matching this preference (ALL keywords)
        for (const [typeId, cdnItem] of indexes.itemsByTypeId) {
          if (!itemMatchesPreference(pref, cdnItem)) continue;

          // Check if there are recipes that produce this item
          const recipes = indexes.recipesByResultItem.get(typeId);
          if (!recipes || recipes.length === 0) continue;

          // Check if player could craft any of these recipes
          for (const recipe of recipes) {
            const playerSkill = character.Skills[recipe.Skill];
            if (!playerSkill || playerSkill.Level < recipe.SkillLevelReq) continue;

            let hasAllIngredients = true;
            if (recipe.Ingredients) {
              for (const ing of recipe.Ingredients) {
                const invItem = inventory?.Items.find((i) => i.TypeID === ing.ItemCode && i.StackSize >= ing.StackSize);
                if (!invItem) {
                  hasAllIngredients = false;
                  break;
                }
              }
            }
            if (!hasAllIngredients) continue;

            const dedupeKey = `craftable_${typeId}`;
            if (seenItems.has(dedupeKey)) continue;
            seenItems.add(dedupeKey);

            gifts.push({
              itemName: cdnItem.Name,
              typeId,
              stackSize: 0,
              value: cdnItem.Value ?? 0,
              desire: pref.Desire,
              pref: pref.Pref,
              source: 'craftable',
              vaultName: 'Craftable',
            });
            break; // One recipe match is enough
          }
        }
      }
    }

    // Sort: Love first, then by pref descending, then by value descending
    gifts.sort((a, b) => {
      if (a.desire === 'Love' && b.desire !== 'Love') return -1;
      if (b.desire === 'Love' && a.desire !== 'Love') return 1;
      if (a.pref !== b.pref) return b.pref - a.pref;
      return b.value - a.value;
    });

    return gifts;
  }, [npcId, mode, inventory, indexes, character]);
}
