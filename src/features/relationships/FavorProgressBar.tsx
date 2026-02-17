import { FAVOR_TIER_ORDER, getFavorTierIndex } from './favorThresholds';
import { favorColor, favorLabel } from '@/shared/utils/favor';

interface Props {
  currentTier: string;
}

export function FavorProgressBar({ currentTier }: Props) {
  const currentIdx = getFavorTierIndex(currentTier);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className={`font-semibold ${favorColor(currentTier)}`}>
          {favorLabel(currentTier)}
        </span>
        <span className="text-gorgon-text-dim">
          {currentIdx}/{FAVOR_TIER_ORDER.length - 1}
        </span>
      </div>
      <div className="flex gap-0.5">
        {FAVOR_TIER_ORDER.map((tier, idx) => (
          <div
            key={tier}
            className={`h-2 flex-1 rounded-sm transition-colors ${
              idx <= currentIdx
                ? idx === currentIdx
                  ? 'bg-action-green'
                  : 'bg-action-green/40'
                : 'bg-gorgon-dark'
            }`}
            title={favorLabel(tier)}
          />
        ))}
      </div>
    </div>
  );
}
