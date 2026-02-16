import { useState, useEffect, useCallback } from 'react';
import { fetchAllGameData, type CdnFileName, type FetchProgress } from '@/lib/cdn';
import { buildIndexes, type GameDataIndexes } from '@/lib/cdn-indexes';

export interface GameDataState {
  rawData: Record<CdnFileName, unknown> | null;
  indexes: GameDataIndexes | null;
  loading: boolean;
  error: string | null;
  progress: FetchProgress | null;
  reload: () => Promise<void>;
}

export function useGameData(): GameDataState {
  const [rawData, setRawData] = useState<Record<CdnFileName, unknown> | null>(null);
  const [indexes, setIndexes] = useState<GameDataIndexes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<FetchProgress | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllGameData(setProgress);
      setRawData(data);
      const idx = buildIndexes(data);
      setIndexes(idx);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load game data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { rawData, indexes, loading, error, progress, reload: load };
}
