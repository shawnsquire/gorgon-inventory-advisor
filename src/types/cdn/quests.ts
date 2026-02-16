/** CDN quests.json — keyed by quest InternalName */
export interface CdnQuest {
  InternalName: string;
  Name?: string;
  Description?: string;
  Objectives?: CdnQuestObjective[];
  Requirements?: CdnQuestRequirement[];
  Rewards_Items?: CdnQuestRewardItem[];
  Rewards_NamedLootProfile?: string;
  FavorNpc?: string;
  FavorLevel?: string;
  GroupingName?: string;
  IsAutoPreface?: boolean;
  IsAutoWrapUp?: boolean;
  NumExpectedParticipants?: number;
  Level?: number;
  WorkOrderSkill?: string;
}

export interface CdnQuestObjective {
  Type: string;
  Target?: string;
  ItemName?: string;
  Number?: number;
  Description?: string;
  InternalName?: string;
  Requirements?: CdnQuestRequirement[];
}

export interface CdnQuestRequirement {
  T: string;
  Skill?: string;
  Level?: number;
  Item?: string;
  [key: string]: unknown;
}

export interface CdnQuestRewardItem {
  Item: string;
  StackSize: number;
}

/** Raw CDN shape: Record<string, CdnQuest> */
export type CdnQuestsFile = Record<string, CdnQuest>;
