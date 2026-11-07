# Dictionary local redesign
Continues Editorial greeting (seed1038279508) from Home/Learn. No redraw, palette/type kept.
Question: find a word, understand it, then save or practise it.
Real data inventory: text, category, difficulty, optional transliteration, English/Amharic translations, context notes, approved audio URL, favorites and learning states, backend pagination totals. Existing hooks and API contracts preserved.
Layout:1164px centered frame, readable rows and a300px recall rail; mobile prioritizes search/list and moves recall below. Teacher mark and small golden accents give Fidel identity. No stock icon tiles, gradients, decorative badges or fake counts.
Meaningful interaction: Try to recall/Reveal meaning hides both translations on the featured word. Temporary recall state never records a review result.
Six frontend files only: DictionaryOverview, DictionaryHeader, DictionaryFilters, VocabularyList, FeaturedWord and dictionary.css. No backend/schema/dependencies.
Fixes: search controls remain mounted while results reload; retry includes preferences; audio failures visible and old playback pauses; category labels readable while raw values preserved; favorites count explicitly refers to loaded words, Load more remains reachable even with zero visible favorites; busy mutations block concurrent row edits.
Checks: TypeScript noEmit, full web ESLint, production build passed using installed binaries. Production component fixture inspected1440/768/390 light/dark:0FAIL0WARN, fixed bottom navigation allowance only. All12final screenshots opened.
Isolated interactions passed: expansion/full meanings/context, learned/review/practice callbacks, favorite filter, zero-visible-favorite pagination, actual category keys, search/clear, recall/reveal; no runtime errors or horizontal overflow. Fixtures use labelled sample words/local callbacks only. Did not verify live persistence or native audio against account data.
Before visual comparison unavailable without live Clerk sign-in; original source reviewed. No invented before/after score.
Critique: primary lookup job first; grid edges aligned; sparse gold; counts from shown data; missing audio/translations explicit; no chart/vanity stats;44px controls and bottom-nav clearance. Self-review clarity8.5 identity8 density8 responsive8.5/10. Remaining product constraint: favorites filter searches loaded pages, explicitly labelled and pageable.
Local app /dictionary; isolated preview127.0.0.1:4182. Nothing pushed or deployed.
