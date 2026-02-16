/**
 * Format gold values with comma separators.
 */
export function formatGold(amount: number): string {
  return `${amount.toLocaleString()}g`;
}

/**
 * Format a number with comma separators.
 */
export function formatNumber(n: number): string {
  return n.toLocaleString();
}

/**
 * Format a timestamp string for display.
 */
export function formatTimestamp(ts: string): string {
  try {
    const date = new Date(ts);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return ts;
  }
}

/**
 * Format skill level with bonus levels.
 */
export function formatSkillLevel(level: number, bonusLevels: number): string {
  if (bonusLevels > 0) {
    return `${level} (+${bonusLevels})`;
  }
  return String(level);
}

/**
 * Format XP progress as "current / needed" or "MAXED".
 */
export function formatXpProgress(toward: number, needed: number): string {
  if (needed === -1) return 'MAXED';
  return `${toward.toLocaleString()} / ${needed.toLocaleString()} XP`;
}
