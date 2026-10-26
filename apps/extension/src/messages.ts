import type { LootEvent, UISnapshot } from '@ado/core';

// Flag traffic from MAIN-world we want to track
export const CAPTURE_TAG = 'ado-capture';

export interface CaptureMessage {
  tag: typeof CAPTURE_TAG;
  url: string;
  requestBody: string | null;
  responseBody: string;
  capturedAt: number;
}

export type RuntimeMessage =
  { type: 'turn'; snapshot: UISnapshot; events: LootEvent[]; capturedAt: number } | { type: 'dataChanged' };
