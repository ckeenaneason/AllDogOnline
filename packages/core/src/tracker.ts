import { PARSER_VERSION, type ItemDrop, type LootEvent, type LootItem, type Outcome, type UISnapshot } from './types';

const DEFEATED_RE = /You defeated (.+?)!/;
const APPEARS_RE = /^(.+?) appears!/;
const FLED_RE = /Got away safely!/;
const PLAYER_DEFEATED_RE = /You were defeated!/;
const CHEST_IMAGE = 'tower_treasure_open';

interface OpenFight {
  mobKey: string;
  name: string | null;
  area: string;
  startedAt: number;
  partial: boolean;
}

export interface TrackerState {
  fight: OpenFight | null;
  /** Mob whose fight already ended but whose portrait is still on screen; repeat snapshots are ignored. */
  resolvedMob: string | null;
  /** The chest currently on screen has already been recorded. */
  chestResolved: boolean;
}

export interface StepContext {
  now: number;
  newId: () => string;
}

export interface StepResult {
  state: TrackerState;
  events: LootEvent[];
}

export function initialTrackerState(): TrackerState {
  return { fight: null, resolvedMob: null, chestResolved: false };
}

/** `/img/tower/enemy_papa_peeper.png` → `papa_peeper` */
export function mobKeyFromImage(image: string): string {
  const file = image.split('/').pop() ?? image;
  return file.replace(/\.[a-z0-9]+$/i, '').replace(/^enemy_/, '');
}

/** Collapse repeated loot entries into quantities, keyed by image. */
export function groupDrops(items: LootItem[]): ItemDrop[] {
  const drops = new Map<string, ItemDrop>();
  for (const item of items) {
    const existing = drops.get(item.image);
    if (existing) existing.qty += 1;
    else drops.set(item.image, { itemKey: item.image, itemName: item.name, qty: 1 });
  }
  return [...drops.values()];
}

function mobEvent(
  fight: OpenFight,
  outcome: Outcome,
  drops: ItemDrop[],
  name: string | null,
  ctx: StepContext
): LootEvent {
  return {
    id: ctx.newId(),
    sourceType: 'mob',
    sourceKey: fight.mobKey,
    sourceName: name,
    area: fight.area,
    outcome,
    drops,
    startedAt: fight.startedAt,
    endedAt: ctx.now,
    partial: fight.partial,
    parserVersion: PARSER_VERSION
  };
}

/**
 * Advance the encounter tracker by one snapshot. Snapshots carry no encounter IDs,
 * so encounters are reconstructed from the sequence and de-duplicated via state.
 */
export function step(prev: TrackerState, snap: UISnapshot, ctx: StepContext): StepResult {
  const events: LootEvent[] = [];
  let { fight, resolvedMob } = prev;

  // Chests: record once per chest screen.
  const chestOpen = snap.eventImage.includes(CHEST_IMAGE) && snap.loot.visible;
  if (chestOpen && !prev.chestResolved) {
    events.push({
      id: ctx.newId(),
      sourceType: 'chest',
      sourceKey: 'chest',
      sourceName: 'Treasure Chest',
      area: snap.area,
      outcome: 'opened',
      drops: groupDrops(snap.loot.items),
      startedAt: ctx.now,
      endedAt: ctx.now,
      partial: false,
      parserVersion: PARSER_VERSION
    });
  }
  const chestResolved = chestOpen;

  // Mobs
  const mobKey = snap.mob.visible && snap.mob.image !== '' ? mobKeyFromImage(snap.mob.image) : null;
  const appears = APPEARS_RE.exec(snap.textbox);

  if (resolvedMob !== null) {
    if (mobKey === resolvedMob && !appears) {
      return { state: { fight: null, resolvedMob, chestResolved }, events };
    }
    resolvedMob = null;
  }

  if (mobKey === null) {
    return { state: { fight: null, resolvedMob, chestResolved }, events };
  }

  if (!fight || fight.mobKey !== mobKey || appears) {
    fight = {
      mobKey,
      name: appears?.[1] ?? null,
      area: snap.area,
      startedAt: ctx.now,
      partial: snap.mob.hp < snap.mob.maxHp
    };
  }

  const defeated = DEFEATED_RE.exec(snap.textbox);
  if (defeated || (snap.mob.hp <= 0 && snap.mob.animation === 'enemy-death')) {
    const name = defeated?.[1] ?? fight.name;
    events.push(mobEvent(fight, 'victory', groupDrops(snap.loot.items), name, ctx));
    return { state: { fight: null, resolvedMob: mobKey, chestResolved }, events };
  }

  const outcome = FLED_RE.test(snap.textbox) ? 'fled' : PLAYER_DEFEATED_RE.test(snap.textbox) ? 'loss' : null;
  if (outcome) {
    events.push(mobEvent(fight, outcome, [], fight.name, ctx));
    return { state: { fight: null, resolvedMob: mobKey, chestResolved }, events };
  }

  return { state: { fight, resolvedMob: null, chestResolved }, events };
}
