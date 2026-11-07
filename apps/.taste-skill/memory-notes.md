# Local spaced-repetition implementation

Home and Review now share a real authenticated memory-check query and a presentation component. The established green/neutral layout, teacher mark and gold action color are preserved.

Schedule: 3, 14, 30, 90, 180, 365 days (capped), after successful recalls. Failed words return after one day. Due selection is randomized and capped at 10; active sessions are resumed instead of duplicated. At least two learned words are needed for a meaningful quiz. Additional own vocabulary supplies distractors when just one word is due.

No migrations: derive dates from user_words.last_seen_at and completed review session answers. For existing words, last_seen_at is the available practice/learning anchor, rather than an unavailable historical learned_at timestamp. Both ordinary completed reviews and memory checks contribute to the intervals. Favorite-only changes no longer alter this anchor. All queries and choices are scoped to the Clerk-mapped local user and the chosen language.

Source changes: api/app/services/spaced_repetition.py; api/app/schemas/reviews.py; api/app/api/v1/endpoints/{reviews,vocabulary}.py; api/tests/test_reviews_api.py; web/src/lib/api/reviews.ts; web/src/components/learn-ui/review/{MemoryCheck,MemoryCheckView,ReviewOverview}.tsx; memory-check.css; web/src/components/learn-ui/lesson/LessonQuiz.tsx; homepage-ui/HomeDashboard.tsx; routes/_app/{Home,review}.tsx; hooks/use-vocabulary-state.ts.

Preview: http://127.0.0.1:4185/Home and /review. Loopback test API on 8011 uses an in-memory SQLite database and a fixed demo identity. None of this fixture code belongs in production. No Neon records changed. The main app still needs the new backend deployed before its new endpoint can work against Render.

Validation: 189 backend tests; TypeScript, ESLint, production build; 15 existing frontend tests; end-to-end quiz with correct/wrong answers, exit/resume, completion, history, next date and advancing the clock; desktop/phone light and dark screenshots. Existing schema and authentication flow remain in use. No live-account authentication/persistence writes were exercised.

Visual critique: compact interval line makes the schedule explicit; a single gold action is consistent with existing screens. Phone stacking and English/Amharic feedback remain readable, with no horizontal overflow. Preview-only navigation contrast corrected after the inspector warned about it.
