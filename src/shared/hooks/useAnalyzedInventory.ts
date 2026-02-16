import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { analyzeInventory } from '@/features/recommendations/engine';
import type { InventoryItem } from '@/types/inventory';
import type { Recommendation } from '@/types/recommendations';

export type AnalyzedInventoryItem = InventoryItem & { recommendation: Recommendation };

export function useAnalyzedInventory(): AnalyzedInventoryItem[] {
  const inventory = useAppStore((s) => s.inventory);
  const character = useAppStore((s) => s.character);
  const indexes = useAppStore((s) => s.indexes);
  const buildConfig = useAppStore((s) => s.buildConfig);
  const overrides = useAppStore((s) => s.overrides);
  const keepQuantities = useAppStore((s) => s.keepQuantities);

  return useMemo(() => {
    if (!inventory?.Items || !character || !indexes || !buildConfig) return [];
    return analyzeInventory(
      inventory.Items, character, indexes, buildConfig, overrides, keepQuantities,
    );
  }, [inventory, character, indexes, buildConfig, overrides, keepQuantities]);
}
