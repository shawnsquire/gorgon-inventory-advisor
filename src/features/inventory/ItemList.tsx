import type { AnalyzedItem } from './InventoryPage';
import type { GameDataIndexes } from '@/lib/cdn-indexes';
import { ItemRow } from './ItemRow';
import { EmptyState } from '@/shared/components/EmptyState';

interface Props {
  items: AnalyzedItem[];
  onItemClick: (item: AnalyzedItem) => void;
  indexes: GameDataIndexes;
}

export function ItemList({ items, onItemClick, indexes }: Props) {
  if (items.length === 0) {
    return <EmptyState title="No items match your filters" description="Try adjusting your search or filter criteria" />;
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="grid grid-cols-[40px_32px_1fr_140px_100px_70px_80px_1fr] gap-2 px-3 py-2
                      text-[11px] text-gorgon-text-dim uppercase tracking-wider font-semibold
                      border-b border-gorgon-border sticky top-[57px] bg-gorgon-dark z-10">
        <span />
        <span />
        <span>Item</span>
        <span>Location</span>
        <span>Category</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Value</span>
        <span>Reason</span>
      </div>

      {/* Rows */}
      {items.map((item) => (
        <ItemRow
          key={`${item.TypeID}_${item.StorageVault ?? 'inv'}_${item._idx}`}
          item={item}
          onItemClick={onItemClick}
          indexes={indexes}
        />
      ))}
    </div>
  );
}
