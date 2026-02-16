import { useEffect, useState } from 'react';
import { HashRouter } from 'react-router-dom';
import { AppRouter } from './router';
import { AppHeader } from '@/shared/components/AppHeader';
import { OfflineBanner } from '@/shared/components/OfflineBanner';
import { InstallPrompt } from '@/shared/components/InstallPrompt';
import { useGameData } from '@/shared/hooks/useGameData';
import { useAppStore } from '@/lib/store';
import { db } from '@/lib/db';

export function App() {
  const { indexes, loading, error, progress } = useGameData();
  const setIndexes = useAppStore((s) => s.setIndexes);
  const setGameDataLoading = useAppStore((s) => s.setGameDataLoading);
  const setGameDataError = useAppStore((s) => s.setGameDataError);
  const loadFromDb = useAppStore((s) => s.loadFromDb);
  const activeCharacter = useAppStore((s) => s.activeCharacter);
  const [dbRestoreDone, setDbRestoreDone] = useState(false);

  // Restore last active character from IndexedDB on startup
  useEffect(() => {
    if (activeCharacter) {
      setDbRestoreDone(true);
      return;
    }
    (async () => {
      try {
        const entry = await db.settings.get('activeCharacter');
        if (entry?.value && typeof entry.value === 'string') {
          await loadFromDb(entry.value);
        }
      } catch {
        // IndexedDB unavailable or empty — proceed to import
      }
      setDbRestoreDone(true);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setGameDataLoading(loading);
  }, [loading, setGameDataLoading]);

  useEffect(() => {
    if (indexes) setIndexes(indexes);
  }, [indexes, setIndexes]);

  useEffect(() => {
    setGameDataError(error);
  }, [error, setGameDataError]);

  if (error && !indexes) {
    return (
      <div className="flex items-center justify-center min-h-screen px-8">
        <div className="bg-gorgon-panel border border-action-red/30 rounded-xl p-8 max-w-lg text-center">
          <div className="text-4xl mb-3">&#9888;</div>
          <h2 className="font-display text-xl text-gorgon-text-bright mb-2">
            Failed to Load Game Data
          </h2>
          <p className="text-gorgon-text-dim text-sm mb-4">{error}</p>
          <p className="text-gorgon-text-dim text-xs">
            Game data from the Project Gorgon CDN is required. Check your internet connection and try again.
          </p>
        </div>
      </div>
    );
  }

  if (loading || !dbRestoreDone) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-4xl mb-4 animate-pulse">&#9876;</div>
        <h1 className="font-display text-2xl text-gorgon-text-bright tracking-wide mb-3">
          Gorgon Inventory Advisor
        </h1>
        <p className="text-gorgon-text-dim text-sm">
          Loading game data...
          {progress && ` (${progress.loaded}/${progress.total})`}
        </p>
      </div>
    );
  }

  return (
    <HashRouter>
      <AppHeader />
      <AppRouter />
      <footer className="text-center text-gorgon-text-dim text-xs py-4 px-4 opacity-60">
        Some portions copyright &copy; 2026 Elder Game, LLC.
      </footer>
      <OfflineBanner />
      <InstallPrompt />
    </HashRouter>
  );
}
