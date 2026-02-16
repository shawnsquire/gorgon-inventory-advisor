import type { CdnFileName } from './cdn';
import type { CdnItem, CdnItemsFile } from '@/types/cdn/items';
import type { CdnRecipe, CdnRecipesFile } from '@/types/cdn/recipes';
import type { CdnQuest, CdnQuestsFile } from '@/types/cdn/quests';
import type { CdnSkill, CdnSkillsFile } from '@/types/cdn/skills';
import type { CdnNpcsFile } from '@/types/cdn/npcs';
import type { CdnStorageVault, CdnStorageVaultsFile } from '@/types/cdn/storagevaults';
import type { CdnTsysPower, CdnTsysClientInfoFile } from '@/types/cdn/tsysclientinfo';
import type { CdnSourcesFile, CdnItemSource } from '@/types/cdn/sources';
import type { CdnAbilitiesFile, CdnAbility } from '@/types/cdn/abilities';

export interface GameDataIndexes {
  /** item TypeID (number) -> CdnItem */
  itemsByTypeId: Map<number, CdnItem>;
  /** item InternalName -> CdnItem */
  itemsByInternalName: Map<string, CdnItem>;
  /** recipe InternalName -> CdnRecipe */
  recipesByInternalName: Map<string, CdnRecipe>;
  /** ingredient ItemCode -> recipes that use it */
  recipesByIngredient: Map<number, CdnRecipe[]>;
  /** quest InternalName -> CdnQuest */
  questsByInternalName: Map<string, CdnQuest>;
  /** item InternalName -> quests that need it (from objectives) */
  questItemRequirements: Map<string, QuestItemReq[]>;
  /** tsys power InternalName -> CdnTsysPower */
  tsysPowerByInternalName: Map<string, CdnTsysPower>;
  /** item keyword -> NPCs with preferences for that keyword */
  npcPreferenceIndex: Map<string, NpcPrefEntry[]>;
  /** Set of all combat skill InternalNames */
  combatSkills: Set<string>;
  /** skill InternalName -> CdnSkill */
  skillsByInternalName: Map<string, CdnSkill>;
  /** vault InternalName -> CdnStorageVault */
  vaultsByInternalName: Map<string, CdnStorageVault>;
  /** item InternalName -> sources */
  sourcesByItem: Map<string, CdnItemSource>;
  /** ability InternalName -> CdnAbility */
  abilitiesByInternalName: Map<string, CdnAbility>;
}

export interface QuestItemReq {
  questInternalName: string;
  questName: string;
  itemName: string;
  count: number;
}

export interface NpcPrefEntry {
  npcId: string;
  npcName: string;
  desire: string;
  pref: number;
}

/**
 * Build all cross-reference indexes from raw CDN data.
 * This is the most critical function in the app — it creates the lookup maps
 * that power the recommendation engine.
 */
export function buildIndexes(rawData: Record<CdnFileName, unknown>): GameDataIndexes {
  const items = rawData.items as CdnItemsFile;
  const recipes = rawData.recipes as CdnRecipesFile;
  const quests = rawData.quests as CdnQuestsFile;
  const skills = rawData.skills as CdnSkillsFile;
  const npcs = rawData.npcs as CdnNpcsFile;
  const storagevaults = rawData.storagevaults as CdnStorageVaultsFile;
  const tsysclientinfo = rawData.tsysclientinfo as CdnTsysClientInfoFile;
  const sourcesItems = rawData.sources_items as CdnSourcesFile;
  const abilities = rawData.abilities as CdnAbilitiesFile;

  // --- Items indexes ---
  const itemsByTypeId = new Map<number, CdnItem>();
  const itemsByInternalName = new Map<string, CdnItem>();
  for (const [key, item] of Object.entries(items)) {
    // Keys are like "item_12003" — extract the number
    const numStr = key.replace(/^item_/, '');
    const typeId = parseInt(numStr, 10);
    if (!isNaN(typeId)) {
      itemsByTypeId.set(typeId, item);
    }
    if (item.InternalName) {
      itemsByInternalName.set(item.InternalName, item);
    }
  }

  // --- Recipe indexes ---
  const recipesByInternalName = new Map<string, CdnRecipe>();
  const recipesByIngredient = new Map<number, CdnRecipe[]>();
  for (const [key, recipe] of Object.entries(recipes)) {
    recipesByInternalName.set(key, recipe);
    if (recipe.Ingredients) {
      for (const ing of recipe.Ingredients) {
        const existing = recipesByIngredient.get(ing.ItemCode);
        if (existing) {
          existing.push(recipe);
        } else {
          recipesByIngredient.set(ing.ItemCode, [recipe]);
        }
      }
    }
  }

  // --- Quest indexes ---
  const questsByInternalName = new Map<string, CdnQuest>();
  const questItemRequirements = new Map<string, QuestItemReq[]>();
  for (const [key, quest] of Object.entries(quests)) {
    questsByInternalName.set(key, quest);
    if (quest.Objectives) {
      for (const obj of quest.Objectives) {
        if (obj.Type === 'Collect' || obj.Type === 'Deliver' || obj.Type === 'Have') {
          const itemName = obj.ItemName ?? obj.Target;
          if (itemName) {
            const req: QuestItemReq = {
              questInternalName: key,
              questName: quest.Name ?? key,
              itemName,
              count: obj.Number ?? 1,
            };
            const existing = questItemRequirements.get(itemName);
            if (existing) {
              existing.push(req);
            } else {
              questItemRequirements.set(itemName, [req]);
            }
          }
        }
      }
    }
  }

  // --- Skills indexes ---
  const combatSkills = new Set<string>();
  const skillsByInternalName = new Map<string, CdnSkill>();
  for (const [key, skill] of Object.entries(skills)) {
    skillsByInternalName.set(key, skill);
    if (skill.Combat) {
      combatSkills.add(key);
    }
  }

  // --- TSys Power index ---
  const tsysPowerByInternalName = new Map<string, CdnTsysPower>();
  for (const [key, power] of Object.entries(tsysclientinfo)) {
    tsysPowerByInternalName.set(key, power);
  }

  // --- NPC Preference index ---
  const npcPreferenceIndex = new Map<string, NpcPrefEntry[]>();
  for (const [npcId, npc] of Object.entries(npcs)) {
    if (!npc.Preferences) continue;
    for (const pref of npc.Preferences) {
      if (!pref.Keywords) continue;
      for (const keyword of pref.Keywords) {
        const entry: NpcPrefEntry = {
          npcId,
          npcName: npc.Name,
          desire: pref.Desire,
          pref: pref.Pref,
        };
        const existing = npcPreferenceIndex.get(keyword);
        if (existing) {
          existing.push(entry);
        } else {
          npcPreferenceIndex.set(keyword, [entry]);
        }
      }
    }
  }

  // --- Vault index ---
  const vaultsByInternalName = new Map<string, CdnStorageVault>();
  for (const [key, vault] of Object.entries(storagevaults)) {
    vaultsByInternalName.set(key, vault);
  }

  // --- Sources index ---
  const sourcesByItem = new Map<string, CdnItemSource>();
  for (const [key, source] of Object.entries(sourcesItems)) {
    sourcesByItem.set(key, source);
  }

  // --- Abilities index ---
  const abilitiesByInternalName = new Map<string, CdnAbility>();
  for (const [key, ability] of Object.entries(abilities)) {
    abilitiesByInternalName.set(key, ability);
  }

  return {
    itemsByTypeId,
    itemsByInternalName,
    recipesByInternalName,
    recipesByIngredient,
    questsByInternalName,
    questItemRequirements,
    tsysPowerByInternalName,
    npcPreferenceIndex,
    combatSkills,
    skillsByInternalName,
    vaultsByInternalName,
    sourcesByItem,
    abilitiesByInternalName,
  };
}
