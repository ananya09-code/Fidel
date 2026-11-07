# Learn redesign
Style: Editorial greeting, seed 1038279508. Brand palette/type kept, no redraw.
Question: which lesson should I do next? Face: teacher mark and logo gold #eda334.
Signature: winding lesson-status trail. Existing authenticated preferences/progress and public path queries preserved; no backend, dependency or database changes.
Pure LearningPathView enables isolated labelled sample-data fixtures; application route has no mock data. Removed hardcoded LearnOverview from route. Totals intersect completed keys with selected path; resume only uses attempts on it.
Checks: TypeScript noEmit, whole-web ESLint, production Vite build passed. pnpm wrapper failed offline registry signature verification, so installed local binaries were used directly.
Production fixture: zero inspector failures at1440/768/390, light/dark. All twelve final screenshots opened. Allowed icon-chips for semantic lesson-state nodes; covered-text for existing fixed bottom navigation with scroll clearance. Desktop whitespace warning accepted for readable sparse path list; dark icon-tiles warning represents the same status nodes.
Mouse expansion and Enter collapse verified. Live localhost redirects to Clerk sign-in: no authenticated lesson submission performed.
Critique: next lesson leads; equal margins; gold restricted to progress/current/action/book; totals derive from path data; real zero preserved; no redundant chart; mobile uses tabs and large actions. Desktop density remains sparse.
Self-review clarity8, identity8, density7, responsive8 out of10. No photos/new assets or invented application statistics.
Local only, not pushed or deployed.
