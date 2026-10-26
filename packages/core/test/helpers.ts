/**
 * Helper functionality for unit tests
 */

import { readFileSync } from 'node:fs';
import { initialTrackerState, sanitize, step, unwrapBatch } from '../src';
import type { LootEvent, UISnapshot } from '../src';

export const TAKE_TURN_URL = 'https://dogonline.net/api/trpc/tower.takeTurn?batch=1';

export function fixture(name: string): unknown {
  return JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8'));
}

/**
 * Load a response fixture (and optionally, request fixture) as a sanitized snapshot
 * @param response Name of fixture file to load. Excludes extension and path.
 * @param request Name of fixture file to load. Excludes extension and path.
 * @returns
 */
export function toSnapshot(response: string, request?: string): UISnapshot {
  const [call] = unwrapBatch(TAKE_TURN_URL, request ? fixture(request) : undefined, fixture(response));
  const snapshot = call && sanitize(call.output, call.input);
  if (!snapshot) throw new Error(`fixture ${response} did not produce a snapshot`);
  return snapshot;
}

/** Feed snapshots through a fresh tracker; tick N gets `now = N`. */

/**
 * Simulates running a sequence of snapshots through a fresh tracker instance.
 * @param snapshots
 * @returns
 */
export function run(snapshots: UISnapshot[]): LootEvent[] {
  let state = initialTrackerState();
  const events: LootEvent[] = [];
  let tick = 0;
  for (const snapshot of snapshots) {
    tick += 1;
    const result = step(state, snapshot, {
      now: tick,
      newId: () => `e${tick}-${events.length}`
    });
    state = result.state;
    events.push(...result.events);
  }
  return events;
}
