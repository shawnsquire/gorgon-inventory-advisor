import { memo } from 'react';
import { favorColor, favorLabel } from '@/shared/utils/favor';
import type { NpcRelationshipView } from './types';

interface Props {
  npc: NpcRelationshipView;
  isSelected: boolean;
  onClick: (npcId: string) => void;
}

export const NpcRow = memo(function NpcRow({ npc, isSelected, onClick }: Props) {
  return (
    <button
      onClick={() => onClick(npc.npcId)}
      className={`w-full text-left px-3 py-2.5 flex items-center gap-2 transition-colors rounded-lg ${
        isSelected
          ? 'bg-gorgon-hover border border-gorgon-border'
          : 'hover:bg-gorgon-hover border border-transparent'
      } ${npc.priority === 'ignored' ? 'opacity-40' : ''}`}
    >
      {/* Priority star */}
      <span className={`text-sm shrink-0 ${
        npc.priority === 'priority' ? 'text-action-yellow' : 'text-transparent'
      }`}>
        {npc.priority === 'priority' ? '\u2605' : '\u2606'}
      </span>

      {/* Name + area */}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gorgon-text truncate">{npc.name}</div>
        <div className="text-xs text-gorgon-text-dim truncate">{npc.areaName}</div>
      </div>

      {/* Favor */}
      <span className={`text-xs shrink-0 ${favorColor(npc.favorLevel)}`}>
        {npc.isMet ? favorLabel(npc.favorLevel) : 'Unmet'}
      </span>

      {/* Gift count */}
      {npc.giftCount > 0 && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${
          npc.loveCount > 0
            ? 'bg-action-purple/15 text-action-purple'
            : 'bg-gorgon-dark text-gorgon-text-dim'
        }`}>
          {npc.giftCount}
        </span>
      )}
    </button>
  );
});
