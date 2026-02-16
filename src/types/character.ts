/** Raw JSON export from Project Gorgon Lore Exporter — Report: "CharacterSheet" */
export interface CharacterExport {
  Character: string;
  Timestamp: string;
  Report: 'CharacterSheet';
  ReportVersion: number;
  Race: string;
  Skills: Record<string, CharacterSkill>;
  RecipeCompletions: Record<string, number>;
  CurrentStats: Record<string, number>;
  Currencies: CharacterCurrencies;
  ActiveQuests: string[];
  ActiveWorkOrders: string[];
  CompletedWorkOrders: string[];
  NPCs: Record<string, { FavorLevel: FavorLevel }>;
}

export interface CharacterSkill {
  Level: number;
  BonusLevels: number;
  XpTowardNextLevel: number;
  /** -1 means maxed */
  XpNeededForNextLevel: number;
  Abilities?: string[];
}

export interface CharacterCurrencies {
  GOLD: number;
  GUILDCREDITS: number;
  REDWINGTOKENS: number;
  DRUIDCREDITS: number;
  WARDENPOINTS: number;
  FAEENERGY: number;
  LIVEEVENTCREDITS: number;
  GLAMOUR_CREDITS: number;
  COMBAT_WISDOM: number;
  BLOOD_OATHS: number;
  VIDARIA_RENOWN: number;
  STATEHELM_RENOWN: number;
  STATEHELM_DEMERITS: number;
  NORALA_TOKENS: number;
}

export type FavorLevel =
  | 'Neutral'
  | 'Tolerated'
  | 'Comfortable'
  | 'Friends'
  | 'CloseFriends'
  | 'BestFriends'
  | 'LikeFamily'
  | 'SoulMates';
