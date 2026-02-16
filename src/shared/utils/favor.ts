import type { FavorLevel } from '@/types/character';

const FAVOR_RANKS: Record<string, number> = {
  Neutral: 0, Tolerated: 1, Comfortable: 2, Friends: 3,
  CloseFriends: 4, BestFriends: 5, LikeFamily: 6, SoulMates: 7,
};

/** Numeric rank for comparing favor levels (higher = better). */
export function favorRank(level: string): number {
  return FAVOR_RANKS[level] ?? 0;
}

/** Tailwind text color class for a favor level. */
export function favorColor(level: string): string {
  switch (level) {
    case 'SoulMates': return 'text-rarity-legendary';
    case 'LikeFamily': return 'text-rarity-epic';
    case 'BestFriends': return 'text-rarity-exceptional';
    case 'CloseFriends': return 'text-rarity-rare';
    case 'Friends': return 'text-rarity-uncommon';
    case 'Comfortable': return 'text-action-green';
    case 'Tolerated': return 'text-action-yellow';
    default: return 'text-gorgon-text-dim';
  }
}

/** Format camelCase favor levels for display ("CloseFriends" -> "Close Friends"). */
export function favorLabel(level: string): string {
  return level.replace(/([a-z])([A-Z])/g, '$1 $2');
}

/** Check if playerLevel meets or exceeds requiredLevel. */
export function meetsRequiredFavor(playerLevel: FavorLevel | undefined, requiredLevel: string): boolean {
  return favorRank(playerLevel ?? 'Neutral') >= favorRank(requiredLevel);
}
