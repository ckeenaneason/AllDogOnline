import { openDB, type DBSchema } from 'idb';
import type { LootEvent, UISnapshot } from '@ado/core';

//increment if data structure changes
const SCHEMA_VERSION = 1;

export interface StoredSnapshot {
  seq?: number;
  capturedAt: number;
  snapshot: UISnapshot;
}

interface Schema extends DBSchema {
  events: { key: string; value: LootEvent; indexes: { byEndedAt: number } };
  snapshots: { key: number; value: StoredSnapshot };
}

// Shared by the service worker and the popup (same extension origin).
const dbPromise = openDB<Schema>('ado-drop-logger', SCHEMA_VERSION, {
  upgrade(db) {
    db.createObjectStore('events', { keyPath: 'id' }).createIndex('byEndedAt', 'endedAt');
    db.createObjectStore('snapshots', { keyPath: 'seq', autoIncrement: true });
  }
});

export async function addEvents(events: LootEvent[]): Promise<void> {
  const tx = (await dbPromise).transaction('events', 'readwrite');
  await Promise.all([...events.map((event) => tx.store.put(event)), tx.done]);
}

export async function addSnapshot(snapshot: StoredSnapshot): Promise<void> {
  await (await dbPromise).add('snapshots', snapshot);
}

export async function allEvents(): Promise<LootEvent[]> {
  return (await dbPromise).getAllFromIndex('events', 'byEndedAt');
}

export async function countEvents(): Promise<number> {
  return (await dbPromise).count('events');
}

export async function allSnapshots(): Promise<StoredSnapshot[]> {
  return (await dbPromise).getAll('snapshots');
}

export async function clearAll(): Promise<void> {
  const tx = (await dbPromise).transaction(['events', 'snapshots'], 'readwrite');
  await Promise.all([tx.objectStore('events').clear(), tx.objectStore('snapshots').clear(), tx.done]);
}
