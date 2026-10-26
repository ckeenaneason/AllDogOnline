/**
 * Unit tests for general tRPC parsing functionality
 */

import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { includesProcedure, parseProcedures, sanitize, unwrapBatch, TOWER_TAKE_TURN } from '../src';
import { fixture, toSnapshot, TAKE_TURN_URL } from './helpers';

const responseFixtures = readdirSync(new URL('./fixtures/', import.meta.url))
  .filter((f) => f.endsWith('.json') && !f.endsWith('_request.json'))
  .map((f) => f.replace(/\.json$/, ''));

describe('parseProcedures', () => {
  it('reads single and batched procedure lists', () => {
    expect(parseProcedures(TAKE_TURN_URL)).toEqual(['tower.takeTurn']);
    expect(parseProcedures('/api/trpc/user.me,tower.takeTurn?batch=1')).toEqual(['user.me', 'tower.takeTurn']);
    expect(parseProcedures('/api/trpc/user.me%2Ctower.takeTurn')).toEqual(['user.me', 'tower.takeTurn']);
  });

  it('rejects non-tRPC URLs', () => {
    expect(parseProcedures('https://dogonline.net/img/tower/enemy_threeper.png')).toBeNull();
    expect(includesProcedure('/api/trpc/user.me', TOWER_TAKE_TURN)).toBe(false);
    expect(includesProcedure(TAKE_TURN_URL, TOWER_TAKE_TURN)).toBe(true);
  });
});

describe('unwrapBatch', () => {
  it('maps batch indices to procedures and unwraps superjson', () => {
    const [call] = unwrapBatch(TAKE_TURN_URL, fixture('fight_start_request'), fixture('fight_start_response'));
    expect(call?.procedure).toBe('tower.takeTurn');
    expect(call?.input).toEqual({ turn: 'move-down' });
    expect(call?.output).toMatchObject({ state: 'active' });
  });

  it('skips errored calls but keeps the rest of the batch', () => {
    const [startResult] = fixture('fight_start_response') as unknown[];
    const calls = unwrapBatch('/api/trpc/user.me,tower.takeTurn?batch=1', { 1: { json: { turn: 'move-down' } } }, [
      { error: { json: { message: 'nope' } } },
      startResult
    ]);
    expect(calls.map((c) => c.procedure)).toEqual(['tower.takeTurn']);
    expect(calls[0]?.input).toEqual({ turn: 'move-down' });
  });
});

describe('sanitize', () => {
  it.each(responseFixtures)('%s produces a snapshot without player identity', (name) => {
    const snapshot = toSnapshot(name);
    const json = JSON.stringify(snapshot);
    expect(json).not.toContain('REDACTED');
    expect(json).not.toContain('playerPortrait');
    expect(json).not.toContain('uuid');
    expect(snapshot.area).not.toBe('');
  });

  it('extracts the fields the tracker needs', () => {
    expect(toSnapshot('fight_victory_multiDrop_response')).toMatchObject({
      mob: { visible: true, image: '/img/tower/enemy_papa_peeper.png', hp: 0, maxHp: 40, animation: 'enemy-death' },
      loot: { visible: true, items: [{ name: 'Milk' }, { name: 'Hot Cocoa' }] }
    });
    expect(toSnapshot('fight_start_response', 'fight_start_request').turn).toBe('move-down');
  });

  it('returns null for non-tower outputs', () => {
    expect(sanitize({ foo: 1 })).toBeNull();
    expect(sanitize(null)).toBeNull();
  });
});
