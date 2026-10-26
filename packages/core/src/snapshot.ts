import type { LootItem, UISnapshot } from './types';
import { isRecord, toNumber, toRecord, toString } from './util';

/**
 * Reduces a 'tower.takeTurn' output to a santized {@link UISnapshot}.
 * Returns null if the output is not considered a tower UI snapshot
 * @param output
 * @param input
 * @returns
 */
export function sanitize(output: unknown, input?: unknown): UISnapshot | null {
  if (!isRecord(output) || !isRecord(output.ui)) return null;
  const ui = output.ui;

  const mob = toRecord(ui.mobPortrait);
  const loot = toRecord(ui.lootDisplay);
  const items: LootItem[] = Array.isArray(loot.items)
    ? loot.items.filter(isRecord).map((item) => ({ image: toString(item.image), name: toString(item.name) }))
    : [];

  return {
    turn: isRecord(input) && typeof input.turn === 'string' ? input.turn : null,
    state: toString(output.state),
    area: toString(toRecord(ui.levelName).text),
    mob: {
      visible: mob.visible === true,
      image: toString(mob.image),
      hp: toNumber(mob.hp),
      maxHp: toNumber(mob.maxHp),
      animation: typeof mob.currentAnimation === 'string' ? mob.currentAnimation : null
    },
    eventImage: toString(toRecord(ui.eventPortrait).image),
    textbox: toString(toRecord(ui.textbox).text),
    textStatic: toString(toRecord(ui.textStatic).text),
    loot: {
      visible: loot.visible === true,
      items
    }
  };
}
