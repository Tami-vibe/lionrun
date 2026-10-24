# Recovery baseline

Recorded 2026-10-24, before Phase 1 changed any application code. The dev server on port 3002 was left running. A production `next build` was not started, because that build writes `.next/` while the dev server is using it.

## Git

- Branch at measurement: `main`
- HEAD: `ee65eb6` Add engineering governance and Tech Lead rules
- The website builder itself was uncommitted. The recovery checkpoint commit is the snapshot of that tree.

## Tests and types

- `node --experimental-strip-types --test tests/editor.test.mjs tests/media.test.mjs`
- Result: 17 passed, 0 failed. Node warned that `package.json` has no `"type": "module"`.
- `package.json` had no `test` script.
- `./node_modules/.bin/tsc --noEmit --pretty false --incremental false` exited 2.
- Both errors were `TS18048` at `src/app/site/blocks.ts:212`: `content.hours` is possibly undefined.
- `next.config.ts` does not set `typescript.ignoreBuildErrors`.

## Known defects left for the recovery

1. `blocks.ts:212` calls `content.hours.trim()` while `hours` is optional. A contact block that passes validation without hours throws during migration.
2. `src/app/page.tsx` load effect deletes `business-builder-workspace-v2` when parsing or migration throws, and also when the saved value fails validation. The following autosave can then replace it. The effect copies the raw value to `business-builder-workspace-v2-unreadable` first, only when that key is empty.
3. `bundled()` in `blocks.ts` treats a missing image `src` as stock media, so a cleared image can be refilled on the next load. Phase 2.
4. Pains items titled “Unclear timelines”, “Surprise costs”, or “Uncertain quality” have their descriptions replaced on load. Phase 2.

## Browser backup

Stored outside git in `.recovery/2026-10-24/`.

- Cursor browser at `http://localhost:3002`: `business-builder-workspace-v2`, schema 3, 13 pages, 210,858 bytes, sha256 `31c8a9659036f69650dbd4bf21f7af1235037703f0f090b8d66305efea8835ac`. Both contact blocks had hours. IndexedDB `business-builder-media` had no assets in that browser.
- Chrome Default: the origin IndexedDB for `http://localhost:3002` was copied, including the 4.4 MB blob directory. Chrome localStorage was not exported. It lives in a shared LevelDB that also contains other sites, and the saved value is compressed.
