# Fidel agent handoff

Read this before changing the project. This is a guide to the current code, not a substitute for reading the files affected by your task. Verify Git status, the branch, and the relevant implementation before acting. Do not treat older audit notes or prior chat plans as current facts.

## Product and repository

Fidel teaches Ethiopian languages through lessons, vocabulary, practice, reviews, and audio. The frontend and backend are separate applications connected by HTTP.

- `apps/web`: React, TypeScript, TanStack Start/Router/Query, Tailwind CSS, shadcn/ui, Clerk. Routes live in `apps/web/src/routes`; API clients and Zod response schemas live in `apps/web/src/lib/api` and use `apps/web/src/lib/api.ts`.
- `apps/api`: FastAPI, SQLAlchemy with established raw SQL, PostgreSQL on Neon, Alembic, Clerk token verification, and an admin audio review pipeline. Routers live in `apps/api/app/api/v1/endpoints`; the router composition is in `apps/api/app/api/v1/__init__.py`.
- `apps/api/alembic/versions`: sequential revisions `0001_baseline` through `0007_reviews`. The baseline now defines the original vocabulary and audio schema; do not repeat the old claim that it is a no-op.
- Root `package.json` runs frontend commands through pnpm. Python dependencies are managed by uv in `apps/api/pyproject.toml` and `apps/api/uv.lock`.

## What exists now

- Public landing page, Clerk sign-in/sign-up, onboarding, and authenticated app routes for Home, Learn, lessons, dictionary, reviews, test, profile, and settings. Admin audio review has its own route and authorization.
- Onboarding preferences and settings are persisted through `/api/v1/preferences`. The daily goal is **words per day**, never minutes. The theme preference applies across landing, authentication, and app screens.
- Learning paths, lesson attempts, answers, and completion use `/api/v1/learning` and `/api/v1/progress`. Lessons should complete only after all required category words have been finished.
- Vocabulary state and review sessions are persisted through `/api/v1/vocabulary` and `/api/v1/reviews`. Review/test scheduling uses saved results. Practice includes multiple-choice and matching rounds; a matching mistake must remain recorded even if the learner later finds the pair.
- Home/dashboard data and study activity use `/api/v1/dashboard`; words and topics use the public word/learning API. Approved audio is served through the existing audio workflow.
- The teacher logo is `apps/web/src/components/common-ui/FidelTeacherMark.tsx`. The main app palette is deep green/ink with restrained warm gold-orange. Light and dark modes both matter.

These are code paths, not a claim that every production environment is healthy. Inspect the endpoint, client, migration, and tests for the feature you touch. Never replace a real API flow with plausible mock statistics.

## Authentication and data safety

- User endpoints verify a Clerk session token through `apps/api/app/core/clerk_auth.py`. The backend maps the verified Clerk `sub` to `users.clerk_id`. Scope every user-specific read and write by that authenticated identity and test cross-user isolation.
- Admin audio endpoints use a separate `X-Admin-Key` mechanism. Do not expose or reuse that credential for learner endpoints.
- Keep secrets in server environment variables. `VITE_*` values are public browser configuration; never put database URLs, Clerk secret keys, S3 credentials, or admin keys in the web app, source, tests, logs, screenshots, or reports.
- Never run migration-changing commands against Neon just to make a local feature work. Before a schema change, read all revision dependencies, check the target database revision and schema safely, write a reviewed migration, and test it on an isolated database. Do not stamp, reset, drop, or overwrite user data.
- Preserve the audio pipeline's partial unique indexes and its approve/reject state rules. Avoid restarting a backend with in-process audio batches running.

## Implementation conventions

- Use pnpm for JavaScript/TypeScript and uv for Python. Do not add npm/yarn lockfiles or `requirements.txt`.
- Frontend requests go through `apps/web/src/lib/api.ts` and typed Zod clients. Use TanStack Query for server state; invalidate the relevant keys after writes. Never hardcode API origins in components or put saved progress only in local state.
- Use the existing FastAPI router, Pydantic schema, SQLAlchemy session, and raw SQL patterns for nearby backend features. Bind SQL parameters. Keep the frontend and backend decoupled through the HTTP contract.
- TanStack file routes are typed. When adding a route, regenerate the route tree with `pnpm generate-routes` and verify links typecheck.
- Keep English meaning alongside Amharic where word translations appear, as established in the learner UI. Preserve real audio behavior and offer a clear state when no approved recording exists.
- Match the current visual language: calm, clean layouts; limited gold-orange; no gratuitous gradients, floating badges, confetti, or fake numbers. Check mobile spacing, keyboard use, visible focus, contrast, dark mode, loading/error/empty states, and `prefers-reduced-motion`. The mobile app uses bottom navigation.
- For practice feedback, encourage mistakes without shaming; do not claim success until a save succeeds. Motion must not block the next action or cover content on mobile.
- Respect unrelated uncommitted work. Keep changes scoped to the requested feature and avoid opportunistic rewrites.

## Workflow and checks

1. Read the affected code and tests. Check `git status` and branch before editing. Start a `codex/` branch for a feature or fix.
2. For visual features, make a local version for the owner to inspect before deployment when requested. Use sample data only in an explicitly labeled preview, never as a substitute for product persistence.
3. Add focused tests for changed behavior, especially persistence, authorization, resume behavior, and cross-user isolation. Verify the actual UI at desktop and mobile sizes for visual work.
4. Run the relevant checks. From the repository root: `pnpm typecheck`, `pnpm lint`, `pnpm build`, and relevant `node --test apps/web/tests/*.test.mjs`. From `apps/api`: `uv run pytest`. Report any check that could not run.
5. The normal GitHub flow requested by the owner is issue, branch, descriptive PR, then owner review/merge. Do not push, open a PR, or deploy a local-first design until the owner asks. When publication is requested, describe the change and tests in the PR and provide the link. Do not merge the owner's PR on their behalf unless asked.

## Configuration and deployment

- Follow `README.md`, `apps/web/.env.example`, and `apps/api/.env.example` for environment variable names. Run the API from `apps/api` so `.env` resolution is consistent.
- The web app is deployed on Vercel and the API on Render. Deployment settings are external; do not assume a local `.env` reflects production. Verify the configured `VITE_API_URL`, Clerk origins/redirects, CORS origins, and migration revision when debugging deployments, without printing secrets.
- Production data is not a test fixture. Use isolated tests or explicitly authorized, safe read-only checks to inspect it.
