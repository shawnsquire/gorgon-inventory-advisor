/** Raw JSON export from Project Gorgon Lore Exporter — Report: "Storage" */
export interface InventoryExport {
  Character: string;
  Timestamp: string;
  Report: 'Storage';
  ReportVersion: number;
  Items: InventoryItem[];
}

export interface InventoryItem {
  TypeID: number;
  StorageVault?: string;
  StackSize: number;
  Value: number;
  Name: string;
  PetHusbandryState?: string;
  Rarity?: ItemRarity;
  Slot?: EquipmentSlot;
  Level?: number;
  Durability?: number;
  CraftPoints?: number;
  CraftedByCharacter?: string;
  TSysPowers?: TSysPower[];
}

export interface TSysPower {
  Tier: number;
  Power: string;
}

export type ItemRarity =
  | 'Common'
  | 'Uncommon'
  | 'Rare'
  | 'Exceptional'
  | 'Epic'
  | 'Legendary';

export type EquipmentSlot =
  | 'Head'
  | 'Chest'
  | 'Legs'
  | 'Hands'
  | 'Feet'
  | 'MainHand'
  | 'OffHand'
  | 'Necklace'
  | 'Ring'
  | 'Waist'
  | 'Banner';
