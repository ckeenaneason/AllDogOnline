import { refreshBadge } from '../badge';
import { addEvents, addSnapshot } from '../database';
import type { RuntimeMessage } from '../messages';
import { getSettings } from '../settings';

async function handleTurn(message: Extract<RuntimeMessage, { type: 'turn' }>): Promise<void> {
  const settings = await getSettings();
  if (settings.paused) return;

  if (settings.saveSnapshots) await addSnapshot({ capturedAt: message.capturedAt, snapshot: message.snapshot });
  if (message.events.length === 0) return;

  await addEvents(message.events);
  for (const event of message.events) {
    console.info('[drop-logger]', event.outcome, event.sourceName ?? event.sourceKey, event.drops);
  }
  await refreshBadge();
  // Live-refresh the popup if it is open; no receiver is fine.
  chrome.runtime.sendMessage({ type: 'dataChanged' } satisfies RuntimeMessage).catch(() => {});
}

chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
  if (message.type !== 'turn') return false;
  handleTurn(message).then(
    () => sendResponse({ ok: true }),
    (err: unknown) => {
      console.error('[drop-logger] failed to store turn', err);
      sendResponse({ ok: false });
    }
  );
  return true;
});

chrome.runtime.onInstalled.addListener(() => void refreshBadge());
chrome.runtime.onStartup.addListener(() => void refreshBadge());
