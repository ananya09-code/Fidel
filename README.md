# Fidel

For the Tigrinya course, multilingual audio workflow, sample vocabulary,
pronunciation-review checklist and migration/deployment order, see
[Tigrinya rollout](docs/tigrinya-rollout.md).

A language-learning web app for Ethiopian languages (Afaan Oromoo, Amharic,
English).

- `apps/web` — React 19, TanStack Start/Router/Query, Tailwind v4, Clerk
- `apps/api` — FastAPI, SQLAlchemy, Alembic, Postgres, Addis AI TTS, S3

The apps are decoupled: the frontend talks to the backend only over HTTP.

## Prerequisites

| Tool | Version |
| --- | --- |
| [pnpm](https://pnpm.io) | 10+ |
| [uv](https://docs.astral.sh/uv/) | 0.12+ |

Python 3.13 is managed by uv (`uv python install 3.13`).

## Setup

```bash
pnpm install
cd apps/api && uv sync
```

Copy the example environment files:

```bash
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
```

Both `.env` files are gitignored. Never put server secrets in `apps/web/.env` —
those values are bundled into the client.

### Clerk authentication

1. Create an application in the [Clerk dashboard](https://dashboard.clerk.com).
2. Copy the **publishable key** to `apps/web/.env`:
   `VITE_CLERK_PUBLISHABLE_KEY=pk_test_...`
3. Copy the **secret key** to `apps/api/.env`: `CLERK_SECRET_KEY=sk_test_...`
4. Set `CLERK_ISSUER` in `apps/api/.env` to the issuer URL shown by Clerk,
   for example `https://your-instance.clerk.accounts.dev`.
5. Add your frontend origin to `CLERK_AUTHORIZED_PARTIES` if you use a custom
   origin. The value is a JSON array.
6. Configure allowed redirect URLs in Clerk for `http://localhost:3000/sign-in`
   and `http://localhost:3000/sign-up` (including their nested paths).

`CLERK_JWT_KEY` is optional and enables offline token verification. The API
fails closed with `503` when Clerk is not configured. All user-facing profile
endpoints require `Authorization: Bearer <Clerk session token>`.

## Running

Two terminals.

**Frontend** (repo root):

```bash
pnpm dev          # http://localhost:3000
```

**Backend** (from `apps/api`):

```powershell
uv run fastapi dev main.py
```

| Service | URL |
| --- | --- |
| Frontend | http://localhost:3000 |
| Backend API | http://127.0.0.1:8000 |
| Health check | http://127.0.0.1:8000/api/health |
| API docs | http://127.0.0.1:8000/docs |

Run the backend from `apps/api` so its `.env` resolves consistently.

## Environment variables

| Variable | App | Notes |
| --- | --- | --- |
| `VITE_API_URL` | web | Public backend base URL |
| `VITE_CLERK_PUBLISHABLE_KEY` | web | Public Clerk key |
| `DATABASE_URL` | api | Postgres connection string |
| `CLERK_SECRET_KEY` | api | Server-only Clerk key |
| `CLERK_ISSUER` | api | Required token issuer |
| `CLERK_JWT_KEY` | api | Optional offline verification key |
| `CLERK_AUTHORIZED_PARTIES` | api | Optional JSON array of origins |
| `ADMIN_API_KEY` | api | Shared admin dashboard key |
| `ADDIS_API_KEY` | api | Text-to-speech credential |
| `S3_ENDPOINT_URL`, `S3_BUCKET_NAME`, `AWS_REGION` | api | Object storage |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | api | Object storage |
| `AUDIO_BASE_URL` | api | Public audio base URL |
| `CORS_ORIGINS` | api | JSON array of allowed origins |
| `AUDIO_URL_EXPIRES_IN` | api | Presigned URL lifetime (seconds) |
| `FFMPEG_BINARY` | api | Optional path to ffmpeg for admin audio trimming; otherwise uses `ffmpeg` on `PATH` |
| `DEBUG` | api | Defaults to `false` in `.env.example` |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | api and scheduled worker | Web Push keypair and contact URI; private key is server-only |

### Push notifications

Fidel offers daily word-goal, due-quiz, and streak reminders in Settings. A learner
must enable notifications on each device; the browser permission prompt appears
only after that button is pressed. iPhone and iPad require the Home Screen app.
The service worker handles push only and does not cache lessons for offline use.

Before enabling notifications in a deployed environment, verify its Alembic head
and apply `0012_push_notifications` using the normal reviewed migration process.
Generate a stable VAPID keypair with [py-vapid](https://github.com/web-push-libs/vapid/tree/main/python)
outside the repository. Set `VAPID_PUBLIC_KEY` to its application server key,
`VAPID_PRIVATE_KEY` to its base64url DER private key, and `VAPID_SUBJECT` to a
`mailto:` contact. Keep the private key in server secrets and give the same three
values to the API and scheduled worker. Rotating the pair requires users to
subscribe again.

Run `uv run python -m app.services.notification_delivery` from `apps/api` every
hour on a trusted scheduled service with the API's database and VAPID environment.
The worker uses each learner's timezone and reminder time, sends at most one
relevant message per device and local day, and removes expired subscriptions.
The web service alone does not run the schedule.

For the free GitHub Actions scheduler, `.github/workflows/notification-delivery.yml`
runs at minute 17 of every UTC hour on `main`. Configure the `notification-worker`
GitHub environment with `DATABASE_URL`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
and `VAPID_SUBJECT` as environment secrets. Use the same database URL and VAPID
values as the Render API; replacing the VAPID pair invalidates existing device
subscriptions. Restrict this environment to the `main` branch. After the secrets
are in place, set the repository Actions variable `NOTIFICATION_WORKER_ENABLED`
to `true` and trigger the workflow manually once to check its run log. Until
then, scheduled jobs are skipped. GitHub may delay or drop scheduled runs, and
automatically disables schedules in public repositories after 60 days without
repository activity.

## Checks

The admin audio trim action requires `ffmpeg` on the API host. Render's native
Python runtime includes it at runtime, so no extra install or environment
variable is needed there. For a custom Docker image, include `ffmpeg` in the
image. A failed trim leaves the approved recording and stored object unchanged.

```bash
pnpm typecheck
pnpm lint
pnpm build

cd apps/api
uv run pytest
```

## Conventions

- Use pnpm for JavaScript/TypeScript and uv for Python. Do not add
  `package-lock.json`, `yarn.lock`, or `requirements.txt`.
- Every frontend API call goes through `apps/web/src/lib/api.ts`, which
  validates responses with Zod and throws a typed `ApiError`.
- Never hardcode a backend URL in a component.
- Import aliases: `#/*` and `@/*` both map to `apps/web/src/*`.
- Admin audio-review endpoints use the `X-Admin-Key` header and are separate
  from Clerk user authentication.
