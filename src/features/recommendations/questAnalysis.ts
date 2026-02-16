import type { InventoryItem } from '@/types/inventory';
import type { CharacterExport } from '@/types/character';
import type { CdnItem } from '@/types/cdn/items';
import type { GameDataIndexes } from '@/lib/cdn-indexes';

export interface QuestMatch {
  questInternalName: string;
  questName: string;
  itemName: string;
  count: number;
  isActive: boolean;
}

/**
 * Check if an inventory item is needed for any active quests.
 * Uses CDN quest objectives cross-referenced with character's ActiveQuests.
 */
export function analyzeQuestUses(
  item: InventoryItem,
  cdnItem: CdnItem | undefined,
  character: CharacterExport,
  indexes: GameDataIndexes,
): QuestMatch[] {
  const activeQuestSet = new Set(character.ActiveQuests);
  const matches: QuestMatch[] = [];

  // Check by item name in quest objectives
  const nameReqs = indexes.questItemRequirements.get(item.Name);
  if (nameReqs) {
    for (const req of nameReqs) {
      matches.push({
        ...req,
        isActive: activeQuestSet.has(req.questInternalName),
      });
    }
  }

  // Also check by CDN InternalName if different from Name
  if (cdnItem?.InternalName && cdnItem.InternalName !== item.Name) {
    const internalReqs = indexes.questItemRequirements.get(cdnItem.InternalName);
    if (internalReqs) {
      for (const req of internalReqs) {
        // Avoid duplicates
        if (!matches.some((m) => m.questInternalName === req.questInternalName)) {
          matches.push({
            ...req,
            isActive: activeQuestSet.has(req.questInternalName),
          });
        }
      }
    }
  }

  // Check MacGuffin quests
  if (cdnItem?.MacGuffinQuestName && activeQuestSet.has(cdnItem.MacGuffinQuestName)) {
    const quest = indexes.questsByInternalName.get(cdnItem.MacGuffinQuestName);
    if (quest && !matches.some((m) => m.questInternalName === cdnItem.MacGuffinQuestName)) {
      matches.push({
        questInternalName: cdnItem.MacGuffinQuestName,
        questName: quest.Name ?? cdnItem.MacGuffinQuestName,
        itemName: item.Name,
        count: 1,
        isActive: true,
      });
    }
  }

  return matches;
}

/**
 * Check if any active quest matches by name pattern (fallback heuristic).
 */
export function hasActiveQuestMatch(
  itemName: string,
  character: CharacterExport,
): boolean {
  const normalizedItem = itemName.toLowerCase().replace(/[^a-z]/g, '');
  for (const quest of character.ActiveQuests) {
    const normalizedQuest = quest.toLowerCase().replace(/[^a-z]/g, '');
    if (normalizedQuest.includes(normalizedItem) || normalizedItem.includes(normalizedQuest)) {
      return true;
    }
  }
  return false;
}
