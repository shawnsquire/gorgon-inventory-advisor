import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { Card } from '@/shared/components/Card';

export function KeepQuantitiesEditor() {
  const keepQuantities = useAppStore((s) => s.keepQuantities);
  const setKeepQuantity = useAppStore((s) => s.setKeepQuantity);
  const persistToDb = useAppStore((s) => s.persistToDb);

  const [search, setSearch] = useState('');

  const entries = useMemo(() => {
    return Object.entries(keepQuantities)
      .sort(([a], [b]) => a.localeCompare(b))
      .filter(([name]) =>
        search === '' || name.toLowerCase().includes(search.toLowerCase()),
      );
  }, [keepQuantities, search]);

  const hasEntries = Object.keys(keepQuantities).length > 0;

  return (
    <Card title="Keep Quantity Overrides">
      <p className="text-sm text-gorgon-text-dim mb-3">
        Override how many of each stackable item to keep. Items above this count will be flagged &quot;Sell Some&quot;.
        The recommendation engine handles most items automatically &mdash; use these for fine-tuning.
      </p>

      {hasEntries && (
        <input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-gorgon-dark border border-gorgon-border text-gorgon-text
                     px-3 py-2 rounded-md text-sm outline-none mb-3
                     placeholder:text-gorgon-text-dim"
        />
      )}

      {hasEntries ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 max-h-80 overflow-y-auto">
          {entries.map(([name, qty]) => (
            <div
              key={name}
              className="flex items-center gap-2 px-2 py-1 rounded bg-gorgon-panel"
            >
              <span className="flex-1 text-sm truncate text-gorgon-text">
                {name}
              </span>
              <input
                type="number"
                min={0}
                value={qty}
                onChange={(e) => {
                  setKeepQuantity(name, parseInt(e.target.value) || 0);
                  void persistToDb();
                }}
                className="w-14 bg-gorgon-dark border border-gorgon-border text-gorgon-text-bright
                           px-1 py-0.5 rounded text-sm text-center outline-none"
              />
            </div>
          ))}
          {entries.length === 0 && (
            <p className="text-sm text-gorgon-text-dim text-center py-4 col-span-full">
              No items match &quot;{search}&quot;
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-gorgon-text-dim text-center py-4">
          No overrides set. Click items in the inventory view to set custom keep quantities.
        </p>
      )}
    </Card>
  );
}
