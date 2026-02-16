/** CDN storagevaults.json — keyed by vault InternalName */
export interface CdnStorageVault {
  NpcFriendlyName: string;
  Area: string;
  NumSlots: number;
  RequiredFavorLevel?: string;
  RequirePrereq?: boolean;
  Levels?: string;
  GroupId?: number;
  RequiredFavor?: Record<string, string>;
}

/** Raw CDN shape: Record<string, CdnStorageVault> */
export type CdnStorageVaultsFile = Record<string, CdnStorageVault>;
