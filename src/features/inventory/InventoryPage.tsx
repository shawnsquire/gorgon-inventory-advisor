import { useMemo, useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { detectBuild } from '@/features/recommendations/buildDetection';
import { useAnalyzedInventory } from '@/shared/hooks/useAnalyzedInventory';
import { Toolbar } from './Toolbar';
import { ItemList } from './ItemList';
import { ItemDetailDrawer } from './ItemDetailDrawer';
import { EmptyState } from '@/shared/components/EmptyState';
import type { InventoryItem } from '@/types/inventory';
import type { Recommendation, ActionType } from '@/types/recommendations';

export type AnalyzedItem = InventoryItem & { recommendation: Recommendation; _idx: number };

export function InventoryPage() {
  const navigate = useNavigate();
  const { vault: vaultParam } = useParams();
  const [searchParams] = useSearchParams();
  const actionParam = searchParams.get('action') as ActionType | null;

  const inventory = useAppStore((s) => s.inventory);
  const character = useAppStore((s) => s.character);
  const indexes = useAppStore((s) => s.indexes);
  const buildConfig = useAppStore((s) => s.buildConfig);
  const setBuildConfig = useAppStore((s) => s.setBuildConfig);

  const inventoryFilters = useAppStore((s) => s.inventoryFilters);
  const setInventoryFilters = useAppStore((s) => s.setInventoryFilters);

  const [selectedItem, setSelectedItem] = useState<AnalyzedItem | null>(null);

  const { search, filterVault, filterAction, filterCategory, sortBy, filterUncertain } = inventoryFilters;
  const setSearch = useCallback((v: string) => setInventoryFilters({ search: v }), [setInventoryFilters]);
  const setFilterVault = useCallback((v: string) => setInventoryFilters({ filterVault: v }), [setInventoryFilters]);
  const setFilterAction = useCallback((v: string) => setInventoryFilters({ filterAction: v }), [setInventoryFilters]);
  const setFilterCategory = useCallback((v: string) => setInventoryFilters({ filterCategory: v }), [setInventoryFilters]);
  const setSortBy = useCallback((v: string) => setInventoryFilters({ sortBy: v }), [setInventoryFilters]);
  const setFilterUncertain = useCallback((v: boolean) => setInventoryFilters({ filterUncertain: v }), [setInventoryFilters]);

  // Sync URL params to filter state
  useEffect(() => {
    if (vaultParam) setFilterVault(decodeURIComponent(vaultParam));
  }, [vaultParam, setFilterVault]);

  useEffect(() => {
    if (actionParam) setFilterAction(actionParam);
  }, [actionParam, setFilterAction]);

  // Redirect to import if no data
  useEffect(() => {
    if (!inventory) navigate('/import', { replace: true });
  }, [inventory, navigate]);

  // Auto-detect build
  useEffect(() => {
    if (character && indexes && !buildConfig) {
      const detected = detectBuild(character, indexes);
      setBuildConfig(detected);
    }
  }, [character, indexes, buildConfig, setBuildConfig]);

  const baseAnalyzed = useAnalyzedInventory();
  const analyzed = useMemo(
    () => baseAnalyzed.map((item, idx) => ({ ...item, _idx: idx })),
    [baseAnalyzed],
  );

  // Derived filter options
  const vaults = useMemo(() => [...new Set(analyzed.map((i) => i.StorageVault ?? ''))].sort(), [analyzed]);
  const categories = useMemo(() => [...new Set(analyzed.map((i) => i.recommendation.category))].sort(), [analyzed]);

  // Count uncertain items (before filtering)
  const uncertainCount = useMemo(() => analyzed.filter((i) => i.recommendation.uncertain).length, [analyzed]);

  // Count archived items (before filtering)
  const archivedCount = useMemo(() => analyzed.filter((i) => i.recommendation.action.type === 'ARCHIVE').length, [analyzed]);

  // Apply filters and sort
  const filtered = useMemo(() => {
    let items = analyzed;

    // Hide archived items unless explicitly filtering by ARCHIVE
    if (filterAction !== 'ARCHIVE') items = items.filter((i) => i.recommendation.action.type !== 'ARCHIVE');

    if (filterVault !== 'all') items = items.filter((i) => i.StorageVault === filterVault);
    if (filterAction !== 'all') items = items.filter((i) => i.recommendation.action.type === filterAction);
    if (filterCategory !== 'all') items = items.filter((i) => i.recommendation.category === filterCategory);
    if (filterUncertain) items = items.filter((i) => i.recommendation.uncertain);
    if (search) {
      const s = search.toLowerCase();
      items = items.filter((i) => i.Name.toLowerCase().includes(s));
    }

    // Sort
    if (sortBy === 'action') {
      const order: ActionType[] = [
        'SELL_ALL', 'SELL_SOME', 'DISENCHANT', 'USE',
        'LEVEL_LATER', 'INGREDIENT', 'DEPLOY', 'GIFT', 'QUEST', 'USE_COMBAT', 'KEEP', 'ARCHIVE',
      ];
      items = [...items].sort((a, b) => {
        const orderDiff = order.indexOf(a.recommendation.action.type) - order.indexOf(b.recommendation.action.type);
        if (orderDiff !== 0) return orderDiff;
        // Within same action group, uncertain items first
        const aUnc = a.recommendation.uncertain ? 0 : 1;
        const bUnc = b.recommendation.uncertain ? 0 : 1;
        return aUnc - bUnc;
      });
    } else if (sortBy === 'value') {
      items = [...items].sort((a, b) => (b.Value * b.StackSize) - (a.Value * a.StackSize));
    } else if (sortBy === 'name') {
      items = [...items].sort((a, b) => a.Name.localeCompare(b.Name));
    } else if (sortBy === 'storage') {
      items = [...items].sort((a, b) => (a.StorageVault ?? '').localeCompare(b.StorageVault ?? ''));
    } else if (sortBy === 'score') {
      items = [...items].sort((a, b) => (b.recommendation.gearScore ?? -1) - (a.recommendation.gearScore ?? -1));
    }

    return items;
  }, [analyzed, filterVault, filterAction, filterCategory, filterUncertain, search, sortBy]);

  const handleItemClick = useCallback((item: AnalyzedItem) => {
    setSelectedItem(item);
  }, []);

  if (!inventory || !character || !indexes || !buildConfig) {
    return <EmptyState icon="&#9876;" title="Loading..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <Toolbar
        search={search}
        onSearchChange={setSearch}
        filterVault={filterVault}
        onVaultChange={setFilterVault}
        filterAction={filterAction}
        onActionChange={setFilterAction}
        filterCategory={filterCategory}
        onCategoryChange={setFilterCategory}
        sortBy={sortBy}
        onSortChange={setSortBy}
        filterUncertain={filterUncertain}
        onUncertainChange={setFilterUncertain}
        vaults={vaults}
        categories={categories}
        totalCount={filtered.length}
        uncertainCount={uncertainCount}
        archivedCount={archivedCount}
        indexes={indexes}
      />

      <ItemList items={filtered} onItemClick={handleItemClick} indexes={indexes} />

      <ItemDetailDrawer
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        character={character}
        indexes={indexes}
        build={buildConfig}
      />
    </div>
  );
}
