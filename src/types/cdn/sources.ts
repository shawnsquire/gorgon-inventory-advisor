/** CDN sources_items.json — keyed by item InternalName */
export interface CdnItemSource {
  Sources: CdnSource[];
}

export interface CdnSource {
  Type: string;
  Npc?: string;
  Area?: string;
  Quest?: string;
  SkillTypeId?: string;
  ItemTypeId?: number;
  [key: string]: unknown;
}

/** Raw CDN shape: Record<string, CdnItemSource> */
export type CdnSourcesFile = Record<string, CdnItemSource>;
