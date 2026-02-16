import Dexie, { type EntityTable } from 'dexie';
import type { InventoryExport } from '@/types/inventory';
import type { CharacterExport } from '@/types/character';
import type { ItemOverride, BuildConfig } from '@/types/recommendations';

/** Cached CDN game data file */
export interface GameDataEntry {
  name: string;
  data: unknown;
  fetchedAt: number;
}

/** Per-character persisted data */
export interface CharacterEntry {
  name: string;
  inventory: InventoryExport | null;
  character: CharacterExport | null;
  overrides: Record<string, ItemOverride>;
  keepQuantities: Record<string, number>;
  buildConfig: BuildConfig | null;
  lastImported: number;
}

/** Key-value settings */
export interface SettingEntry {
  key: string;
  value: unknown;
}

class GorgonDB extends Dexie {
  gameData!: EntityTable<GameDataEntry, 'name'>;
  characters!: EntityTable<CharacterEntry, 'name'>;
  settings!: EntityTable<SettingEntry, 'key'>;

  constructor() {
    super('GorgonInventoryAdvisor');
    this.version(1).stores({
      gameData: 'name',
      characters: 'name',
      settings: 'key',
    });
  }
}

export const db = new GorgonDB();

// --- Convenience helpers ---

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const entry = await db.settings.get(key);
  return entry ? (entry.value as T) : defaultValue;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await db.settings.put({ key, value });
}

export async function getCharacter(name: string): Promise<CharacterEntry | undefined> {
  return db.characters.get(name);
}

export async function saveCharacter(entry: CharacterEntry): Promise<void> {
  await db.characters.put(entry);
}

export async function getGameDataEntry(name: string): Promise<GameDataEntry | undefined> {
  return db.gameData.get(name);
}

export async function saveGameData(name: string, data: unknown): Promise<void> {
  await db.gameData.put({ name, data, fetchedAt: Date.now() });
}
