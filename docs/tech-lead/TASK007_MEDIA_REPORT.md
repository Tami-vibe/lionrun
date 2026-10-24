# Task 007: persistent media manager

## Goal and outcome
Implemented browser-persistent uploads, reusable media attachments for every section, hero framing, native video controls, privacy-gated social embeds, SEO fields, captions, and asset-aware HTML/WordPress exports. No infrastructure, authentication, deployment, or dependency changes.

## Files changed
- `src/app/media/model.ts`: typed settings, bounded framing, HTTPS validation and exact-host social URL adapters.
- `src/app/media/store.ts`: IndexedDB blob persistence, file signatures/MIME/size checks, strict SVG validation and WebVTT uploads.
- `src/app/media/library.tsx`: reusable library/provider, upload and reuse controls, image/video/social renderer, captions, VideoObject metadata, framing/playback/mobile controls, and errors.
- `src/app/media/media.css`: media manager, framing, consent/fallback presentation, mobile posters and reduced-motion presentation.
- `src/app/media/export.ts`: referenced uploads packaged once, stable asset paths, WordPress URI placeholders, consent/player runtime, and external-reference manifest.
- `src/app/page.tsx`: hero migration from existing image/video fields, reusable section media slots, shared manager and export integration.
- `src/app/layout.tsx`: imports media stylesheet.
- `tests/media.test.mjs`: validation, provider-boundary, limits and framing tests.
- This report. Existing task003–005 archives, earlier UI work and unrelated dirty files were preserved.

## Observed checks
- `npm run lint`: PASS.
- `npx tsc --noEmit`: PASS.
- `node --experimental-strip-types --test tests/media.test.mjs`: PASS, 5 tests. Node emits a module-type detection warning; package module settings were not changed.
- `npm run build -- --webpack`: PASS, including TypeScript and static generation. Uses the already-established working bundler path; default Turbopack was not retested in this milestone.
- `git diff --check`: PASS.
- Active app TSX/TS/CSS source: 1,721 physical lines; with the 41-line test file: 1,762. Existing backup and patch archives excluded. No active file exceeds 2,000 lines.

## Browser evidence
Observed on localhost:3002:
- Unsafe SVG containing a script is rejected with a visible error.
- Safe SVG is saved to IndexedDB and rendered in the hero.
- Zoom 400% and horizontal position 0% produce the expected computed transform/background position.
- Refresh preserves both the library upload and framing settings.
- Uploaded MP4 decodes at 320×180 with readyState 4 and no media error.
- Library image reused in Services without reupload; test section attachment removed afterward.
- Poster selection, WebVTT upload and VideoObject metadata verified.
- Default social consent produces zero social iframes before interaction.
- YouTube player loads after consent. Initial error 153 was diagnosed as a missing referrer and fixed by using `strict-origin-when-cross-origin` instead of `no-referrer`.
- X link shows a clear original-post fallback.
- Muted autoplay runs on desktop. At the 390px preset, poster mode displays its poster and the native video is paused.
- Object URL revocation during development remounts initially exposed a player failure; cleanup now clears revoked mappings and failures are associated with the resolved source URL.

HTML ZIP downloaded and inspected: MP4, sanitized SVG poster, VTT captions, metadata and runtime included; no `blob:` URLs or internal `media:` IDs remained. Extracted into `/tmp/builder-media-html-export`, served separately at 127.0.0.1:3004 and opened in the browser: native video decoded (readyState 4), with local poster/caption URLs and no editor shell.

WordPress ZIP downloaded and inspected: media and runtime included; index.php uses `get_template_directory_uri()` references and contains native video/track markup, with no temporary URLs or unresolved placeholders. A WordPress installation was not available, so theme installation is unverified.

The original hero image was restored after testing. Three small, clearly named media fixtures remain in the browser library.

## Behavior and limits
- Supported upload extensions: MP4, WebM, MOV, JPG/JPEG, PNG, WebP, AVIF, SVG. WebVTT captions use their separate upload control and are reusable from the library.
- Images: 10 MB; video: 100 MB; captions: 1 MB; library: 250 MB. Signature/MIME/extension checks reject mismatches. SVG uses a strict supported-element/attribute subset; complex SVGs may require PNG conversion.
- Zoom: 25–400%; horizontal/vertical focal position: 0–100%; cover/contain; five aspect ratios; framing reset.
- Native video: autoplay only when muted, loop, controls, poster, captions and mobile same/poster/hide. Hidden/poster mobile video is paused. Reduced-motion preference suppresses autoplay presentation and pauses playback.
- Social adapters: YouTube, Vimeo, TikTok, Instagram, Facebook video and Dailymotion. Only canonical supported link forms are embedded. X and other unsupported/restricted URLs retain an original-link fallback. Instagram/TikTok/Facebook may block or require login; live provider playback was verified only for YouTube. Provider-specific control behavior is not uniform.
- Uploaded media is packaged; direct HTTPS resources and social embeds remain external references, recorded in the manifest. Missing local uploads block export with a clear error.
- Site settings remain in localStorage; blob files live in IndexedDB with stable IDs. This persists between ordinary sessions in the same browser/origin, not across devices or browsers. Clearing browser data or eviction can remove files. Keep exported packages as backups. Cloud storage/synchronization was not added.

## Security, performance, migration and rollback
Uploads remain local until explicitly exported. No server URL fetcher or arbitrary embed HTML is introduced. Embeds are generated from allowlisted hosts/IDs, sandboxed and consent-gated by default; the referrer policy shares the origin required by providers without the full cross-origin path. SVG scripts, event handlers, foreign content and external references are rejected. Structured metadata escapes less-than characters before script serialization. Unused asset deletion requires confirmation; assets referenced by the current undo history cannot be deleted.

This is targeted validation, not a complete production security audit or malware scanner. File signature tests for MOV/WebM/AVIF/JPG/WebP verify recognition, not full decoding of every codec. MOV playback depends on browser codec support; incompatible media has a visible fallback. Browser persistence is not a tenant-authenticated production media backend.

Performance baseline comparison: not measured. Blob URLs are reused and revoked on deletion/unmount; uploads and total storage are bounded, and native players preload metadata. Large libraries still require memory and disk appropriate to their size.

Existing saved hero fields migrate through a fallback without overwriting content. Rollback should reverse only this milestone's imports, settings/renderer/export changes and new media files, preserving prior uncommitted UI work. Export referenced files before removing the IndexedDB implementation. Next production verification: WordPress staging installation and broader provider/device/codec coverage.
