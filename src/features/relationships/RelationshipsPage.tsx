import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { EmptyState } from '@/shared/components/EmptyState';
import { Card } from '@/shared/components/Card';
import { NpcFilters } from './NpcFilters';
import { NpcList } from './NpcList';
import { NpcDetailPanel } from './NpcDetailPanel';
import { useNpcRelationships } from './useNpcRelationships';
import type { RelationshipFilterState } from './types';
import type { GameDataIndexes } from '@/lib/cdn-indexes';

export function RelationshipsPage() {
  const navigate = useNavigate();
  const { npcId: npcIdParam } = useParams();
  const inventory = useAppStore((s) => s.inventory);
  const indexes = useAppStore((s) => s.indexes);
  const filters = useAppStore((s) => s.relationshipFilters);
  const setFiltersPartial = useAppStore((s) => s.setRelationshipFilters);
  const mode = useAppStore((s) => s.relationshipMode);
  const setMode = useAppStore((s) => s.setRelationshipMode);

  const setFilters = useCallback(
    (update: RelationshipFilterState | ((prev: RelationshipFilterState) => RelationshipFilterState)) => {
      if (typeof update === 'function') {
        const current = useAppStore.getState().relationshipFilters;
        setFiltersPartial(update(current));
      } else {
        setFiltersPartial(update);
      }
    },
    [setFiltersPartial],
  );

  const [selectedNpcId, setSelectedNpcId] = useState<string | null>(npcIdParam ?? null);
  const [showDetail, setShowDetail] = useState(!!npcIdParam);

  // Redirect to import if no data
  useEffect(() => {
    if (!inventory) navigate('/import', { replace: true });
  }, [inventory, navigate]);

  // Sync URL param to state when navigating directly
  useEffect(() => {
    if (npcIdParam && npcIdParam !== selectedNpcId) {
      setSelectedNpcId(npcIdParam);
      setShowDetail(true);
    }
  }, [npcIdParam]); // eslint-disable-line react-hooks/exhaustive-deps

  const { npcs, areas, favorLevels } = useNpcRelationships();

  const selectedNpc = useMemo(
    () => npcs.find((n) => n.npcId === selectedNpcId) ?? null,
    [npcs, selectedNpcId],
  );

  // For item search filtering: find which NPCs have matching gift items
  const itemMatchNpcIds = useItemSearchMatching(filters.itemSearch, indexes);

  const handleSelect = useCallback((npcId: string) => {
    setSelectedNpcId(npcId);
    setShowDetail(true);
    navigate(`/relationships/${encodeURIComponent(npcId)}`, { replace: true });
  }, [navigate]);

  const handleBack = useCallback(() => {
    setShowDetail(false);
    navigate('/relationships', { replace: true });
  }, [navigate]);

  if (!inventory || !indexes) {
    return <EmptyState icon="&#9876;" title="Loading..." description="Preparing NPC data" />;
  }

  if (npcs.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <EmptyState
          icon="&#9829;"
          title="No NPC Data"
          description="Import your character data to see NPC relationships"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-4">
        <h1 className="font-display text-2xl text-gorgon-text-bright tracking-wide">
          NPC Relationships
        </h1>
        <p className="text-gorgon-text-dim text-sm mt-1">
          {npcs.length} NPCs with gift preferences
        </p>
      </div>

      <NpcFilters
        filters={filters}
        onChange={setFilters}
        areas={areas}
        favorLevels={favorLevels}
      />

      {/* Desktop: side-by-side layout */}
      <div className="hidden lg:grid lg:grid-cols-5 gap-4">
        {/* Left panel: NPC list */}
        <div className="lg:col-span-2">
          <Card className="max-h-[calc(100vh-16rem)] overflow-y-auto">
            <NpcList
              npcs={npcs}
              filters={filters}
              selectedNpcId={selectedNpcId}
              onSelect={handleSelect}
              itemMatchNpcIds={filters.itemSearch ? itemMatchNpcIds : undefined}
            />
          </Card>
        </div>

        {/* Right panel: NPC detail */}
        <div className="lg:col-span-3">
          {selectedNpc ? (
            <NpcDetailPanel
              npc={selectedNpc}
              mode={mode}
              onModeChange={setMode}
            />
          ) : (
            <Card>
              <EmptyState
                icon="&#9829;"
                title="Select an NPC"
                description="Choose an NPC from the list to see gift matches"
              />
            </Card>
          )}
        </div>
      </div>

      {/* Mobile: drill-down layout */}
      <div className="lg:hidden">
        {showDetail && selectedNpc ? (
          <NpcDetailPanel
            npc={selectedNpc}
            mode={mode}
            onModeChange={setMode}
            onBack={handleBack}
          />
        ) : (
          <Card>
            <NpcList
              npcs={npcs}
              filters={filters}
              selectedNpcId={selectedNpcId}
              onSelect={handleSelect}
              itemMatchNpcIds={filters.itemSearch ? itemMatchNpcIds : undefined}
            />
          </Card>
        )}
      </div>
    </div>
  );
}

/**
 * Build a set of NPC IDs whose preferred items match the item search text.
 * This enables the "Who wants this item?" use case.
 */
function useItemSearchMatching(
  itemSearch: string,
  indexes: GameDataIndexes | null,
): Set<string> {
  const inventory = useAppStore((s) => s.inventory);

  return useMemo(() => {
    const result = new Set<string>();
    if (!itemSearch || !indexes || !inventory?.Items) return result;

    const search = itemSearch.toLowerCase();

    // Find inventory items matching the search
    const matchingItems = inventory.Items.filter(
      (item) => item.Name.toLowerCase().includes(search),
    );

    // For each matching item, find NPCs who want it
    for (const item of matchingItems) {
      const cdnItem = indexes.itemsByTypeId.get(item.TypeID);
      if (!cdnItem?.Keywords) continue;

      for (const keyword of cdnItem.Keywords) {
        const prefs = indexes.npcPreferenceIndex.get(keyword);
        if (!prefs) continue;
        for (const pref of prefs) {
          if (pref.desire === 'Like' || pref.desire === 'Love') {
            result.add(pref.npcId);
          }
        }
      }
    }

    return result;
  }, [itemSearch, indexes, inventory]);
}
