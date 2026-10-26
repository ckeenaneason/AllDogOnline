/**
 * Unit tests for the aggregate function
 */

import { describe, expect, it } from 'vitest';
import { aggregate, statsToCsv, PARSER_VERSION, type ItemDrop, type LootEvent } from '../src';

let seq = 0;
function event(overrides: Partial<LootEvent>): LootEvent {
  seq += 1;
  return {
    id: `e${seq}`,
    sourceType: 'mob',
    sourceKey: 'creeper',
    sourceName: 'Creeper',
    area: "Peeper's Parlor",
    outcome: 'victory',
    drops: [],
    startedAt: seq,
    endedAt: seq,
    partial: false,
    parserVersion: PARSER_VERSION,
    ...overrides
  };
}

const cheese = (qty: number): ItemDrop => ({ itemKey: '/img/item_cheese.png', itemName: 'Cheese', qty });

describe('aggregate', () => {
  const events = [
    event({ drops: [cheese(1)] }),
    event({ drops: [cheese(2)] }),
    event({ drops: [] }),
    event({ outcome: 'fled' }),
    event({ outcome: 'loss' }),
    event({ sourceType: 'chest', sourceKey: 'chest', sourceName: 'Treasure Chest', outcome: 'opened' })
  ];

  it('uses victories as the denominator and counts no-drop kills', () => {
    const creeper = aggregate(events).find((s) => s.sourceKey === 'creeper');
    expect(creeper).toMatchObject({ samples: 3, fled: 1, losses: 1, noDrop: 1 });
    expect(creeper?.items).toHaveLength(1);
    expect(creeper?.items[0]).toMatchObject({ itemName: 'Cheese', timesDropped: 2, totalQty: 3 });
    expect(creeper?.items[0]?.rate).toBeCloseTo(2 / 3);
  });

  it('keeps chests separate', () => {
    const chest = aggregate(events).find((s) => s.sourceType === 'chest');
    expect(chest).toMatchObject({ samples: 1, noDrop: 1 });
  });

  it('can split by area', () => {
    const split = aggregate([...events, event({ area: 'Somewhere Else' })], { byArea: true });
    expect(
      split
        .filter((s) => s.sourceKey === 'creeper')
        .map((s) => s.area)
        .sort()
    ).toEqual(["Peeper's Parlor", 'Somewhere Else']);
  });

  it('exports CSV with an item row and a no-drop row', () => {
    const csv = statsToCsv(aggregate(events));
    expect(csv.split('\n')[0]).toBe(
      'source_type,source_key,source_name,area,samples,fled,losses,item_key,item_name,times_dropped,total_qty,rate'
    );
    expect(csv).toContain('mob,creeper,Creeper,,3,1,1,/img/item_cheese.png,Cheese,2,3,0.6667');
    expect(csv).toContain('mob,creeper,Creeper,,3,1,1,,(no drop),1,0,0.3333');
  });
});
