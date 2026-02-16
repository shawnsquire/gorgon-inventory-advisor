/** CDN tsysclientinfo.json — keyed by power InternalName */
export interface CdnTsysPower {
  InternalName: string;
  Prefix?: string;
  Suffix?: string;
  Skill?: string;
  Slots?: string[];
  Tiers?: CdnTsysPowerTier[];
}

export interface CdnTsysPowerTier {
  EffectDescs?: string[];
  MinLevel?: number;
  MinRarity?: string;
  SkillLevelPrereq?: number;
}

/** Raw CDN shape: Record<string, CdnTsysPower> */
export type CdnTsysClientInfoFile = Record<string, CdnTsysPower>;
