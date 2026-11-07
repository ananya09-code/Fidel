# Fidel home redesign — local only

Direction: Editorial greeting, seed 1302691040. Kept brand palette and Manrope. No redraws. Home presentation is separate from authenticated queries; no API, migration, auth or saved-data contracts changed.

Screen question: What should I learn today, and how close am I to my word goal?
Face: Fidel’s pale green ground, the selected learning language, and an Afaan Oromoo / Amharic greeting.
Signature: daily word target beside real vocabulary totals, followed by a native-script word with English and Amharic translations and its existing audio action.

Inventory: chosen language; daily word target; words learned today; vocabulary learned; completed lessons; current streak in days; resumable lesson and card index; words needing review; approved word audio and translations; real backend topic counts; saved lesson/review activity. No new data tables or invented application metrics.

Structure: a four-part summary, an 8/4 lesson/word row, and a 6/6 topic/activity row on one 12-column grid. Tablet navigation folds to bottom tabs; phone sections stack. Existing typography, React/TanStack and API hooks are preserved. No photos added. The existing Fidel mark is retained.

## Checks and limits

Frontend typecheck, lint and production build passed. Final production-built isolated component previews inspected at 1440, 768 and 390 in light and dark: 0 FAIL. This is a component fixture, not a signed-in production end-to-end check. The actual local Home also loaded real saved dashboard, topic and word data from the supplied Render API. Frontend URL override is process-only; no env file was changed.

The before inspector reached the Clerk sign-in screen in its separate browser, so its measurements cannot serve as a numeric before/after dashboard comparison. The previous home was reviewed from its source; no baseline performance improvement is claimed.

Allowance: covered-text only. The existing fixed bottom navigation naturally occludes scrolling text as it passes behind the bar; document bottom padding lets every final row scroll clear. No content is permanently covered.

Warnings: external Manrope font is declared but not loaded in the isolated inspector browser (existing Google Fonts import); sparse recent activity can leave space in the matched desktop panel. The latter preserves equal row edges without inventing history. Real-data Home currently has three history entries; the fixture deliberately tests only two.

Interaction checks: More topics expands from four to seven, Show fewer restores four; original category filter keys stay unchanged while labels replace underscores. Review, lesson, dictionary and profile destinations remain typed links. Empty/new-account and error states were visually checked on a phone. Audio wiring is preserved and its real recording URL loaded, but playback was not verified: the browser page changed before the click completed. No lesson or review submission was performed.

The local-only fixture lives in .taste-skill/home-fixture and uses explicit sample data: 0/5 daily words, 12 learned words, one completed lesson, zero-day streak, nine words to review, a sample Body session at 3/10 cards, two history rows, seven topic counts generated for visual coverage, and Akkam with unavailable fixture audio. This fixture is not imported by the application and must not be deployed.

## Final visual critique

1. The daily goal is the leading figure and the next lesson is the dominant action panel. Yes.
2. One outer frame, shared grid edges and consistent gutters. Tablet cramped columns were corrected by folding navigation. Short history retains extra room rather than false entries.
3. Pale green identity is on the ground; orange is reserved for actual word-goal progress, not decorative icons. Yes; a true zero has no orange stub.
4. All application counts are read from one authenticated dashboard response; lesson progress is bounded to its total. No duplicate stats or invented deltas.
5. Zeros remain zeros; absent current lesson offers the actual learning path. Yes.
6. No chart legend needed: labelled progress bars show goal and session totals directly. The word card balances native, English and Amharic text.
7. Phone navigation is bottom tabs and content is stacked; labels and action targets remain usable. Yes.

Self-review: clarity 8/10, product identity 8/10, density 8/10, responsive layout 8/10. Remaining limitations: the inherited external font request and sparse desktop history spacing; no full end-to-end persistence test was required for this presentation-only change.

Backend regression suite: 174 passed, 4 existing deprecation warnings. git diff --check passed. No packages were installed.

## Teacher refinement
Continued Editorial greeting (seed 1302691040), no redraw. Recreated the supplied seated-teacher/whisk/open-book concept as a reusable native SVG component, FidelTeacherMark.tsx, not a generated bitmap. Replaced app sidebar/header logo; public landing unchanged. Restrained warm orange/gold on book, daily-goal marker and recall underline. The subject-specific live detail is Try to recall: hide/reveal both translations, no saved review result or new endpoint. Mouse and Enter-key reveal verified. Final production component fixture: 0 FAIL at 1440/768/390; existing external Manrope warning only. Typecheck, lint and production app build passed. All six final light screenshots opened. Previous fixed-bottom-navigation allowance retained. Self-critique: identity improves to 8.5/10, readability and grid remain 8/10; teacher mark reads at sidebar and word-card scale without a filled badge or motion loop. Supplied user artwork is the sole visual reference; no stock imagery or sample data added to the app.
