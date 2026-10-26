import { aggregate, statsToCsv, type SourceStats } from '@ado/core';
import { refreshBadge } from '../badge';
import { allEvents, allSnapshots, clearAll } from '../database';
import type { RuntimeMessage } from '../messages';
import { getSettings, setSettings } from '../settings';

const popupRoot = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const list = popupRoot<HTMLElement>('list');
const status = popupRoot<HTMLElement>('status');
const pauseButton = popupRoot<HTMLButtonElement>('pause');
const byAreaInput = popupRoot<HTMLInputElement>('byArea');
const saveSnapshotsInput = popupRoot<HTMLInputElement>('saveSnapshots');
const clearButton = popupRoot<HTMLButtonElement>('clear');

/**
 * Create and populate DOM element in existing DOM tree structure
 * @param tag HTML tag to create/extend
 * @param props HTML props
 * @param children Children nodes of new DOM element
 * @returns created DOM element
 */
function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

/**
 * Output a formatted percent in fixed-point notation
 * Precision is determined by final percentage
 * @param x Decimal to format (0 < x < 1.0)
 * @returns
 */
function toPercent(x: number): string {
  return `${(x * 100).toFixed(x > 0 && x < 0.1 ? 1 : 0)}%`;
}

// TODO genericize table row handling further

/**
 * Create and populate an HTML table row on the DOM
 * Used for individual item drops per source
 * @param name Name of the row
 * @param count
 * @param rate
 * @param title
 * @param muted Applies muted css color scheme
 * @returns
 */
function row(name: string, count: number, rate: number, title = '', muted = false) {
  return element(
    'tr',
    { className: muted ? 'muted' : '' },
    element('td', { textContent: name, title }),
    element('td', { textContent: String(count) }),
    element('td', { textContent: toPercent(rate) })
  );
}

/**
 * Render granular stats for a specific loot source.
 * Data is displayed as a short summarization but supports an additional
 * details table drop-down for full summary.
 * @param source Loot source to display info for
 * @param key Unique aggregate key
 * @param open Controls the detail drop table display
 * @returns
 */
function renderSource(source: SourceStats, key: string, open: boolean): HTMLElement {
  const title = source.area ? `${source.sourceName} · ${source.area}` : source.sourceName;
  const meta =
    source.sourceType === 'mob'
      ? `${source.samples} kills${source.fled ? ` · ${source.fled} fled` : ''}${source.losses ? ` · ${source.losses} lost` : ''}`
      : `${source.samples} opened`;

  const details = element('details', { className: 'source', open });
  details.dataset.key = key;
  details.append(
    element(
      'summary',
      {},
      element('span', { className: 'name', textContent: title }),
      element('span', { className: 'meta', textContent: meta })
    )
  );

  if (source.samples > 0) {
    const rows = source.items.map((i) => row(i.itemName, i.timesDropped, i.rate, i.itemKey));
    rows.push(row('(no drop)', source.noDrop, source.noDrop / source.samples, '', true));
    details.append(
      element(
        'table',
        {},
        element(
          'thead',
          {},
          element('tr', {}, ...['Item', 'Drops', 'Rate'].map((h) => element('th', { textContent: h })))
        ),
        element('tbody', {}, ...rows)
      )
    );
  }
  return details;
}

//TODO can we streamline aggregation performance?

/**
 * Main entry to render extension pop-up window.
 * @returns
 */
async function render(): Promise<void> {
  const [events, settings] = await Promise.all([allEvents(), getSettings()]);
  const openKeys = new Set(
    [...list.querySelectorAll<HTMLDetailsElement>('details.source[open]')].map((d) => d.dataset.key)
  );

  status.textContent = `${events.length} recorded · ${settings.paused ? 'paused' : 'recording'}`;
  pauseButton.textContent = settings.paused ? 'Resume' : 'Pause';
  saveSnapshotsInput.checked = settings.saveSnapshots;

  const stats = aggregate(events, { byArea: byAreaInput.checked });
  list.replaceChildren();
  if (stats.length === 0) {
    list.append(
      element('p', {
        className: 'empty muted',
        textContent: 'Nothing recorded yet. Play some tower fights on Dog Online.'
      })
    );
    return;
  }

  for (const [type, heading] of [
    ['mob', 'Mobs'],
    ['chest', 'Chests']
  ] as const) {
    const group = stats.filter((s) => s.sourceType === type);
    if (group.length === 0) continue;
    list.append(element('h2', { textContent: heading }));
    for (const s of group) {
      const key = `${s.sourceType}|${s.sourceKey}|${s.area ?? ''}`;
      list.append(renderSource(s, key, openKeys.has(key)));
    }
  }
}

//TODO refactor download to utils
/**
 * Create download for specified file type
 * @param filename
 * @param text
 * @param type
 */
function download(filename: string, text: string, type: string): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  element('a', { href: url, download: filename }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const dateStamp = () => new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

pauseButton.addEventListener('click', async () => {
  const { paused } = await getSettings();
  await setSettings({ paused: !paused });
  await refreshBadge();
  await render();
});

saveSnapshotsInput.addEventListener('change', () => void setSettings({ saveSnapshots: saveSnapshotsInput.checked }));
byAreaInput.addEventListener('change', () => void render());

// Support exporting full data to CSV
popupRoot('exportCsv').addEventListener('click', async () => {
  const stats = aggregate(await allEvents(), { byArea: byAreaInput.checked });
  download(`drop-rates-${dateStamp()}.csv`, statsToCsv(stats), 'text/csv');
});

popupRoot('exportJson').addEventListener('click', async () => {
  download(`drop-events-${dateStamp()}.json`, JSON.stringify(await allEvents(), null, 2), 'application/json');
});

popupRoot('exportSnapshots').addEventListener('click', async () => {
  download(`snapshots-${dateStamp()}.json`, JSON.stringify(await allSnapshots(), null, 2), 'application/json');
});

// Two-step confirm instead of window.confirm(), which is unreliable in extension popups.
let clearArmed: number | undefined;
clearButton.addEventListener('click', async () => {
  if (clearArmed === undefined) {
    clearButton.textContent = 'Are you really sure?';
    clearArmed = window.setTimeout(() => {
      clearArmed = undefined;
      clearButton.textContent = 'Clear';
    }, 3000);
    return;
  }
  window.clearTimeout(clearArmed);
  clearArmed = undefined;
  clearButton.textContent = 'Clear';
  await clearAll();
  await refreshBadge();
  await render();
});

chrome.runtime.onMessage.addListener((message: RuntimeMessage) => {
  if (message.type === 'dataChanged') void render();
});

void render();
