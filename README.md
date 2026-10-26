# AllDogOnline

A tool for collecting drop-rate data from [Dog Online](https://dogonline.net) for the community wiki. Future-state may include additional user-friendly features, such as collection tracking. This tool is not intended to exploit the game in any way, just intended to help support community information gathering and ease of use. This tool is also not affiliated with the official Dog Online team in any way.

Additionally, this software ONLY looks at YOUR active player actions. No additional calls are made to the Dog Online servers or API. Real API responses included under `packages/core/test/fixtures` are third-party game data content, sanitized and included for testing-purposes only.

## Overview

- `packages/core`: game-specific parsing (tRPC unwrap, snapshot sanitizing, encounter tracker, drop-rate aggregation). Pure TypeScript, no browser APIs; intended to be expanded upon in the future for a centralized aggregation ingestion server.
- `apps/extension`: Browser MV3 extension that passively records tower encounters and chest loot while you play.

## Setup

Node runs in Docker (Docker Desktop), so nothing is installed on the host.

```sh
docker compose up                # install deps, build apps/extension/dist, rebuild on change
docker compose run --rm test     # run the core unit tests once
docker compose run --rm test sh -c "npm run typecheck && npm run build"   # one-off checks
docker compose run --rm test sh -c "npm run lint && npm run format:check" # ESLint + Prettier
```

For editing, open the folder in VS Code and run **Dev Containers: Reopen in Container** (requires the Dev Containers extension). VS Code attaches to the `dev` service, so IntelliSense, the terminal and the Vitest test explorer all use the container's dependencies, and the build watcher keeps running.

Dependencies live in the `node_modules` Docker volume. After changing a `package.json`, the next `docker compose up` installs them; `docker compose build` refreshes the image layer.

## Testing

### Chrome

1. Load the extension: `chrome://extensions`
2. Enable Developer mode
3. **Load unpacked**
4. Select `apps/extension/dist/chrome`

### Firefox

1. Go to `about:debugging`
2. Click 'This Firefox'
3. Click 'Load Temporary Add-on'
4. Select `dist/firefox/manifest.json`

After a rebuild, click the reload icon on the extension card and refresh the game tab.

## How it works

1. `src/inject/interceptor.ts` (MAIN world) observes `fetch`/XHR calls to `/api/trpc/tower.takeTurn` and posts the raw bodies to the page.
2. `src/content/tracker.ts` (ISOLATED world) sanitizes each response (player name/uuid are dropped) and runs the encounter tracker from `core`.
3. Completed encounters (victory/fled) and opened chests are stored in IndexedDB by the service worker; the extension pop-up shows per-mob drop rates and supports exporting to CSV/JSON for now.

## Debugging

The service worker console (`chrome://extensions` > _Inspect views: service worker_) logs every recorded event. The popup's **Debug > Save sanitized snapshots** option stores every turn so new cases (e.g. a player defeat) can be exported and added as fixtures for future development and testing.
