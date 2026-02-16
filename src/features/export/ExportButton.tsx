import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { analyzeInventory } from '@/features/recommendations/engine';
import { generateTextPlan, generateCsvPlan, downloadFile } from './planGenerator';

export function ExportButton() {
  const [showMenu, setShowMenu] = useState(false);
  const inventory = useAppStore((s) => s.inventory);
  const character = useAppStore((s) => s.character);
  const indexes = useAppStore((s) => s.indexes);
  const buildConfig = useAppStore((s) => s.buildConfig);
  const overrides = useAppStore((s) => s.overrides);
  const keepQuantities = useAppStore((s) => s.keepQuantities);

  const analyzed = useMemo(() => {
    if (!inventory?.Items || !character || !indexes || !buildConfig) return [];
    return analyzeInventory(
      inventory.Items, character, indexes, buildConfig, overrides, keepQuantities,
    );
  }, [inventory, character, indexes, buildConfig, overrides, keepQuantities]);

  if (!inventory || analyzed.length === 0) return null;

  const charName = character?.Character ?? 'Unknown';

  function handleExportText() {
    const content = generateTextPlan(analyzed, charName);
    downloadFile(content, `${charName}_action_plan.txt`, 'text/plain');
    setShowMenu(false);
  }

  function handleExportCsv() {
    const content = generateCsvPlan(analyzed);
    downloadFile(content, `${charName}_action_plan.csv`, 'text/csv');
    setShowMenu(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu((s) => !s)}
        className="text-sm text-gorgon-text-dim hover:text-gorgon-text bg-gorgon-card
                   border border-gorgon-border rounded-md px-3 py-1.5 transition-colors"
      >
        Export Plan
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-1 bg-gorgon-panel border border-gorgon-border
                          rounded-lg shadow-xl z-50 min-w-[160px]">
            <button
              onClick={handleExportText}
              className="w-full text-left px-4 py-2.5 text-sm text-gorgon-text hover:bg-gorgon-hover
                         transition-colors rounded-t-lg"
            >
              Text Plan (.txt)
            </button>
            <button
              onClick={handleExportCsv}
              className="w-full text-left px-4 py-2.5 text-sm text-gorgon-text hover:bg-gorgon-hover
                         transition-colors rounded-b-lg border-t border-gorgon-border"
            >
              Spreadsheet (.csv)
            </button>
          </div>
        </>
      )}
    </div>
  );
}
