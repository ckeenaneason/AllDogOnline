/**
 * Unit testing for actual message/turn processing
 */

import { describe, expect, it } from 'vitest';
import { mobKeyFromImage } from '../src';
import { run, toSnapshot } from './helpers';

const start = () => toSnapshot('fight_start_response', 'fight_start_request');
const retreatFail = () => toSnapshot('fight_retreat_failure_response', 'fight_retreat_request');
const retreatOk = () => toSnapshot('fight_retreat_success_response', 'fight_retreat_request');
const victoryNoDrop = () => toSnapshot('fight_victory_noDrop_response', 'fight_victory_noDrop_request');
const victoryOneDrop = () => toSnapshot('fight_victory_oneDrop_response');
const victoryMultiDrop = () => toSnapshot('fight_victory_multiDrop_response');
const chest = () => toSnapshot('chest_open_response');

describe('mobKeyFromImage', () => {
  it('strips path, extension and enemy_ prefix', () => {
    expect(mobKeyFromImage('/img/tower/enemy_papa_peeper.png')).toBe('papa_peeper');
  });
});

describe('tracker', () => {
  it('records a full fight with a failed retreat and no drops', () => {
    const events = run([start(), retreatFail(), victoryNoDrop()]);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      sourceType: 'mob',
      sourceKey: 'threeper',
      sourceName: 'Threeper',
      area: "Peeper's Parlor",
      outcome: 'victory',
      drops: [],
      partial: false,
      startedAt: 1,
      endedAt: 3
    });
  });

  it('records a successful retreat once', () => {
    const events = run([start(), retreatOk(), retreatOk()]);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ sourceKey: 'threeper', sourceName: 'Threeper', outcome: 'fled', drops: [] });
  });

  it('records a victory seen without its start as partial', () => {
    const events = run([victoryOneDrop()]);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      sourceKey: 'creeper',
      sourceName: 'Creeper',
      outcome: 'victory',
      partial: true,
      drops: [{ itemKey: '/img/item_cheese.png', itemName: 'Cheese', qty: 1 }]
    });
  });

  it('does not double-count a repeated victory snapshot', () => {
    const events = run([victoryMultiDrop(), victoryMultiDrop()]);
    expect(events).toHaveLength(1);
    expect(events[0]?.sourceKey).toBe('papa_peeper');
    expect(events[0]?.drops.map((d) => d.itemName)).toEqual(['Milk', 'Hot Cocoa']);
  });

  it('starts a new fight against the same mob after the previous one ended', () => {
    const viaAppears = run([victoryNoDrop(), start(), victoryNoDrop()]);
    expect(viaAppears.filter((e) => e.outcome === 'victory')).toHaveLength(2);

    const viaHiddenPortrait = run([victoryMultiDrop(), chest(), victoryMultiDrop()]);
    expect(viaHiddenPortrait.filter((e) => e.sourceType === 'mob')).toHaveLength(2);
  });

  it('records an opened chest once', () => {
    const events = run([chest(), chest()]);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      sourceType: 'chest',
      outcome: 'opened',
      drops: [{ itemName: 'Bottle Cap', qty: 1 }]
    });
  });

  it('records a player defeat once, with no drops', () => {
    const defeat = () => toSnapshot('fight_defeat_response');
    const events = run([defeat(), defeat()]);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      sourceKey: 'ghost',
      area: 'Floor 1',
      outcome: 'loss',
      drops: [],
      partial: true
    });
  });

  it('emits nothing for turns in the middle of a fight', () => {
    expect(run([start(), retreatFail()])).toEqual([]);
  });
});
