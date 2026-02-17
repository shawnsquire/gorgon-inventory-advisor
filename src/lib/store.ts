import { create } from 'zustand';
import type { InventoryExport } from '@/types/inventory';
import type { CharacterExport } from '@/types/character';
import type { ItemOverride, BuildConfig } from '@/types/recommendations';
import type { GameDataIndexes } from '@/lib/cdn-indexes';
import type { NpcPriorityStatus } from '@/features/relationships/types';

import { db } from './db';
import { PLAYER_INVENTORY } from '@/shared/utils/friendlyNames';

// --- Default keep quantities ---
export const DEFAULT_KEEP_QUANTITIES: Record<string, number> = {};

export const DEFAULT_GEM_KEEP = 5;

// --- Store ---

interface AppState {
  // --- User Data ---
  activeCharacter: string | null;
  inventory: InventoryExport | null;
  character: CharacterExport | null;
  overrides: Record<string, ItemOverride>;
  keepQuantities: Record<string, number>;
  buildConfig: BuildConfig | null;
  npcPriorities: Record<string, NpcPriorityStatus>;

  // --- Game Data ---
  indexes: GameDataIndexes | null;
  gameDataLoading: boolean;
  gameDataError: string | null;

  // --- Actions ---
  setInventory: (data: InventoryExport) => void;
  setCharacter: (data: CharacterExport) => void;
  setIndexes: (indexes: GameDataIndexes) => void;
  setGameDataLoading: (loading: boolean) => void;
  setGameDataError: (error: string | null) => void;

  setOverride: (key: string, override: ItemOverride) => void;
  clearOverride: (key: string) => void;
  clearAllOverrides: () => void;

  setKeepQuantity: (itemName: string, quantity: number) => void;
  getKeepQuantity: (itemName: string) => number | undefined;

  setBuildConfig: (config: BuildConfig) => void;

  setNpcPriority: (npcId: string, status: NpcPriorityStatus) => void;
  clearNpcPriority: (npcId: string) => void;

  reset: () => void;

  /** Persist current character's data to IndexedDB */
  persistToDb: () => Promise<void>;
  /** Load character data from IndexedDB */
  loadFromDb: (characterName: string) => Promise<boolean>;
}

export const useAppStore = create<AppState>((set, get) => ({
  activeCharacter: null,
  inventory: null,
  character: null,
  overrides: {},
  keepQuantities: { ...DEFAULT_KEEP_QUANTITIES },
  buildConfig: null,
  npcPriorities: {},

  indexes: null,
  gameDataLoading: true,
  gameDataError: null,

  setInventory: (data) => {
    for (const item of data.Items) {
      if (!item.StorageVault) item.StorageVault = PLAYER_INVENTORY;
    }
    set({ inventory: data, activeCharacter: data.Character });
  },

  setCharacter: (data) => {
    set({ character: data, activeCharacter: data.Character });
  },

  setIndexes: (indexes) => set({ indexes }),
  setGameDataLoading: (loading) => set({ gameDataLoading: loading }),
  setGameDataError: (error) => set({ gameDataError: error }),

  setOverride: (key, override) => {
    set((s) => ({ overrides: { ...s.overrides, [key]: override } }));
  },

  clearOverride: (key) => {
    set((s) => {
      const next = { ...s.overrides };
      delete next[key];
      return { overrides: next };
    });
  },

  clearAllOverrides: () => set({ overrides: {} }),

  setKeepQuantity: (itemName, quantity) => {
    set((s) => ({ keepQuantities: { ...s.keepQuantities, [itemName]: quantity } }));
  },

  getKeepQuantity: (itemName) => {
    return get().keepQuantities[itemName];
  },

  setBuildConfig: (config) => set({ buildConfig: config }),

  setNpcPriority: (npcId, status) => {
    set((s) => ({ npcPriorities: { ...s.npcPriorities, [npcId]: status } }));
  },

  clearNpcPriority: (npcId) => {
    set((s) => {
      const next = { ...s.npcPriorities };
      delete next[npcId];
      return { npcPriorities: next };
    });
  },

  reset: () => {
    set({
      activeCharacter: null,
      inventory: null,
      character: null,
      overrides: {},
      keepQuantities: { ...DEFAULT_KEEP_QUANTITIES },
      buildConfig: null,
      npcPriorities: {},
    });
  },

  persistToDb: async () => {
    const state = get();
    const name = state.activeCharacter;
    if (!name) return;

    await db.characters.put({
      name,
      inventory: state.inventory,
      character: state.character,
      overrides: state.overrides,
      keepQuantities: state.keepQuantities,
      buildConfig: state.buildConfig,
      npcPriorities: state.npcPriorities,
      lastImported: Date.now(),
    });

    // Remember which character was last active so we can restore on refresh
    await db.settings.put({ key: 'activeCharacter', value: name });
  },

  loadFromDb: async (characterName) => {
    const entry = await db.characters.get(characterName);
    if (!entry) return false;

    // Normalize items missing StorageVault (player bags / equipped)
    if (entry.inventory?.Items) {
      for (const item of entry.inventory.Items) {
        if (!item.StorageVault) item.StorageVault = PLAYER_INVENTORY;
      }
    }

    set({
      activeCharacter: entry.name,
      inventory: entry.inventory,
      character: entry.character,
      overrides: entry.overrides,
      keepQuantities: { ...DEFAULT_KEEP_QUANTITIES, ...entry.keepQuantities },
      buildConfig: entry.buildConfig,
      npcPriorities: entry.npcPriorities ?? {},
    });
    return true;
  },
}));
