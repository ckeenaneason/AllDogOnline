// Settings specific to the extension live here

export interface Settings {
  paused: boolean;
  saveSnapshots: boolean;
}

const DEFAULTS: Settings = { paused: false, saveSnapshots: false };

export async function getSettings(): Promise<Settings> {
  return await chrome.storage.local.get(DEFAULTS);
}

export async function setSettings(patch: Partial<Settings>): Promise<void> {
  await chrome.storage.local.set(patch);
}
