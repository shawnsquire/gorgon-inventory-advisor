import type { ActionType } from '@/types/recommendations';
import { ACTIONS } from '@/types/recommendations';

const ACTION_STYLES: Record<ActionType, string> = {
  KEEP:        'bg-action-green-dim text-action-green border-action-green/30',
  SELL_SOME:   'bg-action-yellow-dim text-action-yellow border-action-yellow/30',
  SELL_ALL:    'bg-action-red-dim text-action-red border-action-red/30',
  DISENCHANT:  'bg-action-purple-dim text-action-purple border-action-purple/30',
  USE:         'bg-action-cyan/10 text-action-cyan border-action-cyan/30',
  USE_COMBAT:  'bg-action-teal-dim text-action-teal border-action-teal/30',
  QUEST:       'bg-action-blue-dim text-action-blue border-action-blue/30',
  LEVEL_LATER: 'bg-action-orange-dim text-action-orange border-action-orange/30',
  INGREDIENT:  'bg-action-green-dim text-action-green border-action-green/30',
  DEPLOY:      'bg-action-cyan/10 text-action-cyan border-action-cyan/30',
  GIFT:        'bg-action-purple-dim text-action-purple border-action-purple/30',
  ARCHIVE:     'bg-gorgon-hover text-gorgon-text-dim border-gorgon-border',
};

interface BadgeProps {
  actionType: ActionType;
  uncertain?: boolean;
  className?: string;
}

export function ActionBadge({ actionType, uncertain, className = '' }: BadgeProps) {
  const action = ACTIONS[actionType];
  const style = ACTION_STYLES[actionType];

  return (
    <span
      className={`relative inline-flex items-center justify-center w-7 h-7 rounded-md border text-sm font-bold shrink-0 ${style} ${className}`}
      title={uncertain ? `${action.label} (uncertain)` : action.label}
    >
      {action.icon}
      {uncertain && (
        <span className="absolute -top-1.5 -right-1.5 text-[10px] font-bold text-action-yellow leading-none">?</span>
      )}
    </span>
  );
}

export function ActionLabel({ actionType, uncertain, className = '' }: BadgeProps) {
  const action = ACTIONS[actionType];
  const style = ACTION_STYLES[actionType];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold ${style} ${className}`}
    >
      <span>{action.icon}</span>
      <span>{action.label}{uncertain ? '?' : ''}</span>
    </span>
  );
}

const RARITY_STYLES: Record<string, string> = {
  Common: 'text-rarity-common',
  Uncommon: 'text-rarity-uncommon',
  Rare: 'text-rarity-rare',
  Exceptional: 'text-rarity-exceptional',
  Epic: 'text-rarity-epic',
  Legendary: 'text-rarity-legendary',
};

interface RarityBadgeProps {
  rarity: string;
  className?: string;
}

export function RarityBadge({ rarity, className = '' }: RarityBadgeProps) {
  const style = RARITY_STYLES[rarity] ?? 'text-gorgon-text-dim';
  return (
    <span className={`text-xs font-semibold ${style} ${className}`}>
      [{rarity}]
    </span>
  );
}
