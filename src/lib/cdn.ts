import { db, saveGameData, getGameDataEntry } from './db';

const CDN_VERSION = 'v457';
const CDN_BASE = `https://cdn.projectgorgon.com/${CDN_VERSION}/data/`;
const CDN_ICONS = `https://cdn.projectgorgon.com/${CDN_VERSION}/icons/`;

/** Get the CDN icon URL for a given IconId. */
export function getIconUrl(iconId: number): string {
  return `${CDN_ICONS}icon_${iconId}.png`;
}

export const CDN_FILES = [
  'items',
  'recipes',
  'quests',
  'skills',
  'npcs',
  'sources_items',
  'storagevaults',
  'tsysclientinfo',
  'abilities',
] as const;

export type CdnFileName = (typeof CDN_FILES)[number];

/** Max age before we re-fetch from CDN (7 days) */
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export interface FetchProgress {
  total: number;
  loaded: number;
  current: string;
  errors: string[];
}

async function fetchSingleFile(name: CdnFileName): Promise<unknown> {
  const url = `${CDN_BASE}${name}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${name}: ${res.status}`);
  return res.json();
}

/**
 * Check if we have fresh cached data for all files.
 * Returns the cached data map if all present and fresh, null otherwise.
 */
export async function getCachedGameData(): Promise<Record<CdnFileName, unknown> | null> {
  const now = Date.now();
  const result: Partial<Record<CdnFileName, unknown>> = {};

  for (const name of CDN_FILES) {
    const entry = await getGameDataEntry(name);
    if (!entry || now - entry.fetchedAt > CACHE_MAX_AGE) {
      return null;
    }
    result[name] = entry.data;
  }

  return result as Record<CdnFileName, unknown>;
}

/**
 * Fetch all CDN game data files. Uses cache when fresh, fetches from CDN otherwise.
 * Reports progress via callback.
 */
export async function fetchAllGameData(
  onProgress?: (progress: FetchProgress) => void,
): Promise<Record<CdnFileName, unknown>> {
  // Check cache first
  const cached = await getCachedGameData();
  if (cached) {
    onProgress?.({ total: CDN_FILES.length, loaded: CDN_FILES.length, current: 'cached', errors: [] });
    return cached;
  }

  const result: Partial<Record<CdnFileName, unknown>> = {};
  const errors: string[] = [];
  let loaded = 0;

  // Fetch all files, using cache for still-fresh individual files
  const promises = CDN_FILES.map(async (name) => {
    const entry = await getGameDataEntry(name);
    if (entry && Date.now() - entry.fetchedAt < CACHE_MAX_AGE) {
      result[name] = entry.data;
      loaded++;
      onProgress?.({ total: CDN_FILES.length, loaded, current: name, errors });
      return;
    }

    try {
      onProgress?.({ total: CDN_FILES.length, loaded, current: name, errors });
      const data = await fetchSingleFile(name);
      await saveGameData(name, data);
      result[name] = data;
      loaded++;
      onProgress?.({ total: CDN_FILES.length, loaded, current: name, errors });
    } catch (err) {
      // Fall back to stale cache if available
      if (entry) {
        result[name] = entry.data;
        loaded++;
        errors.push(`${name}: using stale cache`);
      } else {
        errors.push(`${name}: ${err instanceof Error ? err.message : 'unknown error'}`);
      }
      onProgress?.({ total: CDN_FILES.length, loaded, current: name, errors });
    }
  });

  await Promise.all(promises);

  // Check that all critical files loaded
  const missing = CDN_FILES.filter((name) => !(name in result));
  if (missing.length > 0) {
    throw new Error(`Failed to load required game data: ${missing.join(', ')}`);
  }

  return result as Record<CdnFileName, unknown>;
}

/** Clear all cached game data */
export async function clearGameDataCache(): Promise<void> {
  await db.gameData.clear();
}
