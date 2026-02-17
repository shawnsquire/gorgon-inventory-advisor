import { useMemo } from 'react';
import { NpcRow } from './NpcRow';
import type { NpcRelationshipView, RelationshipFilterState } from './types';

interface Props {
  npcs: NpcRelationshipView[];
  filters: RelationshipFilterState;
  selectedNpcId: string | null;
  onSelect: (npcId: string) => void;
  /** Set of NPC IDs that have gift items matching the item search */
  itemMatchNpcIds?: Set<string>;
}

export function NpcList({ npcs, filters, selectedNpcId, onSelect, itemMatchNpcIds }: Props) {
  const filtered = useMemo(() => {
    let list = npcs;

    // Name search
    if (filters.search) {
      const s = filters.search.toLowerCase();
      list = list.filter((n) => n.name.toLowerCase().includes(s));
    }

    // Item search — filter to NPCs that have matching gift items
    if (filters.itemSearch && itemMatchNpcIds) {
      list = list.filter((n) => itemMatchNpcIds.has(n.npcId));
    }

    // Area
    if (filters.areaFilter !== 'all') {
      list = list.filter((n) => n.areaName === filters.areaFilter);
    }

    // Desire filter
    if (filters.desireFilter === 'love') {
      list = list.filter((n) => n.loveCount > 0);
    } else if (filters.desireFilter === 'has') {
      list = list.filter((n) => n.giftCount > 0);
    }

    // Priority
    if (filters.priorityFilter !== 'all') {
      list = list.filter((n) => n.priority === filters.priorityFilter);
    }

    // Favor
    if (filters.favorFilter !== 'all') {
      list = list.filter((n) => n.favorLevel === filters.favorFilter);
    }

    // Met/unmet
    if (filters.metFilter === 'met') {
      list = list.filter((n) => n.isMet);
    } else if (filters.metFilter === 'unmet') {
      list = list.filter((n) => !n.isMet);
    }

    // Sort: priority first, then favor rank desc, then gift count desc
    list = [...list].sort((a, b) => {
      // Priority NPCs first
      if (a.priority === 'priority' && b.priority !== 'priority') return -1;
      if (b.priority === 'priority' && a.priority !== 'priority') return 1;
      // Ignored NPCs last
      if (a.priority === 'ignored' && b.priority !== 'ignored') return 1;
      if (b.priority === 'ignored' && a.priority !== 'ignored') return -1;
      // Favor rank descending
      if (a.favorRank !== b.favorRank) return b.favorRank - a.favorRank;
      // Area tier ascending (earlier zones first)
      if (a.areaTier !== b.areaTier) return a.areaTier - b.areaTier;
      // Gift count descending
      return b.giftCount - a.giftCount;
    });

    return list;
  }, [npcs, filters, itemMatchNpcIds]);

  if (filtered.length === 0) {
    return (
      <div className="text-center py-8 text-gorgon-text-dim text-sm">
        No NPCs match your filters
      </div>
    );
  }

  return (
    <div className="space-y-0.5 overflow-y-auto">
      {filtered.map((npc) => (
        <NpcRow
          key={npc.npcId}
          npc={npc}
          isSelected={npc.npcId === selectedNpcId}
          onClick={onSelect}
        />
      ))}
    </div>
  );
}
