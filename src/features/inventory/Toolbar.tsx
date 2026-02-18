import { ACTIONS, type ActionType } from '@/types/recommendations';
import type { GameDataIndexes } from '@/lib/cdn-indexes';
import { getVaultShortName } from '@/shared/utils/friendlyNames';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  filterVault: string;
  onVaultChange: (v: string) => void;
  filterAction: string;
  onActionChange: (v: string) => void;
  filterCategory: string;
  onCategoryChange: (v: string) => void;
  sortBy: string;
  onSortChange: (v: string) => void;
  filterUncertain: boolean;
  onUncertainChange: (v: boolean) => void;
  vaults: string[];
  categories: string[];
  totalCount: number;
  uncertainCount: number;
  archivedCount: number;
  indexes: GameDataIndexes;
}

const selectClass = `bg-gorgon-card border border-gorgon-border text-gorgon-text
  px-2.5 py-1.5 rounded-md text-sm outline-none min-w-[140px]
  focus:border-gorgon-border-light`;

const inputClass = `bg-gorgon-card border border-gorgon-border text-gorgon-text
  px-2.5 py-1.5 rounded-md text-sm outline-none min-w-[180px]
  focus:border-gorgon-border-light placeholder:text-gorgon-text-dim`;

export function Toolbar({
  search, onSearchChange,
  filterVault, onVaultChange,
  filterAction, onActionChange,
  filterCategory, onCategoryChange,
  sortBy, onSortChange,
  filterUncertain, onUncertainChange,
  vaults, categories, totalCount, uncertainCount, archivedCount,
  indexes,
}: Props) {
  return (
    <div className="flex gap-2.5 mb-4 flex-wrap items-center">
      <input
        type="text"
        placeholder="Search items..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className={inputClass}
      />

      <select value={filterVault} onChange={(e) => onVaultChange(e.target.value)} className={selectClass}>
        <option value="all">All Locations</option>
        {vaults.map((v) => (
          <option key={v} value={v}>{getVaultShortName(v, indexes)}</option>
        ))}
      </select>

      <select value={filterAction} onChange={(e) => onActionChange(e.target.value)} className={selectClass}>
        <option value="all">All Actions</option>
        {(Object.keys(ACTIONS) as ActionType[]).filter((key) => key !== 'ARCHIVE').map((key) => (
          <option key={key} value={key}>{ACTIONS[key].icon} {ACTIONS[key].label}</option>
        ))}
      </select>

      <select value={filterCategory} onChange={(e) => onCategoryChange(e.target.value)} className={selectClass}>
        <option value="all">All Categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <select value={sortBy} onChange={(e) => onSortChange(e.target.value)} className={`${selectClass} min-w-[120px]`}>
        <option value="action">Sort: Action</option>
        <option value="value">Sort: Value</option>
        <option value="name">Sort: Name</option>
        <option value="storage">Sort: Location</option>
        <option value="score">Sort: Gear Score</option>
      </select>

      {uncertainCount > 0 && (
        <label className="inline-flex items-center gap-1.5 text-sm text-gorgon-text cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filterUncertain}
            onChange={(e) => onUncertainChange(e.target.checked)}
            className="accent-action-yellow"
          />
          <span className="text-action-yellow">?</span> Uncertain only
        </label>
      )}

      <div className="flex-1" />
      {archivedCount > 0 && (
        <button
          onClick={() => onActionChange(filterAction === 'ARCHIVE' ? 'all' : 'ARCHIVE')}
          className={`text-sm transition-colors ${
            filterAction === 'ARCHIVE'
              ? 'text-gorgon-text-bright underline'
              : 'text-gorgon-text-dim hover:text-gorgon-text'
          }`}
        >
          {archivedCount} archived
        </button>
      )}
      <span className="text-sm text-gorgon-text-dim">{totalCount} items</span>
    </div>
  );
}
