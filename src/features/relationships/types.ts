export type NpcPriorityStatus = 'default' | 'priority' | 'ignored';

export type NpcPriorities = Record<string, NpcPriorityStatus>;

export interface NpcRelationshipView {
  npcId: string;
  name: string;
  areaName: string;
  areaTier: number;
  isMet: boolean;
  favorLevel: string;
  favorRank: number;
  priority: NpcPriorityStatus;
  giftCount: number;
  loveCount: number;
}

export interface NpcGiftItem {
  itemName: string;
  typeId: number;
  stackSize: number;
  value: number;
  desire: string;
  pref: number;
  source: 'inventory' | 'craftable';
  conflict?: 'quest' | 'ingredient';
  vaultName: string;
}

export type RelationshipMode = 'opportunistic' | 'strategic';

export interface RelationshipFilterState {
  search: string;
  areaFilter: string;
  desireFilter: string;
  priorityFilter: string;
  favorFilter: string;
  metFilter: string;
  itemSearch: string;
}
