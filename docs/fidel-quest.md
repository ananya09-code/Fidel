# Fidel Quest

Five authored quests in each course: introduction, café, neighbor, market, family.
Definitions and explicit accepted word variants live only in
`apps/api/app/services/quest_definitions.py`. They are versioned, never generated
from learner input. English dialogue scaffolds native vocabulary; it does not
claim to assess whole-sentence conversational fluency. Native-speaker review of
word variants remains part of content release. Do not edit an in-use definition
without a version/migration plan for existing attempts.

## Persistence and gates

`GET /api/v1/quests?language_code=om|am|ti` returns five definitions, server gates,
saved progress, and the authenticated user's collected word bank. The bank
contains approved words marked learned, or needs_review with times_correct > 0.
Favorites alone do not count. Required words must have an active approved audio
recording; missing vocabulary/audio is reported and the quest stays locked.
No vocabulary is inserted or approved by this feature.

`POST /api/v1/quests/{language}/{key}/start` creates or resumes that user's row.
`PUT /api/v1/quests/{language}/{key}/reply` accepts expected_step, definition
version, and either a name or a word_id. Names use fidel for Amharic/Tigrinya and
Qubee for Oromo. Word IDs must belong to the current collected course bank.
The server validates answers and completes only the final accepted step. Wrong
answers return a friendly hint and do not advance. Exact retries are idempotent;
conflicting/stale steps return 409. PostgreSQL user-row locking and a conditional
update prevent double advancement. No lesson mastery, review schedule or daily
goal counters are awarded for a quest reply.

`quest_progress` is keyed by user_id + language_code + quest_key and stores
definition version, accepted answers, step index and completion timestamps.
Completed quests can be revisited as their saved transcript; they are not reset.
All reads/writes scope identity to the verified Clerk subject. No learner can
submit another user's ID, progress or completion state.

## UI and assets

Learn links to `/quest`. Course selection does not overwrite saved preferences.
The village has five stops, a guide's journal and a word pouch. During a chat,
the journal/pouch are not rendered: only the character, saved conversation and
bank reply tray appear. Save failures never show accepted/completed feedback.
English and Amharic meanings remain available. Only approved audio URLs play.
No auto-animated map or character motion is needed; reduced motion is supported.

Six rectangle-only portraits in `apps/web/public/quest/characters` were extracted
from the owner's supplied fidel-characters-am.svg, -om.svg and -ti.svg packs.
Mother portraits are guides; father portraits are hosts. Source sheets were
unchanged. Portraits do not imply that dialogue has native recordings.

## Deployment order

Read-only inspection on this task verified Neon at `0008_tigrinya_preferences`,
with the existing users, user_words, words, translations and audio schema. No
production migration, learner-data write or speech generation was performed.

1. Review migration `0009_quests` and run tests on an isolated database. It only
   adds quest_progress; no existing schema or data is rewritten. Downgrade refuses
   destructive history deletion and requires an explicit archival plan.
2. After owner approval, confirm the target is still at 0008 and apply the reviewed
   migration. Never stamp/reset to bypass a mismatch. Take the normal Neon branch
   or backup checkpoint first.
3. Deploy the backend on Render, verify authenticated Quest responses, then deploy
   the frontend on Vercel. Keep frontend/API rollback coordinated. Do not drop
   quest_progress during a code rollback; existing endpoints are unaffected.
4. Confirm that a saved conversation survives refresh and another account cannot
   see it. Check required content/audio for all courses. Pending content stays
   locked rather than using fallback/sample words.

Tests use an isolated SQLite database and offline PostgreSQL DDL generation;
they do not claim a live PostgreSQL concurrency test. An isolated local browser
fixture uses clearly labeled sample banks and memory saves only; it is ignored
and never bundled into production. Production has no mock fallback.
