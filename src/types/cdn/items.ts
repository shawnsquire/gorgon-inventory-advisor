/** CDN items.json — keyed by "item_NNNNN" */
export interface CdnItem {
  Name: string;
  InternalName: string;
  Keywords: string[];
  Behaviors?: CdnItemBehavior[];
  Value?: number;
  IconId?: number;
  Description?: string;
  DynamicCraftingSummary?: string;
  MacGuffinQuestName?: string;
  EquipSlot?: string;
  EquipAppearance?: string;
  ItemJsonId?: number;
  MaxStackSize?: number;
  SkillReqs?: Record<string, number>;
}

export interface CdnItemBehavior {
  UseVerb?: string;
  UseRequirements?: string[];
  UseAnimation?: string;
  [key: string]: unknown;
}

/** Raw CDN shape: Record<`item_${number}`, CdnItem> */
export type CdnItemsFile = Record<string, CdnItem>;
