export type ActionType =
  | 'KEEP'
  | 'SELL_SOME'
  | 'SELL_ALL'
  | 'DISENCHANT'
  | 'USE'
  | 'USE_COMBAT'
  | 'QUEST'
  | 'LEVEL_LATER'
  | 'INGREDIENT'
  | 'DEPLOY'
  | 'GIFT'
  | 'ARCHIVE';

export interface Action {
  type: ActionType;
  label: string;
  icon: string;
}

export const ACTIONS: Record<ActionType, Action> = {
  KEEP:        { type: 'KEEP',        label: 'Keep',                icon: '\u2713' },
  SELL_SOME:   { type: 'SELL_SOME',   label: 'Sell Some',           icon: '\u2193' },
  SELL_ALL:    { type: 'SELL_ALL',    label: 'Sell All',            icon: '\u2715' },
  DISENCHANT:  { type: 'DISENCHANT',  label: 'Distill',            icon: '\u2697' },
  USE:         { type: 'USE',         label: 'Use/Eat',            icon: '\u25C9' },
  USE_COMBAT:  { type: 'USE_COMBAT',  label: 'Combat Supply',      icon: '\u2694' },
  QUEST:       { type: 'QUEST',       label: 'Quest Item',         icon: '!' },
  LEVEL_LATER: { type: 'LEVEL_LATER', label: 'Save for Leveling',  icon: '\u2191' },
  INGREDIENT:  { type: 'INGREDIENT',  label: 'Crafting Ingredient', icon: '\u2692' },
  DEPLOY:      { type: 'DEPLOY',      label: 'Deploy/Use',         icon: '\u25B6' },
  GIFT:        { type: 'GIFT',        label: 'Gift to NPC',        icon: '\u2665' },
  ARCHIVE:     { type: 'ARCHIVE',    label: 'Archived',           icon: '\uD83D\uDCE6' },
};

export type ReasonType =
  | 'override'
  | 'quest'
  | 'equipment'
  | 'recipe'
  | 'consumable'
  | 'gift'
  | 'heuristic'
  | 'fallback';

export interface ReasonEntry {
  type: ReasonType;
  text: string;
  confidence: 'high' | 'medium' | 'low';
  detail?: string;
}

export interface Recommendation {
  action: Action;
  reasons: ReasonEntry[];
  /** Primary display reason (first entry text) */
  summary: string;
  /** Optional gear score 0-100 for equipment */
  gearScore?: number;
  /** Optional suggested keep quantity for stackables */
  keepQuantity?: number;
  /** Item category determined during analysis */
  category: string;
  /** Engine's best guess but low confidence — user should review */
  uncertain?: boolean;
}

export interface ItemOverride {
  action: ActionType;
  reason: string;
}

export interface BuildConfig {
  primarySkills: string[];
  supportSkills: string[];
  autoDetected: boolean;
}
