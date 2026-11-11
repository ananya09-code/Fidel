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

## Checks

The admin audio trim action requires an `ffmpeg` executable on the API host.
Install it on the Render service before enabling this action there; approval,
rejection, and playback do not require it. A failed trim leaves the approved
recording and stored object unchanged.

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
