/** CDN recipes.json — keyed by recipe InternalName */
export interface CdnRecipe {
  InternalName: string;
  Name?: string;
  Description?: string;
  Skill: string;
  SkillLevelReq: number;
  Ingredients: CdnRecipeIngredient[];
  ResultItems: CdnRecipeResult[];
  ActionLabel?: string;
  UsedHangout?: string;
  NumResultItems?: number;
  RewardSkill?: string;
  RewardSkillXp?: number;
  RewardSkillXpDropOffLevel?: number;
  RewardSkillXpDropOffPenalty?: number;
  SortSkill?: string;
  KeywordList?: string;
  IconId?: number;
  IsItemMenuKeywordReqSufficient?: boolean;
}

export interface CdnRecipeIngredient {
  ItemCode: number;
  StackSize: number;
  Description?: string;
  ItemKeys?: string[];
}

export interface CdnRecipeResult {
  ItemCode: number;
  StackSize: number;
  Desc?: string;
  ChanceToFail?: number;
  PercentChance?: number;
}

/** Raw CDN shape: Record<string, CdnRecipe> */
export type CdnRecipesFile = Record<string, CdnRecipe>;
