import { memo } from 'react';
import type { AnalyzedItem } from './InventoryPage';
import type { GameDataIndexes } from '@/lib/cdn-indexes';
import { ActionBadge, RarityBadge } from '@/shared/components/Badge';
import { getVaultShortName } from '@/shared/utils/friendlyNames';
import { formatGold } from '@/shared/utils/formatting';
import { getGearSkillsFriendly } from '@/features/recommendations/gearScoring';
import { getIconUrl } from '@/lib/cdn';

interface Props {
  item: AnalyzedItem;
  onItemClick: (item: AnalyzedItem) => void;
  indexes: GameDataIndexes;
}

export const ItemRow = memo(function ItemRow({ item, onItemClick, indexes }: Props) {
  const rec = item.recommendation;
  const totalValue = item.Value * item.StackSize;
  const gearSkills = item.Slot ? getGearSkillsFriendly(item, indexes) : [];
  const vaultName = getVaultShortName(item.StorageVault ?? '', indexes);
  const cdnItem = indexes.itemsByTypeId.get(item.TypeID);

  return (
    <div
      onClick={() => onItemClick(item)}
      className="grid grid-cols-[40px_32px_1fr_140px_100px_70px_80px_1fr] gap-2 px-3 py-2
                 items-center border-b border-gorgon-border cursor-pointer
                 hover:bg-gorgon-hover transition-colors text-sm"
      style={{ borderLeftWidth: 3, borderLeftColor: getActionBorderColor(rec.action.type) }}
    >
      {/* Action badge */}
      <ActionBadge actionType={rec.action.type} uncertain={rec.uncertain} />

      {/* Item icon */}
      {cdnItem?.IconId ? (
        <img
          src={getIconUrl(cdnItem.IconId)}
          alt=""
          width={32}
          height={32}
          loading="lazy"
          className="rounded"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      ) : (
        <span />
      )}

      {/* Item name + metadata */}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          {item.Rarity && <RarityBadge rarity={item.Rarity} />}
          <span className="text-gorgon-text-bright font-medium truncate">{item.Name}</span>
          {item.Level && <span className="text-gorgon-text-dim text-xs shrink-0">L{item.Level}</span>}
          {rec.gearScore != null && (
            <span className="text-xs font-mono text-action-blue shrink-0">
              {rec.gearScore}pts
            </span>
          )}
        </div>
        {gearSkills.length > 0 && (
          <div className="text-[11px] text-gorgon-text-dim mt-0.5">
            {gearSkills.join(' / ')}
          </div>
        )}
      </div>

      {/* Location */}
      <span className="text-xs text-gorgon-text-dim truncate">{vaultName}</span>

      {/* Category */}
      <span className="text-[11px] text-gorgon-text-dim">{rec.category}</span>

      {/* Quantity */}
      <span className="text-right font-mono text-sm text-gorgon-text">
        {item.StackSize > 1 ? `\u00D7${item.StackSize}` : ''}
      </span>

      {/* Value */}
      <span className={`text-right font-mono text-sm ${totalValue >= 100 ? 'text-action-yellow' : 'text-gorgon-text-dim'}`}>
        {totalValue > 0 ? formatGold(totalValue) : ''}
      </span>

      {/* Reason */}
      <span className="text-[11px] text-gorgon-text-dim truncate">{rec.summary}</span>
    </div>
  );
});

function getActionBorderColor(actionType: string): string {
  const colors: Record<string, string> = {
    KEEP: '#34d399',
    SELL_ALL: '#f87171',
    SELL_SOME: '#fbbf24',
    DISENCHANT: '#a78bfa',
    USE: '#22d3ee',
    USE_COMBAT: '#2dd4bf',
    QUEST: '#60a5fa',
    LEVEL_LATER: '#fb923c',
    INGREDIENT: '#34d399',
    DEPLOY: '#22d3ee',
    GIFT: '#a78bfa',
    ARCHIVE: '#6b7280',
  };
  return colors[actionType] ?? '#6b7280';
}
