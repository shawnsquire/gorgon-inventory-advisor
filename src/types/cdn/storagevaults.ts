/** CDN storagevaults.json — keyed by vault InternalName */
export interface CdnStorageVault {
  NpcFriendlyName: string;
  Area: string;
  ID: number;
  NumSlots?: number;                         // Fixed-slot vaults (chests, crates)
  Levels?: Record<string, number>;           // NPC vaults: favor level -> slot count
  Grouping?: string;                         // Area grouping ("AreaSerbule", etc.)
  Requirements?: Record<string, string>;     // Access prerequisites
  RequiredItemKeywords?: string[];            // Item type restrictions
  RequirementDescription?: string;           // Human-readable restriction text
  NumSlotsScriptAtomic?: string;             // Dynamic sizing (community chests)
}

/** Raw CDN shape: Record<string, CdnStorageVault> */
export type CdnStorageVaultsFile = Record<string, CdnStorageVault>;
