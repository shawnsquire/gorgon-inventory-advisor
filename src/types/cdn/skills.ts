/** CDN skills.json — keyed by skill InternalName */
export interface CdnSkill {
  Id: number;
  Name?: string;
  Combat: boolean;
  TSysCompatibleCombatSkills?: string[];
  AssociatedItemKeywords?: string[];
  AdvancementTable?: string;
  MaxLevel?: number;
  InteractionFlagLevelCaps?: Record<string, number>;
  Reports?: string[];
  Parents?: string[];
  CompatibleCombatSkills?: string[];
}

/** Raw CDN shape: Record<string, CdnSkill> */
export type CdnSkillsFile = Record<string, CdnSkill>;
