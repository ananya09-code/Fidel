# Fidel — Agent Handoff Brief

**Read this first. It replaces a fresh audit of the repo.**

Fidel is a language-learning web app for Ethiopian languages (Afaan Oromoo / Amharic / English).
Two independent apps in a pnpm workspace, no shared packages, coupled only by an HTTP contract.

**Current state:** the *content pipeline* is built and tested. The *learner-facing product* is
not — it is a designed shell full of hardcoded mock numbers. The gap between them is the
whole next phase of work.

---

## 1. Repo layout

```
Fidel/
├── apps/
│   ├── api/                 # FastAPI + Python 3.13 (uv)
│   │   ├── app/
│   │   │   ├── main.py           # app factory + ORPHANED public route
│   │   │   ├── api/v1/
│   │   │   │   ├── __init__.py   # api_router (health + audio-review)
│   │   │   │   └── endpoints/    # health.py, recordings.py
│   │   │   ├── core/             # config.py (pydantic-settings), admin_auth.py
│   │   │   ├── db/database.py    # engine + SessionLocal
│   │   │   ├── schemas/          # health.py, recordings.py
│   │   │   ├── services/         # speech.py, storage.py, audio_batches.py
│   │   │   └── scripts/storage.py   # ← INVALID PYTHON, delete it
│   │   ├── alembic/versions/     # 0001_baseline.py (NO-OP), 0002_batch_review.py
│   │   ├── data/vocabulary/      # afaan_oromoo_vocabulary.csv (seed source)
│   │   ├── scripts/              # import_vocabulary.py, generate_vocabulary_audio.py, list_voices.py
│   │   ├── tests/                # 5 files, ~66 tests, all passing
│   │   ├── .env.example          # INCOMPLETE — 8 required vars missing
│   │   ├── test_voice.py         # ← live billable API call at import, delete it
│   │   └── env                   # ← stray 2-byte file, delete it
│   └── web/                 # React 19 + TanStack Start/Router/Query + Tailwind v4 + shadcn/ui
│       └── src/
│           ├── routes/           # index.tsx, learn.tsx, admin.audio-review.tsx, __root.tsx
│           ├── lib/              # api.ts, audioReviewApi.ts, utils.ts (dead)
│           ├── components/       # common-ui/, homepage-ui/, learn-ui/, audio-review/, ui/
│           ├── hooks/use-mobile.ts
│           └── styles.css        # two competing design systems
├── package.json               # pnpm workspace root scripts
├── pnpm-workspace.yaml
└── README.md                  # setup + conventions (accurate but predates the API work)
```

---

## 2. Architecture

### 2.1 Frontend (`apps/web`)

- **Stack:** React 19.3, TanStack Router 1.170 + TanStack Start (SSR), TanStack Query 5.104,
  Vite 8, Tailwind v4, shadcn/ui (new-york / zinc / CSS vars), Radix, Zod 4, TypeScript 6.
- **Routes (only 3):** `/` HomePage · `/learn` LearnPage · `/admin/audio-review` AudioReviewPage.
  Defined in `src/routeTree.gen.ts` — **TanStack Router uses literal typed routes**, so a `<Link to="/x">`
  to a nonexistent path is a **compile error**. This is how the current typecheck failure happens.
- **API layer (good — follow this pattern):**
  - `src/lib/api.ts` — `apiFetch<T>(path, schema, init)`: base URL from `VITE_API_URL`
    (`getApiBaseUrl()`, api.ts:47), Zod-validates the response, throws a typed `ApiError`.
  - `src/lib/audioReviewApi.ts` — typed wrappers for every `/api/audio-review/*` endpoint with
    Zod schemas that mirror the Pydantic models field-for-field. Admin key read from
    `sessionStorage` (`fidel.adminKey`) and sent as `X-Admin-Key`.
  - **Never hardcode a backend URL in a component.** Never call `fetch` directly — go through `apiFetch`.
- **Data fetching:** TanStack Query is used on **the admin route only**. Home and Learn do zero
  fetching; every displayed number is a literal (`LearningProgress.tsx:14,26,38` → `"0"`,
  `LearningPath.tsx:20-91` → frozen `completed|current|locked`, `ExploreTopics.tsx:33,41,49` →
  three topics permanently locked).
- **Styling:** two parallel systems that do not meet —
  (a) custom "Fidel" CSS vars (`--sea-ink`, `--lagoon`, `--palm`, `--sand`, `--foam`, `--bg-base`, …)
  at `styles.css:9-28`, consumed via `bg-[var(--sea-ink)]`;
  (b) stock shadcn Zinc tokens (`--primary`, `--muted-foreground`, `--card`, `--chart-*`) at
  `styles.css:30-62`, **never re-skinned**.
  Consequence: every card needs a `bg-white/60`-style override, and `text-muted-foreground`
  renders cold grey against the warm palette. **Prefer the Fidel palette vars.**

### 2.2 Backend (`apps/api`)

- **Stack:** FastAPI, SQLAlchemy (sync `Session`), Alembic, Postgres (Neon/serverless),
  `addisai` SDK for TTS, `boto3` for S3-compatible object storage.
- **The backend is an admin content pipeline, not a learning API:**
  ```
  words (vocabulary)  →  batch selects eligible words  →  Addis AI TTS  →  S3 upload
       →  audio_recordings row (status=pending)  →  human approves/rejects in dashboard
       →  status=approved  →  (nothing consumes this yet)
  ```
- **Endpoints**

  | Method | Path | Auth |
  |---|---|---|
  | GET | `/` | none |
  | GET | `/api/health` | none |
  | GET | `/api/v1/words/{word_id}` | none — **ORPHANED, see §4.4** |
  | GET | `/api/audio-review/summary` | admin |
  | GET | `/api/audio-review/recordings` | admin |
  | GET | `/api/audio-review/recordings/{id}` | admin |
  | GET | `/api/audio-review/recordings/{id}/audio` | admin |
  | POST | `/api/audio-review/recordings/{id}/approve` | admin |
  | POST | `/api/audio-review/recordings/{id}/reject` | admin |
  | POST | `/api/audio-review/recordings/{id}/regenerate` | admin |
  | POST | `/api/audio-review/recordings/retry` | admin |
  | POST | `/api/audio-review/batches` | admin |
  | GET | `/api/audio-review/batches` | admin |
  | GET | `/api/audio-review/batches/{id}` | admin |
  | POST | `/api/audio-review/batches/{id}/cancel` | admin |

- **Auth model (`app/core/admin_auth.py`):** a single **static shared secret** in the `X-Admin-Key`
  header, compared with `hmac.compare_digest`. Fail-closed — if `ADMIN_API_KEY` is unset every
  admin endpoint returns **503** (not 401). `reviewed_by` is always the literal `"admin"`.
  This is a documented stopgap, not a finished design.
- **Services:**
  - `services/speech.py` — Addis AI TTS. `make_speech_text()` appends two dots to single-word
    entries (`"akkam"` → `"akkam.."`) to fix pronunciation; phrases/sentences pass through.
    `build_storage_key()` → `afaan-oromoo/words/{word_id}/{voice_id}-{speed}[-aN].mp3`.
  - `services/storage.py` — S3 upload / presigned GET / delete / head. **Raises `RuntimeError`
    at import time if any of its 5 env vars is missing.**
  - `services/audio_batches.py` — the engine. Raw `text()` SQL constants at lines 77-133.
    Upload-before-insert with compensating delete. Supersede-then-restore semantics.
- **Data model**

  ```
  words ──1:N──► word_translations
   │
   └──1:N──► audio_recordings ──N:1──► generation_batches
  ```
  - `words`: id, language_code, text, transliteration, content_type (`word|phrase|sentence`),
    category, difficulty, status (`draft|approved`), created_at.
  - `word_translations`: id, word_id, language_code, meaning, context_note, created_at.
  - `audio_recordings`: id, word_id, storage_key (nullable), speaker_id, speed, duration_ms,
    status (`pending|draft|approved|rejected|failed`), batch_id, attempt, generation_error,
    reviewed_at, reviewed_by, rejection_reason, superseded_at, created_at.
  - `generation_batches`: id, language_code, speaker_id, speed, status
    (`running|completed|failed`), requested_size, total_selected, generated_count, failed_count,
    error, created_at, started_at, completed_at.
  - **Two partial unique indexes encode the key invariants** — respect them:
    - `audio_recordings_one_active_per_config` — UNIQUE `(word_id, speaker_id, speed) WHERE superseded_at IS NULL`
    - `generation_batches_one_running_per_config` — UNIQUE `(language_code, speaker_id, speed) WHERE status = 'running'`

- **Tests:** `tests/` — `conftest.py` (patches `app.services.storage` / `audio_batches` / `speech`
  with fakes, redirects `recordings.SessionLocal` to SQLite), `support_schema.py` (builds an
  in-memory SQLite mirror of the schema — **this is the reference for the real schema**, since
  the migrations don't cover `words`/`word_translations`), plus `test_health.py`,
  `test_speech_text.py`, `test_audio_batches.py` (~26 tests), `test_recordings_api.py` (~30 tests).
  **All passing.** There is **zero coverage** of `GET /api/v1/words/{word_id}`.

### 2.3 Env vars

| Var | Required | In `.env.example`? |
|---|---|---|
| `DATABASE_URL` | **yes** (app won't import) | ❌ |
| `ADDIS_API_KEY` | yes, for TTS | ❌ |
| `S3_ENDPOINT_URL` | **yes** (app won't import) | ❌ |
| `S3_BUCKET_NAME` | yes (default `audio`) | ❌ |
| `AWS_REGION` | **yes** | ❌ |
| `AWS_ACCESS_KEY_ID` | **yes** | ❌ |
| `AWS_SECRET_ACCESS_KEY` | **yes** | ❌ |
| `AUDIO_BASE_URL` | yes, for public audio URLs | ❌ |
| `ADMIN_API_KEY` | yes, for the admin API | ✅ `change-me` |
| `AUDIO_URL_EXPIRES_IN` | optional (default 3600) | ✅ |
| `CORS_ORIGINS` | optional (JSON array) | ✅ |
| `DEBUG` | optional (**defaults to `True`**) | ✅ |

`.env` resolution is inconsistent: `db/database.py:7` uses a **cwd-relative** `load_dotenv()`,
while `services/storage.py:21`, `services/speech.py:27` and `alembic/env.py:23` use the absolute
`API_ROOT / ".env"`. **Always run the backend from `apps/api/`.**

---

## 3. Conventions

- **JS/TS → pnpm only. Python → uv only.** Never add `package-lock.json`, `yarn.lock`, or `requirements.txt`.
- `pnpm-lock.yaml` and `uv.lock` are the source of truth.
- **Never put secrets in `apps/web/.env`** — those values are bundled into the client and are public.
- Frontend: every backend call goes through `src/lib/api.ts` → Zod-validated → typed error.
- Backend: services use raw `text()` SQL, not the ORM. Pydantic models in `app/schemas/` mirror the DB.
- Root `package.json` scripts: `dev`, `build`, `lint`, `typecheck`, `generate-routes`
  (all `--filter web`). Backend checks run from `apps/api`.
- Route files in `src/routes/` are auto-discovered by the TanStack Router plugin; after adding a
  route run `pnpm generate-routes` (or the plugin does it on dev/build).

**Commands**
```bash
pnpm install                     # frontend deps
cd apps/api && uv sync           # backend deps

pnpm typecheck                   # tsc --noEmit   (currently RED — §4.1)
pnpm lint                        # eslint         (currently RED — §4.2)
pnpm build                       # vite build, client + SSR

cd apps/api && uv run pytest     # ~66 tests, currently GREEN
```

---

## 4. Issues — prioritized

### 4.1 P0 — the build is red

| # | Issue | Location | Fix |
|---|---|---|---|
| 1 | `to="/settings"` — route doesn't exist → TS2322 | `apps/web/src/components/common-ui/AppSideBar.tsx:100` | point at a real route or remove the item |
| 2 | `to="/dictionary"` — route doesn't exist → TS2322 | `apps/web/src/components/homepage-ui/Hero.tsx:52` | same |
| 3 | `Math.random()` during render → `react-hooks/purity` error | `apps/web/src/components/ui/sidebar.tsx:611` | hoist to a `useState` initializer or use a deterministic width |
| 4 | Backend **cannot start** from `.env.example` — 8 vars missing, 7 raise `RuntimeError` at import | `apps/api/.env.example` (15 lines) | document `DATABASE_URL`, `ADDIS_API_KEY`, the 5 S3 vars, `AUDIO_BASE_URL`; fix the "comma-separated" comment for `CORS_ORIGINS` (it's parsed as **JSON** — a comma list crashes startup) |
| 5 | `apps/api/app/scripts/storage.py` is **invalid Python** — Markdown code fences left in the source (line 35) → `IndentationError` | `apps/api/app/scripts/storage.py` | **delete** (dead draft of `services/storage.py`) |
| 6 | `apps/api/test_voice.py` makes a **live billable API call at import time**; named like a test so IDE runners pick it up | `apps/api/test_voice.py` | **delete** or move to `scripts/` under a non-test name |
| 7 | 18 generated `.mp3` files + stray `apps/api/env` (2 bytes) tracked in git; `generated_audio/` not gitignored | repo root, `apps/api/generated_audio/` | delete, add to `.gitignore` |

> **Do §4.1 before anything else.** You cannot typecheck the frontend or boot the backend until these are fixed.

### 4.2 P0 — correctness bugs in the review pipeline

| # | Issue | Location |
|---|---|---|
| 8 | **`GET /summary` writes to the DB** — `fail_abandoned_batches()` does UPDATE+COMMIT inside a GET. Every dashboard poll is a write. | `apps/api/app/api/v1/endpoints/recordings.py:188` → `services/audio_batches.py:244-274` |
| 9 | **"Abandoned batch" heuristic has no progress signal** — a legitimate 500-word batch (~33 min) is marked `failed` *while its worker is still running*, freeing the one-running-batch lock. A second batch then selects the same words → `IntegrityError` aborts the whole second batch. `generation_batches` has no `updated_at`/heartbeat column, so progress is unobservable. | `services/audio_batches.py:250-274` (docstring claims progress is checked — it isn't) |
| 10 | **Cancelling a batch reports it as `completed`** — cancel sets `status='failed'`, but the worker's final checkpoint does `status = COALESCE(:status, status)` with `'completed'` → overwrite. Cancel also **does not stop generation** (no cooperative flag; the loop never re-reads status). | `endpoints/recordings.py:661-675` vs `services/audio_batches.py:675-683` |
| 11 | **`run_batch` ignores the batch row's own config** — `language_code`/`speaker_id`/`speed` are loaded from the row and never used; hard-coded defaults always win. Multi-voice support is half-implemented and will silently produce wrong audio. | `services/audio_batches.py:600-633` (and `select_batch_words` ignores `batch_id`, `:369-388`) |
| 12 | **`retry` returns a false result** — `RetryResponse(results=[], retried=N, recovered=0, failed=0)` is returned *before* any work happens (deferred to a `BackgroundTask`). | `endpoints/recordings.py:528-552` |
| 13 | **The `error` column is wiped on every checkpoint** — `error = :error` instead of `COALESCE(:error, error)`, unlike every other column in the same statement. A failed batch loses its explanation. | `services/audio_batches.py:343` |
| 14 | `hmac.compare_digest` raises `TypeError` on non-ASCII input → **500 instead of 401** | `app/core/admin_auth.py:51` |
| 15 | Non-UUID path params (`recording_id: str`, `batch_id: str`) hit `uuid` columns → **500 instead of 422** | `endpoints/recordings.py:331,353,419,445,474` |
| 16 | `upload_audio` catches `ClientError`, but `boto3.upload_file` raises `S3UploadFailedError` → the documented `RuntimeError` contract is broken | `services/storage.py:112-122` |
| 17 | `clean_word_text`'s spelled-out-word guard is **inverted vs. its own comment** — `"a k k a m"` is not rejected (only the hyphenated form is) | `services/speech.py:71-74` |
| 18 | `app/main.py` swallows all DB errors with no logging, no `from exc`, no rollback | `app/main.py:107-111` |
| 19 | Superseding is **not transactional with generation** — the original is superseded + committed *before* the TTS call, so a crash in between leaves the word with no active recording forever. The docstring claims the opposite. | `services/audio_batches.py:434-435, 473-478, 547` vs `:796-800` |
| 20 | A failed regeneration **immediately supersedes its own failure row**, and superseded rows are hidden by default → the error is invisible to the operator | `services/audio_batches.py:473-478` + `endpoints/recordings.py:285-286` |
| 21 | `approve_recording` permits `rejected → approved`, but the error message says "Only pending recordings can be approved" | `services/audio_batches.py:712-719` |
| 22 | Rejected recordings remain playable/presignable; superseded recordings can be approved | `services/audio_batches.py:701-741, 765-781`; `endpoints/recordings.py:377-390` |
| 23 | `_next_attempt` + storage-key derivation is a read-then-write race — two concurrent workers compute the same attempt → same S3 key → the loser's compensating `delete_audio` **deletes the winner's object** | `services/audio_batches.py:391-403, 509-510` |
| 24 | N+1 queries: `list_batches` → `get_batch()` per row → up to 201 queries for `limit=100`; `run_batch` opens a new `Session` per word | `services/audio_batches.py:292-304` |
| 25 | Background tasks are in-process, non-durable, unbounded, and killed by `uvicorn --reload` on any file save | `endpoints/recordings.py:518,545,612`; `apps/api/main.py:15` |

### 4.3 P0 — security

| # | Issue | Location |
|---|---|---|
| 26 | `debug=True` by default → full stack traces (file paths, SQL) in production error bodies | `app/core/config.py:23`, `.env.example:7` |
| 27 | `/docs`, `/redoc`, `/openapi.json` unauthenticated in production — publishes the whole admin surface | `app/main.py:18-21` |
| 28 | `admin_api_key` is a plain `str`, not `SecretStr` → leaks in `repr(settings)` | `app/core/config.py:33` |
| 29 | No rate limiting / lockout / audit log on the admin key; one shared credential gates approve, reject, regenerate, batch control **and** presigned-URL minting; `reviewed_by` is always `"admin"` | `app/core/admin_auth.py:28-57` |
| 30 | Admin key lives in `sessionStorage` → any XSS exfiltrates a full admin credential | `apps/web/src/lib/audioReviewApi.ts:13,121-135` |
| 31 | `CORS`: `allow_credentials=True` + `allow_methods=["*"]` + `allow_headers=["*"]` — safe today only because origins are explicit | `app/main.py:23-29` |
| 32 | `AUDIO_BASE_URL` read via `os.getenv` at import time, bypassing `Settings`, undocumented; when unset every audio URL is silently `null` | `app/main.py:43,122-126` |
| 33 | `audio_url_expires_in` unvalidated at config level → a bad value becomes a runtime 500 on every playback | `app/core/config.py:36`; `services/storage.py:145-148` |

### 4.4 P0 — the orphaned public endpoint

`GET /api/v1/words/{word_id}` (`apps/api/app/main.py:55-128`) is the **only** learner-facing
endpoint and it is unfinished:

- No `response_model`, no Pydantic schema, raw dict.
- **Called by nothing** in `apps/web` (verified by repo-wide grep).
- **Zero tests.**
- Its own duplicate `get_db` (`main.py:46`) — the test fixture only overrides `recordings.get_db`,
  so this route would hit the production DB.
- Doesn't filter `superseded_at` or `status` → can serve rejected/outdated audio (`main.py:90-93`).
- `word_id: str` is not a UUID → Postgres error → 500 instead of 422.

### 4.5 P1 — schema & migrations

- **`0001_baseline.py` is a no-op.** `words` and `word_translations` were **never captured in a
  migration**, and `alembic/env.py:34` sets `target_metadata = None` → `--autogenerate` produces
  empty migrations. **`alembic upgrade head` on an empty DB fails.** The schema is not reproducible
  from the repo. `tests/support_schema.py` is currently the only accurate schema reference.
- Three `ON CONFLICT` clauses target unique constraints **no migration creates**:
  `scripts/import_vocabulary.py:58` (`(language_code, text)`), `:69` (`(word_id, language_code, meaning)`),
  `scripts/generate_vocabulary_audio.py:214` (`(word_id, storage_key)`).
- `alembic/env.py:32` — `set_main_option` uses `%` interpolation → a password containing `%` raises
  `InterpolationSyntaxError`. Needs `.replace("%", "%%")`.
- `scripts/import_vocabulary.py:81-88` classifies any entry ending in `.?!…` as a **sentence**, so
  `"Akkam."` skips the two-dot pronunciation fix that the whole speech layer exists to solve.
- `scripts/generate_vocabulary_audio.py:138-141` duplicates the storage-key format inline instead of
  calling `speech.build_storage_key()` → it overwrites attempt-1 objects and always writes `attempt = 1`.
- Legacy `audio_recordings` rows with `speaker_id IS NULL` are simultaneously "already recorded" to a
  human and "eligible" to the batch engine → duplicate recordings; the public route then returns two
  `approved` entries for one word.
- No Postgres pool tuning (`pool_size=5, max_overflow=10` → 15 connections per worker) and no
  `sslmode=require` for Neon | `app/db/database.py:14-17`

### 4.6 P1 — frontend

- **SSR hydration mismatch** on the admin route: `useState(getAdminKey())` renders the unlock form
  on the server (`sessionStorage` undefined) and the dashboard on the client | `routes/admin.audio-review.tsx:40`, `lib/audioReviewApi.ts:121-124`
- **FastAPI's `detail` is discarded** → the UI shows "409 Conflict" instead of the actual reason | `lib/api.ts:86-92`
- **"Retry N failed" only counts the current page** (10 items) — misleading label and under-retry | `routes/admin.audio-review.tsx:220-225, 386-394`
- The recordings list never polls while a batch runs; the batches query has **no error surface** at all | `routes/admin.audio-review.tsx:50-55, 182-196`
- Presigned audio URLs are cached forever and never refreshed, though `expires_in` is parsed and unused | `components/audio-review/AudioPlayer.tsx:42-56`, `lib/audioReviewApi.ts:94-98`
- No `AbortSignal` / timeout → a hung backend leaves the UI in a permanent loading state | `lib/api.ts:71-77`
- `response.json()` is called unconditionally → a future 204 becomes a spurious "malformed JSON" | `lib/api.ts:94-99`
- **Three nested `<main>` landmarks** (`ui/sidebar.tsx:307`, `routes/__root.tsx:64`, + each page) — invalid, breaks screen-reader landmark navigation
- `role="status"` used for **error** notices (should be `role="alert"`) | `routes/admin.audio-review.tsx:323-334`
- Unlabelled inputs: admin key field, batch `<select>` | `routes/admin.audio-review.tsx:296-302, 362-373`
- Audio scrubber has no `role="progressbar"` / ARIA values; `<audio>` has no `controls` or transcript | `components/audio-review/AudioPlayer.tsx:103-137`
- `useIsMobile` flashes the desktop sidebar on first paint | `hooks/use-mobile.ts:6-14`
- `LearningPath` overflows on narrow viewports (hardcoded `66px` offset) | `components/learn-ui/LearningPath.tsx:113`
- The admin page uses a completely different visual language (`bg-slate-50` + stock slate/emerald/rose)
  than the rest of the app | `routes/admin.audio-review.tsx:244`
- `--destructive-foreground` === `--destructive` → `text-destructive-foreground` is invisible | `styles.css:44-45`
- Dark mode is fully defined but **never activated** (nothing adds the `.dark` class) | `styles.css:7, 65-118`
- `process.env` fallback typechecks only by luck (no `@types/node` in `tsconfig.json` `types`) | `lib/api.ts:50`
- **Dead code (safe to delete):** `components/Header.tsx`, `components/WordQuestionCard.tsx`,
  `components/homepage-ui/WelcomeSection.tsx`, `components/learn-ui/LearnHeader.tsx`,
  `components/homepage-ui/ContinueLearning.tsx` (empty file), `lib/utils.ts`,
  `lib/api.ts:118-119` (`getHealth`), `lib/audioReviewApi.ts:231-233` (`getBatch`),
  `styles.css:236-337` (~95 lines of unreferenced rules), `--chart-*` tokens, the Fraunces webfont
  (`styles.css:1`) which is only used by a dead rule.
- `mainLinks` widens `url` to `string` (`AppSideBar.tsx:19-24`), hiding `/review` and `/profile` from
  the type checker — add `as const` so the compiler catches the next one.

---

## 5. The next feature to build

### **Public learner vocabulary API, wired into the existing Home/Learn UI.**

This is the **only** gap between two halves that are both already built. The pipeline produces
approved, human-reviewed audio with translations; the UI has polished screens waiting for exactly
that data. Right now there is a content factory with no storefront.

**Why this over "user accounts / progress persistence":** accounts need a whole auth + schema +
migration story and would sit on top of an API that still returns fake data. Build the read path
first — then "words learned" has something real to count.

**Backend — new `/api/v1` router (public, no admin key):**

| Endpoint | Notes |
|---|---|
| `GET /api/v1/words` | `category`, `difficulty`, `content_type`, `language_code` filters; pagination (`page`, `page_size` 1-100, max 100); join translations |
| `GET /api/v1/words/{word_id}` | **finish the existing orphan** (`app/main.py:55`): add a Pydantic response model, filter `superseded_at IS NULL AND status='approved'`, return a playable audio URL |
| `GET /api/v1/topics` | distinct categories with counts + availability, for `ExploreTopics` |
| `GET /api/v1/words/daily` | one deterministic word-of-the-day, for `WordOfTheDay` |

- Use a **typed `word_id: UUID`** so bad input yields 422, not 500.
- Return a **presigned URL** (reuse `services/storage.py:generate_audio_url`) rather than
  `AUDIO_BASE_URL` string concatenation, so URLs work without a public bucket.
- Add Pydantic models in `app/schemas/words.py`; add tests mirroring the admin API's HTTP-level style.
- **Also fix `GET /summary` (issue 8) and the batch lifecycle (issues 9-13) in the same phase** —
  every batch feeding the new API goes through that code and it currently corrupts its own state.

**Frontend — replace the mock data:**

| Component | Currently | Should |
|---|---|---|
| `homepage-ui/LearningProgress.tsx` | three hardcoded `"0"` values, bars always 0% | real counts from the API |
| `homepage-ui/ExploreTopics.tsx` | three topics hardcoded `available: false` | real topics + counts |
| `homepage-ui/WordOfTheDay.tsx` | `"Pronunciation to be verified"`, Listen button disabled | real word + playable approved audio |
| `learn-ui/LearningPath.tsx` | frozen `completed|current|locked` for 9 lessons | real lesson list |
| `learn-ui/LearnProgress.tsx` | defaults to 0, called with **no props** (`routes/learn.tsx:19`) | real stats |

- Add a `src/lib/wordsApi.ts` following the `audioReviewApi.ts` pattern exactly: Zod schemas +
  typed functions over `apiFetch`. Add a `wordsQueryKeys` object.
- Use TanStack Query with `staleTime` set (the root client currently has `retry: false` and no
  `staleTime` — every mount refetches; see `routes/__root.tsx:32-42`).
- **A new route needs `pnpm generate-routes`** — and remember TanStack Router's typed links mean a
  `<Link to="/new-route">` is a compile error until the route exists.

---

## 6. Ground rules for agents picking this up

1. **Read §4.1 and fix it first.** Nothing else can be verified until typecheck/lint/backend-boot are green.
2. **Do not "fix" the mock data by leaving it mock.** If you touch a hardcoded zero, wire it to the API
   or leave a clear `TODO` — a plausible-looking fake is worse than an obvious stub.
3. **Respect the two partial unique indexes.** They are the concurrency guard, not an optimisation.
4. **Never log or echo secrets.** `ADMIN_API_KEY`, `ADDIS_API_KEY`, AWS keys, `DATABASE_URL`.
5. **Don't widen CORS, disable the admin auth, or relax the `compare_digest` check** to make something
   work. Fix the caller instead.
6. **Run the checks** before you claim done: `pnpm typecheck`, `pnpm lint`, `pnpm build`,
   and `cd apps/api && uv run pytest`.
7. **Keep the two apps decoupled.** The frontend talks to the backend only over HTTP; no shared
   package, no importing Python types into TS, no hardcoded URLs.
8. **`uvicorn --reload` kills in-process background batch tasks.** A batch that dies mid-run stays
   `running` for 30 minutes. Don't restart the API while a batch is in flight.
