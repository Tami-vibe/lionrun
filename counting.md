The 4,399 figure is a newline count of every .ts, .tsx, and .css file under src/app. It is not a git commit, and it does not include tests. Under that same rule the last commit, 3ca184f, is already 2,936 lines. The working tree has no per-task commits, so the reported +112 cannot be split into additions and deletions from git.

1. Counting
The command that produced 4,399 was a walk of src/app, counting b'\n' in files ending in .ts, .tsx, or .css, and skipping directories named .next or node_modules. Tests were counted the same way under tests for .mjs and reported separately.

Recounted just now with that rule:

Revision	Application	TypeScript	CSS	Files	Tests
3ca184f (HEAD, committed)
2,936
1,831
1,105
36
1,177
Working tree
4,399
3,007
1,392
45
1,346
Every current application file ends with a newline, so this matches wc -l on those 45 files. The 4,287 “before” number from the collection session is not in git. It was an uncommitted tree, so it cannot be recounted.

Current per-file counts:

Lines	File
927
src/app/studio.css
407
src/app/site/site.css
385
src/app/editor/fields.tsx
362
src/app/site/blocks.ts
231
src/app/page.tsx
201
src/app/editor/hero-media.tsx
153
src/app/editor/preview-frame.tsx
118
src/app/editor/workspace.ts
104
src/app/editor/settings.ts
101
src/app/media/library.tsx
96
src/app/editor/shell.tsx
95
src/app/editor/destination.ts
83
src/app/editor/navigation.tsx
78
src/app/editor/section-editor.tsx
72
src/app/editor/columns.tsx
63
src/app/export/package.ts
60
src/app/media/model.ts
59
src/app/editor/scope.ts
56
src/app/site/reviews.ts
55
src/app/media/store.ts
55
src/app/site/sections/reviews.tsx
54
src/app/export/zip.ts
48
src/app/editor/account.tsx
44
src/app/media/media.css
43
src/app/editor/history.ts
41
src/app/site/preview.tsx
40
src/app/site/icons.tsx
37
src/app/media/export.ts
37
src/app/editor/inspector.tsx
30
src/app/site/sections/hero.tsx
22
src/app/editor/hero-collection.ts
22
src/app/site/sections/services.tsx
21
src/app/site/catalog.ts
19
src/app/site/sections/proof.tsx
18
src/app/editor/rating.ts
18
src/app/site/sections/elements.tsx
14
src/app/globals.css
13
src/app/site/safe-href.ts
12
src/app/site/sections/gallery.tsx
11
src/app/site/sections/index.tsx
10
src/app/layout.tsx
10
src/app/site/sections/menu.tsx
8
src/app/site/contact-hours.ts
4
src/app/editor/section-badge.tsx
62
src/app/site/sections/content.tsx
Tests: quality-gate.test.mjs 314, foundation.test.mjs 259, separation.test.mjs 162, playback.test.mjs 179, editor-shell.test.mjs 135, migration.test.mjs 122, media.test.mjs 58, editor.test.mjs 50, workspace.test.mjs 37, blocks.test.mjs 22, plus 8 lines in tests/support.

2. History
These are the only commits. Deltas are TypeScript (.ts/.tsx) and CSS under src/app, same newline rule. The button, trust, rating, and collection editor work is uncommitted on top of 3ca184f, so it has no commit IDs.

Commit	App lines	TS delta	CSS delta	What changed
1de1907
124
—
—
Create Next App
ee65eb6
124
0
0
Governance docs only
24c87b7
2,963
+1,546
+1,293
Full builder checkpoint. This is where the src/app total crossed 2,000, jumping from 124 to 2,963 with no commit in between.
568e8b0
2,988
+25
0
Failed-load retention; optional contact hours
624462b
3,014
+26
0
Keep saved images and edited pain copy
73878df
3,088
+74
0
Split history, persistence, preview, and export
72d7af0
3,101
+13
0
Trust Signals copy; reject credential URLs
d62e2a5
3,121
+20
0
Keep authored content on layout change
175ca70
2,900
0
−221
Remove obsolete styles. Largest file falls from 867 to 647 (studio.css).
c8ef6a5
2,900
0
0
Regression tests only
3ca184f
2,936
+29
+7
Per-video playback controls
Working tree
4,399
+1,176
+287
Uncommitted editor shell, buttons, trust, rating, and the hero collection
The historical reports used a smaller file list (page.tsx, layout.tsx, globals.css, studio.css, src/app/media/*, src/app/editor/*, tests/media.test.mjs). That subset is 1,758 at 3ca184f and 3,153 in the working tree. It stayed under 2,000 through the last commit and crossed 2,000 only in uncommitted work.

3. Latest change
git diff HEAD cannot isolate the reported +112. That number is 4,399 − 4,287, and 4,287 was never committed. Against 3ca184f, the whole working tree is +1,094 / −393 in tracked src/app files, plus 762 lines in untracked application files, which reconciles to 4,399.

Tracked application diff versus 3ca184f:

Path	Added	Deleted
src/app/editor/fields.tsx
375
72
src/app/studio.css
302
22
src/app/page.tsx
214
175
src/app/editor/navigation.tsx
62
69
src/app/editor/account.tsx
32
7
src/app/media/library.tsx
22
6
src/app/site/sections/hero.tsx
17
6
src/app/site/blocks.ts
14
4
src/app/editor/history.ts
14
4
src/app/site/sections/elements.tsx
12
10
src/app/site/preview.tsx
11
10
src/app/editor/inspector.tsx
5
2
src/app/site/site.css
5
1
src/app/media/media.css
4
1
src/app/export/package.ts
2
2
src/app/editor/workspace.ts
2
2
src/app/media/export.ts
1
0
Untracked, so entirely additions: hero-media.tsx 201, preview-frame.tsx 153, shell.tsx 96, destination.ts 95, section-editor.tsx 78, scope.ts 59, icons.tsx 40, hero-collection.ts 22, rating.ts 18.

HeroMediaEditor did not exist at 3ca184f. The filmstrip form and the collection form were both uncommitted, and the filmstrip file was overwritten, so its line delta is not measurable. What remains in the tree is the collection component.

4. Replacement
Removed from the current tree, and absent from 3ca184f as well: media-film, media-thumb, media-stage, media-focal, media-add, and the handlers extraLimit, choose, applyLink, and videoLink. No studio.css rule still selects them.

Still present, because something else uses them:

Symbol	Where	Why it remains
publishAsset
library.tsx
Hero upload calls it. MediaPicker and MediaManager do too.
MediaPicker
hero-media.tsx poster button
Poster selection still opens the library. The collection itself does not.
mediaURL
model.ts
Address safety. directMediaLink adds the file-extension check on top.
choice-group
fields.tsx Choice, navigation.tsx
Other editors. Overlay no longer uses it.
MediaView
Canvas, tiles, manager
Shared renderer.
.studio-editor rules
studio.css lines 2–98 and 565–639
page.tsx still puts studio-editor on the shell. #premium-studio was appended at line 640 and overrides layout rather than deleting the old rules.
5. Duplication
Logic	Locations	Can it share what exists?
Upload
publishAsset is the one writer. HeroMediaEditor.addFiles, MediaPicker, and MediaManager.upload each have their own file input and progress text.
The bytes and limits already go through validateUpload. The three inputs are separate UI, not three validators.
URL check
mediaURL accepts any HTTPS URL. directMediaLink in hero-collection.ts rejects a page that is not .jpg, .png, .webp, .mp4, .webm, or the other allowed extensions. MediaManager only checks mediaURL.
Hero should keep the stricter check. Pointing MediaManager at directMediaLink would change that screen.
Selection
heroSlides derives the list. slideIndex is also stored. HeroMediaEditor copies it into index and seen. HeroSection copies it into chosen and seen.
One stored index is enough for the published slide. The local copies exist so arrow clicks do not write a save.
Slideshow
HeroSection useEffect and slideshowRuntime in media/export.ts both advance slides, pause hidden videos, and honor reduced motion.
Export HTML has no React, so the script has to stay. They are two implementations of one behavior.
Overlay
heroShade in hero.tsx is the renderer. The editor writes darkness, fade, fadeWidth, and background. Style controls in section-editor.tsx also write darkness.
Same fields, two editors. Sharing the preset buttons is possible. Sharing the shade function is already done.
Persistence
writeItems writes media, slides, and slideIndex through onChange. The removal toast also keeps a full copy in removed. History already keeps the previous content.
The toast can call the existing undo. It does not need a second copy of the slides.
6. CSS growth
studio.css is 647 lines at 3ca184f and 927 now (+302 / −22). #premium-studio occurs on 256 lines and did not exist at HEAD. .studio-editor still occurs on 57 lines. Line 2 sets .studio-editor { display:grid ... }. Line 639 sets .studio-editor { display:flex ... } without deleting the grid rules above it.

Exact duplicate selectors inside studio.css: 111. Most are grouped heading and body selectors repeated for responsive blocks, not accidental copies. Real overrides:

.studio-editor at lines 2 and 639
.studio-editor .workspace-toolbar at 9 and 566
#premium-studio .workspace-toolbar at 642, 719, and 859
#premium-studio .panel .hero-tile-remove at 820 (20px) and 854 (32px inside the coarse-pointer query)
.choice-group at line 89 (10px type, under .studio-editor) and lines 694–695 (under #premium-studio)
studio.css and site.css share 9 selectors exactly, out of 644 and 379. They are not two copies of one stylesheet. Both are imported from layout.tsx.

The collection rules (hero-drop, hero-tile, overlay-tiles, editor-fold, switch-row) replaced the filmstrip rules in the working file. They were appended relative to HEAD, because HEAD had neither set.

7. State
Hero items are stored once: content.media plus content.slides. heroSlides drops empty src values and does not store that list.

Duplicated or derived state:

slideIndex is persisted, then mirrored by index/seen in HeroMediaEditor and chosen/seen in HeroSection. The render-time if (stored !== seen) blocks are synchronization, not a second collection.
removed holds another full copy so the toast can undo without using history.
names is derived from the library on each render. That one is not stored.
slideIndex is also how selection reaches the canvas. Removing it would stop the canvas from following the selected thumbnail unless arrow clicks and editor clicks share another channel.

8. Rendering
Canvas and Live Preview both render SitePreview, which uses sectionComponents.hero → HeroSection. The editor puts that preview in an iframe through PreviewFrame. Live Preview is the same component on /?preview=1. They share the React slideshow effect, heroShade, and MediaView.

Export does not run React. prepareMediaExport clones the preview DOM, and package.ts appends slideshowRuntime. That script reads data-slide-autoplay, data-slide-seconds, data-slide-advance, and data-slide-step. It repeats the advance, pause, and reduced-motion behavior because the exported page cannot run the effect.

At 3ca184f, HeroSection added content.slides only for the image and story layouts. The working tree adds them for every layout, so a split hero can show the collection. That difference is uncommitted.

9. Scope
Addition	Class	Requirement
Drop zone, upload, add link, two-column grid, badges, filenames, blue selection
Requested redesign
Collection spec
directMediaLink, progress, and error text
Requested new behavior
Reject a webpage; show progress and errors
X, nearest selection, order preserved, library file kept
Requested new behavior
Removal spec
Toast plus removed snapshot
Requested, with extra state
“Provide Undo”
Move buttons and Alt+Arrow
Requested
Keyboard reorder
slideAutoplay, slideSeconds, slideAdvance, slideFade, slideTiming
Requested new behavior
Persist slideshow settings and drop the “not stored” copy
slideshowRuntime
Requested integration
Export must advance slides
slideIndex and the two sync blocks
Requested integration
Selection must update the canvas
Slides visible on every layout
Unrequested expansion
Not in the schema change; done so selection is visible outside image and story
SLIDES = 5
Inconsistent with the earlier editor cap
Matches slides.length > 4, not the three-slide image editor
MediaPicker for posters
Kept compatibility
Video poster was already a control
Improve text readability
Kept from the previous form
Not in the collection picture
10. Five slides versus three
The schema has allowed five items since 24c87b7: validBlocks rejects c.slides.length > 4, which is one media plus four slides. The same check is at 3ca184f in blocks.ts and at line 357 now. Nothing in a commit set an editor cap of three.

The three-slide cap lived only in the overwritten, uncommitted filmstrip editor (extraLimit: story 4 extra, image 2 extra, other layouts 0). HeroMediaEditor now uses SLIDES = 5 at hero-media.tsx line 11. The renderer no longer limits extra slides to image and story. slideTiming allows slideIndex below 8, which is wider than either cap.

11. Budget
No committed document sets a current numerical cap. docs/tech-lead/03_PERFORMANCE_BUDGETS.md at 3ca184f has no source-size section.

The 2,000 figure appears in milestone reports:

TASK006_UI_REPORT.md, TASK007_MEDIA_REPORT.md, and TASK009_EDITOR_UX_REPORT.md say no active file exceeds 2,000. The largest file now is studio.css at 927, so that per-file statement still holds.
TASK008_UI_UX_DESIGN_PLAN.md at 3ca184f says: “Keep the existing 2,000-line constraint explicit. Current active app baseline is approximately 1,721 physical lines, leaving only about 279 if the limit is aggregate.”
The working-tree edit to that line, and the new “Source size” section in 03_PERFORMANCE_BUDGETS.md, say the aggregate is obsolete and name no replacement number. Those edits are uncommitted. No commit approves a new numerical cap.

12. Reduction plan
Safe cleanup will not reach 2,000. 3ca184f is 2,936 before any of the uncommitted editor work. Minifying or deleting tests is excluded.

Safe, small, behavior kept

Point the removal toast at historyReducer undo and delete the removed copy. About 10–15 lines in hero-media.tsx. Verify X, Undo, order, and that another section’s src is unchanged.
After a visual check, delete .studio-editor declarations that #premium-studio fully overrides, such as the 10px .choice-group button rule at studio.css line 90. Likely under 20 lines. Verify buttons, navigation, and the 300px panel.
Needs a design decision, not a silent deletion

Keep slideIndex or keep local chosen. Removing either breaks canvas arrows or selection. Savings are under 15 lines and the behavior changes.
slideshowRuntime cannot be deleted while export is static HTML. Sharing one function would still leave a script string.
The three upload inputs can share publishAsset, which they already do. Merging the inputs would remove the media manager or the poster picker.
Feature removal, which is what 2,000 would require

Getting from 4,399 to 2,000 means deleting about 2,400 lines. Reverting the uncommitted tree still leaves 2,936. The rest would have to come out of the builder committed in 24c87b7: site.css (407), most of studio.css, blocks.ts (362), and section components. That removes site rendering, validation, or the editor shell. No measured deletion path keeps the current hero collection, canvas, Live Preview, export slideshow, and the committed site.