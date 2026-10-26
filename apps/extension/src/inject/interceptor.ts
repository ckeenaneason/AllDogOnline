/**
 * The interceptor runs in the page's MAIN world at document_start. It observes,
 * but NEVER MODIFIES, tRPC tower.takeTurn traffic and forwards raw bodies to the
 * ISOLATED-world tracker. No chrome.* APIs are available here.
 */
import { includesProcedure, TOWER_TAKE_TURN } from '@ado/core';
import { CAPTURE_TAG, type CaptureMessage } from '../messages';

function trackedUrl(url: string): string | null {
  try {
    const resolved = new URL(url, location.href);
    return resolved.origin === location.origin && includesProcedure(resolved.href, TOWER_TAKE_TURN)
      ? resolved.href
      : null;
  } catch {
    return null;
  }
}

function emit(url: string, requestBody: string | null, responseBody: string): void {
  const message: CaptureMessage = { tag: CAPTURE_TAG, url, requestBody, responseBody, capturedAt: Date.now() };
  window.postMessage(message, location.origin);
}

const originalFetch = fetch;
window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let url: string | null;
  let requestBody: Promise<string | null> = Promise.resolve(null);
  try {
    url = trackedUrl(input instanceof Request ? input.url : String(input));
    if (url && typeof init?.body === 'string') requestBody = Promise.resolve(init.body);
    else if (url && input instanceof Request)
      requestBody = input
        .clone()
        .text()
        .catch(() => null);
  } catch {
    url = null;
  }

  const response = await originalFetch.call(window, input, init);

  if (url) {
    const capturedUrl = url;
    try {
      // Clone synchronously, before the page gets a chance to consume the body.
      const clone = response.clone();
      Promise.all([requestBody, clone.text()])
        .then(([req, res]) => emit(capturedUrl, req, res))
        .catch(() => {});
    } catch {
      // never interfere with the game
    }
  }
  return response;
};

// // XMLHttpRequest
// const xhrUrls = new WeakMap<XMLHttpRequest, string>();
// const originalOpen = XMLHttpRequest.prototype.open;
// const originalSend = XMLHttpRequest.prototype.send;

// XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, ...args: unknown[]) {
//   try {
//     const url = trackedUrl(String(args[1]));
//     if (url) xhrUrls.set(this, url);
//     else xhrUrls.delete(this);
//   } catch {
//     // ignore
//   }
//   return (originalOpen as (...a: unknown[]) => void).apply(this, args);
// } as typeof XMLHttpRequest.prototype.open;

// XMLHttpRequest.prototype.send = function (this: XMLHttpRequest, body?: Document | XMLHttpRequestBodyInit | null) {
//   const url = xhrUrls.get(this);
//   if (url) {
//     const requestBody = typeof body === 'string' ? body : null;
//     this.addEventListener('load', () => {
//       try {
//         if (this.responseType === '' || this.responseType === 'text') emit(url, requestBody, this.responseText);
//         else if (this.responseType === 'json') emit(url, requestBody, JSON.stringify(this.response));
//       } catch {
//         // ignore
//       }
//     });
//   }
//   return originalSend.call(this, body);
// };
