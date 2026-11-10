# Tigrinya course and multilingual audio rollout

## What this change includes

- Learners can save `ti` (Tigrinya) during onboarding or in settings. Header,
  profile, dictionary and learning-path labels display `ትግርኛ`.
- Lesson paths use existing approved vocabulary. Progress, vocabulary state and
  scheduled reviews use the existing authenticated APIs; no new progress tables.
- The audio admin page selects language and a voice from Addis AI's live catalog.
  Generation, regeneration, retry, object paths and batch history retain the word's
  language. Existing Oromo object keys are unchanged.
- Finished/failed batch results remain visible, and recordings refresh as batches
  progress and when they finish. Completed batches cannot be executed again.

The interface-language setting records a preference, as before; it does not
introduce a complete translated application interface.

## Database state and migration

Read-only inspection verified Neon at `0007_reviews`. `words.language_code`,
translations and generation batches already accept Tigrinya. The existing partial
unique indexes protect active recordings and running batches by configuration.

`0008_tigrinya_preferences` expands only the named learning/interface preference
check constraints to include `ti`. It changes no stored preferences or user data.
Downgrade validates the old constraints and must not be attempted while any
learner still has Tigrinya selected. No downgrade/stamp/reset is part of rollout.

The migration was executed on isolated SQLite to check preservation of existing
rows, and the full PostgreSQL migration SQL was rendered offline. It also passed
against a connection-local PostgreSQL temporary table: an existing synthetic row
was preserved and Tigrinya preferences were accepted. Table resolution was
verified before executing the migration, and the transaction was rolled back;
public tables and revision records were untouched. A complete migration-chain
test on an isolated PostgreSQL database remains a release check. Neon's public
schema has **not** been upgraded by this change.

## Small vocabulary sample

`apps/api/data/vocabulary/tigrinya_sample.csv` contains five draft entries:
`ሰላም`, `የቐንየለይ`, `ማይ`, `ገዛ`, `ቡን`, with transliteration, English and
Amharic meanings. Categories and beginner difficulty use existing contracts.

English meanings were cross-checked against the
[Targumi Tigrinya vocabulary](https://www.targumi.com/en/survival-kit/tigrinya).
The sample and pronunciation still need a fluent speaker's editorial approval.
Do not treat transliterations as a standardized pronunciation guide.

Five sample words and ten translations were imported into Neon as drafts during
the authorized trial. Two recordings (`ሰላም`, `ማይ`) were generated with
`ti-berhane`; both remain **pending**, and no word/audio was approved.
A diagnostic rerun caused the second clip; the new completed-batch guard prevents
that replay, and the trial batch counters were reconciled with its saved rows.

## Configuration and local commands

Keep backend credentials in `apps/api/.env` or process environment variables:
`DATABASE_URL`, `ADDIS_API_KEY`, `S3_ENDPOINT_URL`, `S3_BUCKET_NAME`, `AWS_REGION`,
`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `ADMIN_API_KEY` for the admin UI.
Never put these in frontend `VITE_*` variables or source control.

From `apps/api`:

```powershell
# No database connection or writes:
uv run python scripts/import_vocabulary.py --csv data/vocabulary/tigrinya_sample.csv --dry-run

# Read-only provider catalog; no speech is generated:
uv run python scripts/list_voices.py --language ti

# Explicit import: adds drafts and translations, preserves existing entries:
uv run python scripts/import_vocabulary.py --csv data/vocabulary/tigrinya_sample.csv
```

If the owner's local credentials are in `apps/.env`, explicitly use
`uv run --env-file ../.env python ...` for the credentialed commands. The CSV
dry run does not require them. Do not repeat the live trial just to test code;
use the existing pending recordings or the isolated tests.

The admin API accepts `POST /api/audio-review/batches` with, for example:

```json
{"batch_size": 1, "language_code": "ti", "speaker_id": "ti-berhane"}
```

Use a voice returned by `GET /api/audio-review/voices?language_code=ti`, with the
admin header supplied securely by the reviewer. Catalog selection is based on
[Addis AI's voice documentation](https://docs.addisassistant.com/docs/capabilities/text-to-speech).
The established Oromo word punctuation workaround is preserved only for Oromo;
Amharic and Tigrinya text is sent unchanged. Short-word quality must be listened
to, not inferred from a successful HTTP response.

## Pronunciation approval checklist

The generated files are distinct MP3 recordings and match the provider's saved
clips. Local previews were fetched by exact word after correcting an initially
mislabeled preview download. Codec/file checks pass; that is not a fluent-speaker
pronunciation certification. No recording has been approved.

1. Listen to the existing `ሰላም` and `ማይ` clips at normal speed. Confirm the spoken
   word, vowels, consonants and word ending; reject clipping or added speech.
2. Have a fluent Tigrinya speaker confirm pronunciation and the English/Amharic
   meanings. Dialect-dependent alternatives should be documented before approval.
3. Approve or reject through the existing admin workflow. Do not manually publish
   draft words to bypass audio/editorial review.

Until content is approved, the Tigrinya learning path correctly shows its empty
state; the code does not manufacture lessons or mark sample words as approved.

## Deployment after owner approval

1. Review this PR, the preference migration and the pending recordings.
2. Test `0007_reviews -> 0008_tigrinya_preferences` on an isolated PostgreSQL
   database. Inspect the intended production revision/schema read-only again.
3. Apply the reviewed migration through the normal release process, then deploy
   the backend and frontend. The backend must accept/persist `ti` before the new
   frontend course option is released.
4. Verify saving Tigrinya preferences, loading approved topics/lessons, resuming
   progress, dictionary meanings/audio, and spaced reviews. Check another user
   cannot see the first user's progress.
5. Keep existing approved Oromo/Amharic audio and user data intact. Do not reset or
   stamp the production database to resolve a release problem.

No production deployment or migration application is authorized by merely opening
the PR; owner deployment approval remains outstanding.
