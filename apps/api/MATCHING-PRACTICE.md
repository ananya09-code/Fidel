# Matching practice release

Lessons use two individual multiple-choice questions, a 3–5-pair matching round
when the following words have distinct labels/meanings, then any remaining
choice questions. Short or ambiguous sets remain multiple choice. Assessment
quizzes, including spaced quizzes, keep individual multiple-choice questions.
This is Fidel's own exercise-selection policy, informed by Duolingo's public
examples rather than a copy of its unpublished scheduling algorithm.

Matching uses the existing authenticated lesson route, word data and progress
API. Each target word remains one answer: `question_type=matching` records its
first response in `answer_attempts`, updating that user's `user_words` state.
Repairing a wrong pair cannot erase the original mistake. PostgreSQL row locks
serialize answer and completion writes for a lesson attempt. Completion still
requires an answer for every target word; category completion still requires
the existing whole-category coverage.

Resume finds the earliest unanswered word from persisted answer IDs instead of
trusting the maximum saved index, because pairs can be answered out of order.
Matching columns shuffle deterministically for a stable resumed session.

## Deployment

- No migration or new environment variable is required. The existing
  `answer_attempts.question_type` string column stores `matching` without a
  schema change; only the API request validator gains the additional value.
- Deploy the Render API before the Vercel frontend. The older API validator
  rejects matching answers with 422.
- Do not include files in `apps/.taste-skill/` in the release. Those are local
  sample accounts, disposable database servers and screenshot fixtures.
- Smoke-test a real lesson with at least five unambiguous words: two choice
  questions, matching, reload during matching, then finish the remaining words.
- Confirm missed pairs remain in review and a lesson cannot finish early.

## Research

- https://blog.duolingo.com/guide-to-duolingo-practice-hub/
- https://blog.duolingo.com/covering-all-the-bases-duolingos-approach-to-reading-skills/

Automated tests cover exercise selection, duplicate-label fallback, stable
shuffle, persisted first attempts, out-of-order resume, completion and ownership.
Browser checks cover failed saves, pair retries, mixed-format switching, final
score, native keyboard operation, dark mode, mobile and reduced motion.
