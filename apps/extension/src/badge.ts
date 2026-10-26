import { countEvents } from './database';
import { getSettings } from './settings';

export async function refreshBadge(): Promise<void> {
  const [count, { paused }] = await Promise.all([countEvents(), getSettings()]);
  await chrome.action.setBadgeBackgroundColor({ color: paused ? '#888888' : '#2b6cb0' });
  await chrome.action.setBadgeText({ text: paused ? 'off' : count > 999 ? '999+' : count ? String(count) : '' });
}
