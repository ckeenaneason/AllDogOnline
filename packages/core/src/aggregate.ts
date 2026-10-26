import type { LootEvent, SourceType } from './types';

/**
 * Summarized info for each item, in relation to one source
 */
export interface ItemStats {
  itemKey: string;
  itemName: string;
  timesDropped: number;
  totalQty: number;
  rate: number;
}

/**
 * Summarized info per loot source
 */
export interface SourceStats {
  sourceType: SourceType;
  sourceKey: string;
  sourceName: string;
  area: string | null; //allow null for merging across areas
  samples: number; // denominator for drop rates
  fled: number;
  losses: number;
  noDrop: number;
  items: ItemStats[];
}

/**
 * How should collected data be aggregated
 */
export interface AggregateOptions {
  byArea?: boolean;
}

/**
 * Convert a raw key into consistant human-readable format
 * Example: papa_peeper > Papa Peeper
 * @param key raw key string
 * @returns standard format string
 */
export function prettifyKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Process individual events into a consolidated format.
 * Supports different aggregation (summarization) options.
 * @param events
 * @param options
 * @returns
 */
export function aggregate(events: LootEvent[], options: AggregateOptions = {}): SourceStats[] {
  interface Source {
    stats: SourceStats;
    items: Map<string, { itemName: string; timesDropped: number; totalQty: number }>;
  }

  const groups = new Map<string, Source>();

  for (const event of events) {
    const area = options.byArea ? event.area : null;
    const groupKey = `${event.sourceType}|${event.sourceKey}|${area ?? ''}`;
    let agg = groups.get(groupKey);
    if (!agg) {
      agg = {
        stats: {
          sourceType: event.sourceType,
          sourceKey: event.sourceKey,
          sourceName: event.sourceName ?? prettifyKey(event.sourceKey),
          area,
          samples: 0,
          fled: 0,
          losses: 0,
          noDrop: 0,
          items: []
        },
        items: new Map()
      };

      groups.set(groupKey, agg);
    }

    if (event.sourceName) agg.stats.sourceName = event.sourceName;

    // note fled and loss, but don't include in loot pool stats
    if (event.outcome === 'fled') {
      agg.stats.fled += 1;
      continue;
    }
    if (event.outcome === 'loss') {
      agg.stats.losses += 1;
      continue;
    }

    agg.stats.samples += 1;
    if (event.drops.length === 0) agg.stats.noDrop += 1;
    for (const drop of event.drops) {
      const item = agg.items.get(drop.itemKey) ?? { itemName: drop.itemName, timesDropped: 0, totalQty: 0 };
      item.itemName = drop.itemName;
      item.timesDropped += 1;
      item.totalQty += drop.qty;
      agg.items.set(drop.itemKey, item);
    }
  }

  return [...groups.values()]
    .map(({ stats, items }) => {
      stats.items = [...items.entries()]
        .map(([itemKey, item]) => {
          return { itemKey, ...item, rate: item.timesDropped / stats.samples };
        })
        .sort((a, b) => b.rate - a.rate || a.itemName.localeCompare(b.itemName));
      return stats;
    })
    .sort(
      (a, b) =>
        a.sourceType.localeCompare(b.sourceType) ||
        a.sourceName.localeCompare(b.sourceName) ||
        (a.area ?? '').localeCompare(b.area ?? '')
    );
}

function csvCell(value: string | number | null): string {
  const text = value === null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** One row per (source, item), plus a "(no drop)" row per source. */
export function statsToCsv(stats: SourceStats[]): string {
  const header = [
    'source_type',
    'source_key',
    'source_name',
    'area',
    'samples',
    'fled',
    'losses',
    'item_key',
    'item_name',
    'times_dropped',
    'total_qty',
    'rate'
  ];
  const rows: (string | number | null)[][] = [];
  for (const s of stats) {
    const base = [s.sourceType, s.sourceKey, s.sourceName, s.area, s.samples, s.fled, s.losses];
    for (const item of s.items) {
      rows.push([...base, item.itemKey, item.itemName, item.timesDropped, item.totalQty, item.rate.toFixed(4)]);
    }
    if (s.samples > 0) {
      rows.push([...base, '', '(no drop)', s.noDrop, 0, (s.noDrop / s.samples).toFixed(4)]);
    }
  }
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n') + '\n';
}
