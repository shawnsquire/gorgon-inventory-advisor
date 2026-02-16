import type { GameDataIndexes } from '@/lib/cdn-indexes';

/** Sentinel value for items in the player's bags or equipped (no StorageVault field). */
export const PLAYER_INVENTORY = '__PlayerInventory__';

/**
 * Convert a StorageVault ID (e.g., "NPC_Joe", "KhyrulekMementoChest")
 * to a friendly display name using CDN storagevaults data.
 */
export function getVaultDisplayName(vaultId: string, indexes: GameDataIndexes | null): string {
  if (!vaultId || vaultId === PLAYER_INVENTORY) return 'Inventory / Equipped';
  if (!indexes) return formatVaultFallback(vaultId);

  const vault = indexes.vaultsByInternalName.get(vaultId);
  if (vault) {
    return `${vault.NpcFriendlyName} (${vault.Area})`;
  }

  return formatVaultFallback(vaultId);
}

function formatVaultFallback(vaultId: string): string {
  // Handle common patterns
  if (vaultId === 'StorageCrate') return 'Storage Crate';
  if (vaultId === 'Equipped') return 'Equipped/Inventory';

  // Strip "NPC_" prefix and add spaces before capitals
  return vaultId
    .replace(/^NPC_/, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
}

/**
 * Convert NPC InternalName (e.g., "NPC_Joe") to display name using CDN data.
 */
export function getNpcDisplayName(npcId: string, indexes: GameDataIndexes | null): string {
  if (!indexes) return npcId.replace(/^NPC_/, '');

  // NPCs are in the npcs CDN file — check the raw data
  // The npcPreferenceIndex has npcName, but we can look up directly
  // For now, strip prefix and format
  return npcId
    .replace(/^NPC_/, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2');
}

/**
 * Get a short vault label (for chips/badges).
 */
export function getVaultShortName(vaultId: string, indexes: GameDataIndexes | null): string {
  if (!vaultId || vaultId === PLAYER_INVENTORY) return 'Inventory / Equipped';
  if (!indexes) return formatVaultFallback(vaultId);

  const vault = indexes.vaultsByInternalName.get(vaultId);
  if (vault) return vault.NpcFriendlyName;

  return formatVaultFallback(vaultId);
}
