import type { InventoryItem, EquipmentSlot } from '@/types/inventory';
import type { CdnItem } from '@/types/cdn/items';
import type { GameDataIndexes } from '@/lib/cdn-indexes';
import { PLAYER_INVENTORY } from '@/shared/utils/friendlyNames';

const EQUIPMENT_SLOTS: Set<string> = new Set<EquipmentSlot>([
  'Head', 'Chest', 'Legs', 'Hands', 'Feet',
  'MainHand', 'OffHand', 'Necklace', 'Ring', 'Waist', 'Banner',
]);

export function isEquipment(item: InventoryItem): boolean {
  return !!item.Slot && EQUIPMENT_SLOTS.has(item.Slot);
}

export function isConsumable(cdnItem: CdnItem | undefined): boolean {
  if (!cdnItem?.Behaviors) return false;
  return cdnItem.Behaviors.some((b) => b.UseVerb != null);
}

/**
 * Get the CDN item key from an inventory TypeID.
 * CDN keys are "item_12003" format.
 */
export function getItemCdnKey(typeId: number): string {
  return `item_${typeId}`;
}

/**
 * Look up a CDN item from an inventory item's TypeID.
 */
export function lookupCdnItem(item: InventoryItem, indexes: GameDataIndexes): CdnItem | undefined {
  return indexes.itemsByTypeId.get(item.TypeID);
}

/**
 * Calculate total vendor value for an inventory item.
 */
export function getTotalValue(item: InventoryItem): number {
  return item.Value * item.StackSize;
}

/**
 * Get all unique vaults from inventory items.
 */
export function getUniqueVaults(items: InventoryItem[]): string[] {
  return [...new Set(items.map((i) => i.StorageVault ?? PLAYER_INVENTORY))].sort();
}

/**
 * Count items per vault.
 */
/**
 * Construct a Project Gorgon wiki URL from an item name.
 */
export function getItemWikiUrl(name: string): string {
  return `https://wiki.projectgorgon.com/wiki/${name.replace(/ /g, '_')}`;
}

export function countByVault(items: InventoryItem[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const vault = item.StorageVault ?? PLAYER_INVENTORY;
    counts[vault] = (counts[vault] ?? 0) + 1;
  }
  return counts;
}
