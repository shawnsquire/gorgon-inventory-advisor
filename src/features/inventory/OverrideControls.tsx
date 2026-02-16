import { useState } from 'react';
import { ACTIONS, type ActionType } from '@/types/recommendations';
import { useAppStore } from '@/lib/store';

interface Props {
  itemName: string;
  overrideKey: string;
}

export function OverrideControls({ itemName, overrideKey }: Props) {
  const overrides = useAppStore((s) => s.overrides);
  const setOverride = useAppStore((s) => s.setOverride);
  const clearOverride = useAppStore((s) => s.clearOverride);
  const keepQuantities = useAppStore((s) => s.keepQuantities);
  const setKeepQuantity = useAppStore((s) => s.setKeepQuantity);
  const persistToDb = useAppStore((s) => s.persistToDb);

  const existing = overrides[itemName] ?? overrides[overrideKey];
  const [action, setAction] = useState<ActionType | ''>(existing?.action ?? '');
  const [reason, setReason] = useState(existing?.reason ?? '');
  const [keepQty, setKeepQty] = useState<string>(
    keepQuantities[itemName]?.toString() ?? '',
  );

  function handleSave() {
    if (action) {
      setOverride(itemName, { action, reason: reason || `Manual: ${ACTIONS[action].label}` });
    }
    if (keepQty !== '' && !isNaN(Number(keepQty))) {
      setKeepQuantity(itemName, parseInt(keepQty));
    }
    void persistToDb();
  }

  function handleClear() {
    clearOverride(itemName);
    clearOverride(overrideKey);
    setAction('');
    setReason('');
    void persistToDb();
  }

  return (
    <div className="bg-gorgon-panel border border-gorgon-border rounded-lg p-4">
      <h4 className="text-sm font-semibold text-gorgon-text-bright mb-3">
        Override: {itemName}
      </h4>

      {/* Action buttons */}
      <div className="flex gap-1.5 flex-wrap mb-3">
        {(Object.keys(ACTIONS) as ActionType[]).map((key) => (
          <button
            key={key}
            onClick={() => setAction(key)}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              action === key
                ? 'bg-action-blue-dim text-action-blue font-semibold'
                : 'bg-gorgon-dark text-gorgon-text-dim hover:text-gorgon-text'
            }`}
          >
            {ACTIONS[key].icon} {ACTIONS[key].label}
          </button>
        ))}
      </div>

      {/* Reason + keep qty + save */}
      <div className="flex gap-2 items-center">
        <input
          type="text"
          placeholder="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="flex-1 bg-gorgon-dark border border-gorgon-border text-gorgon-text
                     px-2.5 py-1.5 rounded text-sm outline-none"
        />
        <label className="flex items-center gap-1 text-sm text-gorgon-text-dim">
          Keep:
          <input
            type="number"
            min={0}
            value={keepQty}
            onChange={(e) => setKeepQty(e.target.value)}
            className="w-14 bg-gorgon-dark border border-gorgon-border text-gorgon-text
                       px-1.5 py-1.5 rounded text-sm text-center outline-none"
          />
        </label>
        <button
          onClick={handleSave}
          className="bg-action-green-dim border border-action-green text-action-green
                     px-3 py-1.5 rounded text-sm hover:bg-action-green/20 transition-colors"
        >
          Save
        </button>
        {existing && (
          <button
            onClick={handleClear}
            className="border border-gorgon-border text-action-red
                       px-3 py-1.5 rounded text-sm hover:bg-action-red-dim transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
