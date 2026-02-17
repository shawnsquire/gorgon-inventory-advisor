import { favorLabel } from '@/shared/utils/favor';
import type { RelationshipFilterState } from './types';

interface Props {
  filters: RelationshipFilterState;
  onChange: (filters: RelationshipFilterState) => void;
  areas: string[];
  favorLevels: string[];
}

export function NpcFilters({ filters, onChange, areas, favorLevels }: Props) {
  const update = (patch: Partial<RelationshipFilterState>) => {
    onChange({ ...filters, ...patch });
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {/* NPC name search */}
      <input
        type="text"
        placeholder="Search NPCs..."
        value={filters.search}
        onChange={(e) => update({ search: e.target.value })}
        className="bg-gorgon-dark border border-gorgon-border rounded-lg px-3 py-1.5 text-sm text-gorgon-text placeholder:text-gorgon-text-dim focus:outline-none focus:border-gorgon-text-dim w-40"
      />

      {/* Item name search */}
      <input
        type="text"
        placeholder="Search items..."
        value={filters.itemSearch}
        onChange={(e) => update({ itemSearch: e.target.value })}
        className="bg-gorgon-dark border border-gorgon-border rounded-lg px-3 py-1.5 text-sm text-gorgon-text placeholder:text-gorgon-text-dim focus:outline-none focus:border-gorgon-text-dim w-40"
      />

      {/* Area filter */}
      <select
        value={filters.areaFilter}
        onChange={(e) => update({ areaFilter: e.target.value })}
        className="bg-gorgon-dark border border-gorgon-border rounded-lg px-3 py-1.5 text-sm text-gorgon-text focus:outline-none"
      >
        <option value="all">All Areas</option>
        {areas.map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>

      {/* Desire filter */}
      <select
        value={filters.desireFilter}
        onChange={(e) => update({ desireFilter: e.target.value })}
        className="bg-gorgon-dark border border-gorgon-border rounded-lg px-3 py-1.5 text-sm text-gorgon-text focus:outline-none"
      >
        <option value="all">Any Gifts</option>
        <option value="love">Love Only</option>
        <option value="has">Has Matches</option>
      </select>

      {/* Priority filter */}
      <select
        value={filters.priorityFilter}
        onChange={(e) => update({ priorityFilter: e.target.value })}
        className="bg-gorgon-dark border border-gorgon-border rounded-lg px-3 py-1.5 text-sm text-gorgon-text focus:outline-none"
      >
        <option value="all">All NPCs</option>
        <option value="priority">Priority Only</option>
        <option value="default">Default Only</option>
        <option value="ignored">Ignored Only</option>
      </select>

      {/* Favor filter */}
      <select
        value={filters.favorFilter}
        onChange={(e) => update({ favorFilter: e.target.value })}
        className="bg-gorgon-dark border border-gorgon-border rounded-lg px-3 py-1.5 text-sm text-gorgon-text focus:outline-none"
      >
        <option value="all">All Favor</option>
        {favorLevels.map((f) => (
          <option key={f} value={f}>{favorLabel(f)}</option>
        ))}
      </select>

      {/* Met/unmet toggle */}
      <select
        value={filters.metFilter}
        onChange={(e) => update({ metFilter: e.target.value })}
        className="bg-gorgon-dark border border-gorgon-border rounded-lg px-3 py-1.5 text-sm text-gorgon-text focus:outline-none"
      >
        <option value="all">Met & Unmet</option>
        <option value="met">Met Only</option>
        <option value="unmet">Unmet Only</option>
      </select>
    </div>
  );
}
