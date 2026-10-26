// Runs in the ISOLATED world. Receives raw captures from the interceptor, reduces them to
// sanitized snapshots, tracks encounters, and hands results to the service worker.
// Tracker state lives here (per tab) so an idle MV3 service worker can't lose a fight in progress.
import { initialTrackerState, sanitize, step, unwrapBatch, TOWER_TAKE_TURN } from '@ado/core';
import { CAPTURE_TAG, type CaptureMessage, type RuntimeMessage } from '../messages';

let state = initialTrackerState();

function isCaptureMessage(data: unknown): data is CaptureMessage {
  return typeof data === 'object' && data !== null && (data as { tag?: unknown }).tag === CAPTURE_TAG;
}

function parseJson(text: string | null): unknown {
  if (text === null) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function send(message: RuntimeMessage): void {
  try {
    chrome.runtime.sendMessage(message).catch((err: unknown) => console.warn('[drop-logger] send failed', err));
  } catch {
    // Extension was reloaded; this content script is orphaned until the page reloads.
    //TODO better handling
  }
}

window.addEventListener('message', (event: MessageEvent<unknown>) => {
  if (event.source !== window || !isCaptureMessage(event.data)) return;

  const { url, requestBody, responseBody, capturedAt } = event.data;

  for (const call of unwrapBatch(url, parseJson(requestBody), parseJson(responseBody))) {
    if (call.procedure !== TOWER_TAKE_TURN) continue;
    const snapshot = sanitize(call.output, call.input);
    if (!snapshot) continue;

    const result = step(state, snapshot, { now: capturedAt, newId: () => crypto.randomUUID() });
    state = result.state;
    send({ type: 'turn', snapshot, events: result.events, capturedAt });
  }
});
