/** CDN abilities.json — keyed by ability InternalName */
export interface CdnAbility {
  InternalName: string;
  Name?: string;
  Skill?: string;
  IconId?: number;
  Description?: string;
  Level?: number;
  PvE?: CdnAbilityPvE;
}

export interface CdnAbilityPvE {
  Damage?: number;
  HealthSpecificDamage?: number;
  ArmorSpecificDamage?: number;
  PowerCost?: number;
  Range?: number;
  ResetTime?: number;
  DamageType?: string;
  AoE?: number;
  SelfPreEffects?: string[];
}

/** Raw CDN shape: Record<string, CdnAbility> */
export type CdnAbilitiesFile = Record<string, CdnAbility>;
