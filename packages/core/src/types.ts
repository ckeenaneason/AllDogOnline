export const PARSER_VERSION = 1; //increment for data scheme updates
export const TOWER_TAKE_TURN = 'tower.takeTurn'; //tRPC procedure for tower events

export type SourceType = 'mob' | 'chest';
export type Outcome = 'victory' | 'fled' | 'loss' | 'opened';

export interface LootItem {
  image: string;
  name: string;
}

/**
 * Filtered subset of battle info we care about
 * Deliberately excludes player identity (playerPortrait) info
 */
export interface UISnapshot {
  turn: string | null; // internal tracking
  state: string;
  area: string; // where the fight is occurring
  mob: {
    visible: boolean;
    image: string;
    hp: number;
    maxHp: number;
    animation: string | null;
  };
  eventImage: string; // controls type of chest
  textbox: string;
  textStatic: string;
  loot: {
    visible: boolean;
    items: LootItem[];
  };
}

export interface ItemDrop {
  itemKey: string; // item image path is used as the key
  itemName: string;
  qty: number;
}

/**
 * The outcome of an event that can produce loot (mob encounter or chest)
 * This is what gets stored and later submitted
 */
export interface LootEvent {
  id: string;
  sourceType: SourceType;
  sourceKey: string; //unique source key
  sourceName: string | null;
  area: string;
  outcome: Outcome;
  drops: ItemDrop[];
  startedAt: number;
  endedAt: number;
  partial: boolean; // account for partial events, i.e. page reloaded mid-fight
  parserVersion: number; // data schema version tracking
}
