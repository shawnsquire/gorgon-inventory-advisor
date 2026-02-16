import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { BuildConfigEditor } from './BuildConfig';
import { KeepQuantitiesEditor } from './KeepQuantities';
import { Card } from '@/shared/components/Card';
import { EmptyState } from '@/shared/components/EmptyState';
import { clearGameDataCache } from '@/lib/cdn';

export function SettingsPage() {
  const navigate = useNavigate();
  const inventory = useAppStore((s) => s.inventory);
  const character = useAppStore((s) => s.character);
  const indexes = useAppStore((s) => s.indexes);
  const buildConfig = useAppStore((s) => s.buildConfig);
  const overrides = useAppStore((s) => s.overrides);
  const clearAllOverrides = useAppStore((s) => s.clearAllOverrides);
  const persistToDb = useAppStore((s) => s.persistToDb);
  const reset = useAppStore((s) => s.reset);

  useEffect(() => {
    if (!inventory) navigate('/import', { replace: true });
  }, [inventory, navigate]);

  if (!character || !indexes || !buildConfig) {
    return <EmptyState icon="&#9881;" title="Loading settings..." />;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
      <h1 className="font-display text-2xl text-gorgon-text-bright tracking-wide">Settings</h1>

      {/* Build Configuration */}
      <BuildConfigEditor
        character={character}
        indexes={indexes}
        buildConfig={buildConfig}
      />

      {/* Keep Quantities */}
      <KeepQuantitiesEditor />

      {/* Overrides summary */}
      <Card title="Item Overrides">
        {Object.keys(overrides).length === 0 ? (
          <p className="text-sm text-gorgon-text-dim">No overrides set. Click items in the inventory view to override recommendations.</p>
        ) : (
          <>
            <p className="text-sm text-gorgon-text-dim mb-3">
              {Object.keys(overrides).length} item(s) have custom overrides.
            </p>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {Object.entries(overrides).map(([name, ov]) => (
                <div key={name} className="flex items-center justify-between text-sm bg-gorgon-panel px-3 py-1.5 rounded">
                  <span className="text-gorgon-text">{name}: <span className="text-gorgon-text-dim">{ov.action}</span></span>
                  <span className="text-xs text-gorgon-text-dim">{ov.reason}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => { clearAllOverrides(); void persistToDb(); }}
              className="mt-3 text-sm text-action-red hover:text-action-red/80 transition-colors"
            >
              Clear all overrides
            </button>
          </>
        )}
      </Card>

      {/* Data management */}
      <Card title="Data Management">
        <div className="space-y-3">
          <button
            onClick={() => navigate('/import')}
            className="text-sm text-gorgon-text-dim hover:text-gorgon-text bg-gorgon-panel
                       border border-gorgon-border px-3 py-1.5 rounded transition-colors"
          >
            Re-import character data
          </button>
          <button
            onClick={async () => {
              await clearGameDataCache();
              window.location.reload();
            }}
            className="text-sm text-gorgon-text-dim hover:text-gorgon-text bg-gorgon-panel
                       border border-gorgon-border px-3 py-1.5 rounded transition-colors ml-2"
          >
            Re-fetch game data from CDN
          </button>
          <button
            onClick={() => { reset(); navigate('/import'); }}
            className="text-sm text-action-red hover:text-action-red/80 bg-gorgon-panel
                       border border-gorgon-border px-3 py-1.5 rounded transition-colors ml-2"
          >
            Reset all data
          </button>
        </div>
      </Card>
    </div>
  );
}
