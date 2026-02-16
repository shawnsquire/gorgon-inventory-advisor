/** CDN npcs.json — keyed by NPC InternalName */
export interface CdnNpc {
  Name: string;
  AreaName?: string;
  Preferences?: CdnNpcPreference[];
  Likes?: string[];
  Dislikes?: string[];
  Favorites?: string[];
}

export interface CdnNpcPreference {
  Desire: string;
  Keywords: string[];
  Pref: number;
  Favor?: string;
}

/** Raw CDN shape: Record<string, CdnNpc> */
export type CdnNpcsFile = Record<string, CdnNpc>;
