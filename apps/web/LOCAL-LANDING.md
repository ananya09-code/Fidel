# Local Fidel landing experiment

Branch: `codex/local-editorial-landing`. This experiment has not been pushed or deployed.
Run `pnpm dev` from `apps/web` and visit http://localhost:3000/.
The original `src/components/landing-ui` is retained; `/` uses `landing-experiment/EditorialLanding`.

The supplied editorial brief and ras-et.com guide the composition, while Fidel keeps its green/mint palette. The orange accent returns from the original `landing-ui/Hero.tsx` (`orange-500` / #f97316). It appears on lesson actions, active markers, the greeting deck and textile strokes. Latin uses local Merriweather; Ge’ez uses local Noto Serif Ethiopic. The five licensed photos are sampled into horizontal strokes with individually authored silhouettes. Faces stay monochrome. Light mode combines a subtle grayscale base with darker hatching to preserve facial detail; saturated textile details become a deeper orange with enough contrast on light paper. Dark mode uses pale ink and brighter orange. Strokes reform every five seconds and then rest. Matching word cards and five clickable progress dashes follow the portrait. Pause stops automatic advancement; manual selection still works. Reduced motion removes transitions and automatic changes. On mobile the portrait comes first. The theme toggle previews appearance without saving an account preference.

“Every language, on its own terms” is now a three-card greeting deck in `LanguageDeck.tsx`. It cycles only while in view and pauses on hover, keyboard focus, hidden tabs and reduced motion. A swipe, language button, previous/next button or arrow key makes a manual selection and pauses rotation for reading. Only the front card is exposed to assistive technology; manual choices are announced. Each language has a greeting, pronunciation guide, English/Amharic meaning and a short narrative. Tigrinya is explicitly a preview and links to the map. The two available learning languages link into the existing sign-up/dashboard flow. No audio or course availability is invented.

The atlas shows all twelve regions and both city administrations, without a globe. A dot, region click, keyboard activation or select menu opens a non-modal language popup over the map. Escape and the close button dismiss it and return focus to the selected marker. Outside clicks dismiss it. There is no lower regional-description panel. Regions are multilingual; the language examples are not exhaustive or linguistic boundaries.

Portraits are cultural imagery, not testimonials or claims about a person's language. Photo titles are used for attribution, not inferred identities. Amharic and Afaan Oromoo are the available learning contracts. The Tigrinya row explicitly says lessons are unavailable. No audio playback button is shown for these illustrative words: there are no synthetic or placeholder recordings. The existing learning app still uses its real reviewed audio. Tigrinya example checked against [Harvard ELIAS, lesson 4](https://elias.fas.harvard.edu/index.php/node/195).

## Photograph attribution

The five displayed adaptations retain each source's licence. Sources, creators, licences and adaptation notices also appear under “Photography & map credits” in the footer. Downloads are logged in `apps/assets/credits.json`.

- [Traditional Habesha clothes](https://commons.wikimedia.org/wiki/File:Traditional_Habesha_clothes.jpg), HagosBeyene, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- [Oromo Woman, Ethiopia](https://commons.wikimedia.org/wiki/File:Oromo_Woman,_Ethiopia.jpg), Rod Waddington, [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/).
- [Tigray Woman, Ethiopia](https://commons.wikimedia.org/wiki/File:Tigray_Woman,_Ethiopia.jpg), Rod Waddington, [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/).
- [Ethiopian man portrait](https://commons.wikimedia.org/wiki/File:Ethiopian_man_portrait.jpg), Steve Evans, [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/).
- [Tigray Woman](https://commons.wikimedia.org/wiki/File:Tigray_Woman_(37677440942).jpg), Rod Waddington, [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/).

New portrait sources replace every displayed old photograph. These openly licensed archive images are local test selections; the app does not assert individual model releases. Confirm final image use before a public launch.

Geography: [OCHA/HDX](https://data.humdata.org/dataset/cod-ab-eth), 2025-01-01, CC BY-IGO, via the [GeoJSON mirror](https://github.com/HabtamuTesafaye/ethiopia-geo-boundaries). Simplified SVG paths are for overview display; rebuild with `node scripts/prepare-landing-map.mjs`.

Fonts: Merriweather and Noto Serif Ethiopic, SIL Open Font License, included under `public/landing-lab`. No new package, backend or database change is needed.
