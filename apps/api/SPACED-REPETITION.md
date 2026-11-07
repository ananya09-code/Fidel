# Memory checks: production integration

The real Home and Review routes use Clerk-authenticated API requests. No sample
words, test identity or time controls are imported by production code.

## Database contract

No migration or new environment variable is required. The feature reuses:

- `user_words`: per-user learning state and latest learning/practice timestamp.
- `review_sessions`: persisted randomized word IDs, progress and completion.
- `review_answers`: first answer per session/word, correctness and answer time.
- `words` and `word_translations`: vocabulary and English/Amharic meanings.

Read-only Neon inspection on November 6, 2026 verified revision `0007_reviews`,
all required columns and the unique active-session index. No user records were
read or changed during schema inspection.

Due dates are derived from persisted timestamps and completed review history in
UTC: initially 3 days; successive correct recalls use 14, 30, 90, 180 and 365
days (capped). A missed word returns after one day. Ordinary completed reviews
also contribute. Existing words use their available `last_seen_at` learning/
practice timestamp; the schema has no historical `learned_at` field. Favorite-
only edits do not change this timestamp.

`GET /api/v1/reviews/spaced?language_code=om|am` is read-only and returns counts,
the next date and any existing session. `POST /api/v1/reviews/start?mode=spaced`
randomly selects at most 10 due words in the requested language and resumes an
existing session first. At least two tracked learned words are needed. Answer
choices come from the authenticated user's vocabulary. Existing answer and
complete endpoints persist results. PostgreSQL row locks serialize session
writes; retries cannot replace an already saved answer or extend its timestamp.

## Release order and checks

1. Deploy the API changes to Render first. Do not run migrations or seed data.
2. Deploy the frontend to Vercel using its existing `VITE_API_URL` configuration.
3. With a signed-in account, verify counts on Home and Review, starting/resuming
   a quiz, answering and completing it, and the next review date after reloading.
4. Check that another account cannot see or answer the first account's session.

An account with no due words should show its next date or a learning prompt;
do not alter real timestamps to manufacture a due quiz. Automated tests and the
local disposable preview cover time advancement. Files in `apps/.taste-skill/`
are development fixtures and must not be included in deployment code.
