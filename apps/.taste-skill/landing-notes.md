# Fidel local landing experiment

Audience: people beginning an Ethiopian language, including diaspora learners reconnecting with family.
Action: start learning through the existing sign-up route.

Subject inventory: Fidel's Ethiopic letterform; Afaan Oromoo in Latin script; Amharic in Ethiopic script; the existing English/Amharic translations; approved word audio; a five-word daily goal; Oromia's scale; Ethiopia's twelve regions and two city administrations; Harar's multilingual streets; greetings exchanged before a conversation; family connections across a diaspora; a dictionary built around everyday words.

Argument:
- Hero: a word brings people closer. Proof: Ethiopian portrait photography and actual bilingual greetings.
- Atlas: languages belong to places and travel beyond borders. Proof: sourced region geometry, all fourteen administrative units, language descriptions and sample words.
- Practice: a small exchange is a place to start. Proof: an interactive sample using the existing approved-audio API when available.
- Close: take that first word into the learning app. Proof: the existing sign-up flow, no invented user counts or testimonials.

Direction: split-stage, seed 515156785. A stable portrait field gives the language-learning introduction a human presence; the atlas breaks the split so geography has room.
Idea: On this page, Fidel's bilingual greetings become the connection between Ethiopian portraiture and a living atlas.
Live thing: select a region, read languages associated with it, choose a supported sample, and play its approved recording when available. Regions are multilingual, not a one-region/one-language classification.

Copy deck:
- Words bring us closer
- Learn Afaan Oromoo and Amharic, one everyday conversation at a time.
- Start learning
- A country of voices
- Explore Ethiopia's regions and the languages spoken across them.
- Your first exchange
- Begin with a greeting. Listen, then take it into your next conversation.
- Take a word with you
- Short lessons. Familiar words. A little closer every day.

Local-only branch: codex/local-editorial-landing. No deployment or PR for this experiment.

Redraws: hero changed because the original stripe belonged to a café awning and Fidel has no corresponding brand artifact. The about section changed from a founder's letter to wide photo/colour tile because there is no real founder letter to quote. Direction and Archivo face remain as dealt.

Round 1 critique (all seven screenshots opened):
Idea: bilingual greetings connect Ethiopian portraiture to an atlas.
Live thing: select region, change learning language, request a reviewed pronunciation.
Layout words: hero=split / atlas=geographic stage / practice=photo mosaic / close=photo and colour field / footer=plain line.
Scores: design 7.8 / usability 8 / creativity 7.8 / content 7.8; provisional overall 7.86, capped at 6 due to two inspector failures.
Top three problems: word-card language labels read like eyebrows (desktop/mobile folds); too many secondary text blocks at 14px made the measured body size 14px (all widths); map attribution paragraph was too wide (desktop sheet 1). Fixes: place words first in word cards, increase secondary size to 16px, cap attribution at 66ch.

Final reference-driven critique (all six production screenshots opened):
The user replaced the earlier art direction with supplied particle-portrait screenshots and ras-et.com. Ras was inspected visually: Merriweather, textured portrait artwork, rounded navigation. The implementation uses those principles in Fidel's green/mint palette, with locally generated point engravings of attributed photographs. No Ras artwork or source code was copied.
Idea: Ethiopian portraiture dissolves into the words that connect people and places.
Live thing: globe/region view switch, keyboard and select-menu region exploration, supported sample-language switch, approved-audio request.
Layouts: hero=serif/point-portrait split; atlas=map and regional detail; practice=plain three-column explanation; close=photo and colour field; footer=source credits.
Scores: design 7.5 / usability 8 / creativity 7.5 / content 7.7 → weighted overall 7.67.
Direction deviations: user-requested rounded navigation and Merriweather supersede square controls and Archivo. The point-art hero replaces the four-photo floor; source attribution is retained for every adapted portrait. No stock video was inserted because the requested moving portrait itself carries the visual idea.
Production gate: 0 FAIL at 1440, 768 and 390, with font and photo-count allowances for these explicit user requests. Four warnings remain: pill navigation (requested), broad size scale, no video (point animation instead), and a long paragraph measure in secondary copy.
Top remaining refinements: the point portrait retains a photographic crop rather than the supplied bust silhouette (desktop/mobile fold); tablet hero has a generous upper breathing space (tablet fold); typography could use fewer intermediate sizes (all page sheets). These are visual refinements, not hidden functionality claims.
Validation: typecheck, ESLint and production build pass; 15 frontend tests pass. In-browser checks exercised both themes, map selection through pointer/keyboard and the region select on phone. Actual playback depends on the configured backend and approved audio availability. No backend, database, deployment or remote-branch mutations were made for this experiment.

Map/animation follow-up: removed the globe and unused globe geometry. Added fourteen language markers, keyboard-selectable regional shapes, a clickable guide and an open-book Fidel wordmark. Particles now interpolate individually from the previous portrait to the next with a 2.3-second assembly and visible wave motion. Still images are restricted to the no-JavaScript fallback so they cannot flash before the canvas is ready. Pause and reduced-motion behaviour remain supported. Language colours are consistent for repeated language names; colours are reused decoratively and names provide the identifying information.
Follow-up screenshots: all seven map-update screenshots opened, inspector reported 0 FAIL with the previously documented reference allowances. Remaining visual refinements: compact the long language guide on small screens, reduce intermediate type sizes and shorten secondary attribution. Updated subjective score: design 7.5 / usability 7.8 / creativity 7.8 / content 7.7 = 7.67. Source photography and map credits are unchanged.

## Engraving and popup revision — 2026-11-04

Reference overrides: keep Fidel green/mint; use the supplied pill navigation, serif editorial type, thin column/row rules, and motion only inside the portrait. The original Split stage direction (seed 515156785, two earlier redraws) remains the composition reference. No new random direction was drawn for this component revision.

ROUND 1
Seen in one second: a language product with a recognisable Ethiopian portrait and one clear action.
Idea (one sentence): living languages appear through engraved people and an explorable country.
Live thing: language dots open regional popups directly on the Ethiopia map.
Layout words by section: hero=split editorial / atlas=interactive map / practice=text columns / languages=script rows / close=green field / footer=woven close.
Scores: design 7.2 · usability 7.0 · creativity 7.5 · content 7.5 → overall 7.2
Caps applied: small-text/body-size failures; user-requested thin rules and canvas photography explicitly override house defaults.
Top three problems (most visible first), each with the screenshot it shows in and the fix:
1. Small captions and footer notes, desktop/mobile pages: enlarge readable text to 14–16px.
2. Photo credit crowds the phone headline, mobile-fold: remove it from the portrait stage; retain complete footer credits.
3. Labels on the small phone map are illegible, mobile-page-01: keep dots and the labelled selector; show languages in readable popups.

ROUND 2
Seen in one second: Fidel teaches Ethiopian languages; the first lesson is the action.
Idea (one sentence): living languages appear through engraved people and an explorable country.
Live thing: map marker, region click and keyboard/select interactions open non-modal language popups, without a lower description panel.
Layout words by section: hero=split editorial / atlas=interactive map / practice=text columns / languages=script rows / close=green field / footer=woven close.
Scores: design 7.6 · usability 8.0 · creativity 7.5 · content 7.8 → overall 7.7 (self-review, not an external rating)
Caps applied: user reference overrides for serif/pill navigation/rules/portrait-only motion; photography is sampled into canvas, not counted as img by the meter.
Top three problems (most visible first), each with the screenshot it shows in and the fix:
1. Tablet hero is quieter with a smaller portrait than desktop (tablet-fold); retained full-height editorial composition, no clipping.
2. Engraving loses some photographic expression, especially at phone width (mobile-fold); the five real source images remain replaceable and credited.
3. Script headings and the larger letterforms need more sizes than the house default (all pages); retained deliberate hierarchy and accessible 16px body copy.

Final production inspection: 1440/768/390, zero FAIL, four WARN. Every final fold/page screenshot opened and reviewed. Warnings defended: pill-nav is explicitly requested; size-count reflects script headings/word UI/body; no-footage because the requested moving picture is a live canvas engraving; off-centre is a 20px optical difference caused by max-width content/scrollbar sampling, with equal CSS page gutters and no horizontal overflow at any width.

Verified interactions: direct Oromia marker click opens Oromia (not Sidama); Escape removes the popup and restores marker focus; mobile selector opens a 250px popup within a 390px viewport; five portrait controls change words; light/dark preview redraws the engraving. Reduced-motion behaviour checked in code: immediate final strokes and no automatic advancement. No API persistence touched.

Validation: pnpm typecheck, lint and build passed; atlas coverage test passed; skill source lint passed. Backend pytest launch was blocked by Windows Application Control after uv cache permissions were cleared; no backend/database edits or migration operations occurred. No dependency installation, push, deployment or commit.

Photo sources, authors, individual licences and adaptation notes: web/LOCAL-LANDING.md and the page's Photography & map credits. New sources are real downloaded archive photography; no AI-generated portrait or invented ethnic identity.

## Orange and greeting-deck refinement — 2026-11-04

Keep the existing Split stage composition (seed 515156785); no redraw for this component revision. User overrides now explicitly include a playful rotating language-card deck. Orange is taken from the original landing-ui/Hero.tsx orange-500 accent, #f97316, while forest/mint stay the ground and ink. No new photographs, font downloads or dependencies.

ROUND 1
Seen in one second: an Ethiopian language product with a warm orange action and a clearer portrait.
Idea (one sentence): a shared greeting becomes a small deck of language postcards.
Live thing: choose, swipe or use arrow keys to bring a greeting forward and read its language's story.
Layout words by section: hero=split engraving / atlas=map / practice=text columns / languages=postcard deck and narrative / close=green field / footer=orange woven strip.
Scores: design 7.5 · usability 7.6 · creativity 7.7 · content 7.8 → overall 7.6
Caps applied: first inspection flagged covered text on the back cards; the experimental 320px inspection used an unrealistic 200px viewport height, so narrow phones were separately checked at 320×740 in the browser.
Top three problems (most visible first), each with the screenshot it shows in and the fix:
1. Light portrait was still too pale and lost facial midtones (browser light hero): add a subtle grayscale photographic base, stronger ink hatching, and a closer first portrait crop.
2. Multiple card headings peeked under the front card (desktop/mobile pages): render readable content only on the front; keep the two real card backs as colour and weave.
3. Back cards reached too close to phone edges (mobile browser): reduce their offset/rotation and use a smaller 320px card width; verify no text clipping.

ROUND 2
Seen in one second: Fidel teaches Ethiopian languages, with orange lesson actions and expressive engraved faces.
Idea (one sentence): a shared greeting becomes a small deck of language postcards.
Live thing: swiping Afaan Oromoo advances to Tigrinya; language buttons and left/right keys also select and wrap; deliberate selection pauses rotation.
Layout words by section: hero=split engraving / atlas=map / practice=text columns / languages=postcard deck and narrative / close=green field / footer=orange woven strip.
Scores: design 7.8 · usability 8.1 · creativity 7.8 · content 7.8 → overall 7.9 (self-review only)
Caps applied: explicit reference overrides for pill navigation, serif type and quiet rules; canvas represents the same five licensed photo sources, not absent imagery.
Top three problems (most visible first), each with the screenshot it shows in and the fix:
1. Tablet hero still has a quieter upper field (tablet-fold); retained the existing full-height composition for this focused change.
2. Photo detail is deliberately engraved rather than photographic (fold screenshots); light mode now has a tonal base, while both modes keep ink/orange hatching.
3. Three languages have different availability (language deck): Tigrinya remains clearly labelled as a preview, with a map link instead of a lesson promise.

Final production inspector: 0 FAIL / 4 WARN at 1440×900, 768×1024, 390×844; all seven final screenshots opened. No horizontal overflow. Warnings defended: pill nav is requested; font sizes serve script/word cards and 16px body copy; live canvas replaces footage; optical text margins differ by 20px but CSS outer gutters are equal.
Narrow-phone browser check at 320×740: page scroll width 305px within the 320px viewport; front card clientHeight and scrollHeight both 370px (no clipped content). Viewport override reset afterwards.
Interaction checks: physical drag/swipe changes the active language; Tigrinya selection updates its availability narrative and map CTA; ArrowRight wraps from Tigrinya to Amharic; only the active card is in the accessibility tree. Reduced-motion code disables automatic advancement and CSS travel. Pause/hover/focus/hidden-tab guards stop unwanted cycling. No invented recordings.
Final pnpm typecheck, lint and production build pass. Skill source lint passes. No backend or database files touched; no migration, dependency change, push, commit or deployment.
Sources and adaptation licences remain in web/LOCAL-LANDING.md and the page footer. The same photographs are now adapted in monochrome/orange, with a tighter crop for the first portrait.
