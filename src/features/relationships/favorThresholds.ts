/**
 * Favor tier progression from the Project Gorgon wiki.
 * The character export only provides the tier name (not numeric points),
 * so we use tier position for the progress bar display.
 */
export const FAVOR_TIER_ORDER = [
  'Despised',
  'Hated',
  'Disliked',
  'Tolerated',
  'Neutral',
  'Comfortable',
  'Friends',
  'CloseFriends',
  'BestFriends',
  'LikeFamily',
  'SoulMates',
] as const;

export type FavorTier = typeof FAVOR_TIER_ORDER[number];

/** Get the 0-based index of a favor tier. Returns 4 (Neutral) for unknown tiers. */
export function getFavorTierIndex(tier: string): number {
  const idx = FAVOR_TIER_ORDER.indexOf(tier as FavorTier);
  return idx >= 0 ? idx : 4;
}

/** Get the next favor tier above the current one, or null if already at max. */
export function getNextFavorTier(tier: string): string | null {
  const idx = getFavorTierIndex(tier);
  if (idx >= FAVOR_TIER_ORDER.length - 1) return null;
  return FAVOR_TIER_ORDER[idx + 1] ?? null;
}
