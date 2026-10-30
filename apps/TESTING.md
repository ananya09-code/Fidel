# Fidel testing and deployment checks

## Automated checks

From `apps/api`:

```powershell
uv run python -B -m pytest tests -p no:cacheprovider --tb=short
uv run alembic current
```

From `apps/web`:

```powershell
pnpm typecheck
pnpm lint
pnpm build
```

The deployed database revision must match the repository's Alembic head before
starting the API. Never use `alembic stamp` to hide a schema mismatch.

## Local browser smoke test

1. Start the API from `apps/api` with `uv run fastapi dev main.py`.
2. Start the web app from `apps/web` with `pnpm dev`.
3. Open `http://localhost:3000` and sign in with a Clerk development account.
4. Complete onboarding and refresh the page; the selections must persist.
5. Start a lesson, answer at least one question, refresh, and verify it resumes.
6. Complete the lesson and verify Learn, Home, and Profile show the result.
7. Mark a dictionary word as favorite and `Needs review`; refresh and verify both.
8. Complete `/review`; correct words must become learned and missed words must remain.
9. Sign out and back in; all state must persist.
10. Sign in with a second Clerk account; no first-account progress may appear.

## Deployment order

1. Back up or confirm Neon recovery settings.
2. Run `uv run alembic current` and compare it with the repository head.
3. Apply reviewed migrations with `uv run alembic upgrade head`.
4. Deploy/restart the API.
5. Deploy the web application with the production API URL and Clerk publishable key.
6. Run the browser smoke test with non-production test users.

Never expose `DATABASE_URL`, Clerk secret keys, admin keys, or storage credentials
in frontend environment variables, logs, screenshots, or test output.
