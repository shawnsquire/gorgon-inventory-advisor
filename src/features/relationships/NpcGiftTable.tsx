import type { NpcGiftItem } from './types';

interface Props {
  gifts: NpcGiftItem[];
  onItemClick?: (gift: NpcGiftItem) => void;
}

export function NpcGiftTable({ gifts, onItemClick }: Props) {
  if (gifts.length === 0) {
    return (
      <p className="text-gorgon-text-dim text-sm py-4 text-center">
        No matching gifts in your inventory
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {gifts.map((gift) => (
        <div
          key={`${gift.typeId}_${gift.vaultName}_${gift.source}`}
          className={`flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gorgon-hover text-sm${onItemClick ? ' cursor-pointer' : ''}`}
          onClick={onItemClick ? () => onItemClick(gift) : undefined}
        >
          <span
            className={`shrink-0 text-xs font-bold w-5 text-center ${
              gift.desire === 'Love' ? 'text-action-purple' : 'text-gorgon-text-dim'
            }`}
            title={gift.desire}
          >
            {gift.desire === 'Love' ? '\u2665' : '\u2661'}
          </span>

          <span className="flex-1 text-gorgon-text truncate">{gift.itemName}</span>

          {gift.conflict && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded border ${
                gift.conflict === 'quest'
                  ? 'text-action-blue border-action-blue/30 bg-action-blue-dim'
                  : 'text-action-green border-action-green/30 bg-action-green-dim'
              }`}
              title={gift.conflict === 'quest' ? 'Also needed for quest' : 'Also used in crafting'}
            >
              {gift.conflict === 'quest' ? '!' : '\u2692'}
            </span>
          )}

          {gift.source === 'craftable' && (
            <span className="text-xs px-1.5 py-0.5 rounded border text-action-cyan border-action-cyan/30 bg-action-cyan/10">
              Craft
            </span>
          )}

          {gift.source === 'inventory' && gift.stackSize > 1 && (
            <span className="text-xs text-gorgon-text-dim">
              x{gift.stackSize}
            </span>
          )}

          <span className="text-xs text-gorgon-text-dim shrink-0 w-16 text-right">
            {gift.vaultName}
          </span>
        </div>
      ))}
    </div>
  );
}
