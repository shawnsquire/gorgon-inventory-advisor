import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DropZone } from './DropZone';
import { processFiles } from './importActions';
import { useAppStore } from '@/lib/store';
import type { InventoryExport } from '@/types/inventory';
import type { CharacterExport } from '@/types/character';

export function ImportPage() {
  const navigate = useNavigate();
  const setInventory = useAppStore((s) => s.setInventory);
  const setCharacter = useAppStore((s) => s.setCharacter);
  const persistToDb = useAppStore((s) => s.persistToDb);

  const [characterLoaded, setCharacterLoaded] = useState(false);
  const [inventoryLoaded, setInventoryLoaded] = useState(false);
  const [characterSummary, setCharacterSummary] = useState('');
  const [inventorySummary, setInventorySummary] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList) => {
      setProcessing(true);
      setErrors([]);

      const results = await processFiles(files);
      const newErrors: string[] = [];

      for (const { fileName, result } of results) {
        if (result.error) {
          newErrors.push(`${fileName}: ${result.error}`);
          continue;
        }

        if (result.type === 'character' && result.data) {
          setCharacter(result.data as CharacterExport);
          setCharacterLoaded(true);
          setCharacterSummary(result.summary ?? '');
        } else if (result.type === 'inventory' && result.data) {
          setInventory(result.data as InventoryExport);
          setInventoryLoaded(true);
          setInventorySummary(result.summary ?? '');
        }
      }

      setErrors(newErrors);
      setProcessing(false);
    },
    [setCharacter, setInventory],
  );

  const handleContinue = useCallback(async () => {
    await persistToDb();
    navigate('/dashboard');
  }, [navigate, persistToDb]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-10 py-10">
      <DropZone onFiles={handleFiles} disabled={processing}>
        <div className="text-5xl mb-4 opacity-60">&#9876;</div>
        <h1 className="font-display text-3xl text-gorgon-text-bright mb-2 tracking-wide">
          Gorgon Inventory Advisor
        </h1>
        <p className="text-gorgon-text-dim text-base mb-6 leading-relaxed">
          Drop your Project Gorgon JSON export files here
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <div
            className={`rounded-lg px-4 py-2.5 text-sm border ${
              characterLoaded
                ? 'bg-action-green-dim border-action-green text-action-green'
                : 'bg-gorgon-card border-gorgon-border text-gorgon-text'
            }`}
          >
            {characterLoaded ? `\u2713 Character: ${characterSummary}` : 'Character JSON (recommended)'}
          </div>
          <div
            className={`rounded-lg px-4 py-2.5 text-sm border ${
              inventoryLoaded
                ? 'bg-action-green-dim border-action-green text-action-green'
                : 'bg-gorgon-card border-gorgon-border text-gorgon-text'
            }`}
          >
            {inventoryLoaded ? `\u2713 Inventory: ${inventorySummary}` : 'Inventory JSON (required)'}
          </div>
        </div>
      </DropZone>

      {errors.length > 0 && (
        <div className="mt-4 max-w-xl w-full">
          {errors.map((err, i) => (
            <div key={i} className="text-action-red text-sm bg-action-red-dim/30 rounded-lg px-4 py-2 mb-1">
              {err}
            </div>
          ))}
        </div>
      )}

      {inventoryLoaded && (
        <button
          onClick={handleContinue}
          className="mt-6 px-8 py-3 rounded-lg bg-action-green-dim border border-action-green
                     text-action-green font-semibold text-base hover:bg-action-green/20 transition-colors"
        >
          Continue to Dashboard &rarr;
        </button>
      )}

      <p className="text-gorgon-text-dim text-xs mt-6 max-w-md text-center leading-relaxed">
        Export from Project Gorgon using the Gorgon Lore Exporter addon.
        Character JSON enables skill-aware recommendations, quest detection, and NPC gift suggestions.
      </p>
    </div>
  );
}
