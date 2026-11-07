# Matching practice — local implementation

## Research and decision

Duolingo's current official Practice guide shows Words practice as matching a
target-language word to an English meaning. Its reading article illustrates both
two-column matching pairs and single-answer choice exercises within lessons.
The 2021 research paper describes recognition tasks earlier and production tasks
later; that older paper is background, not evidence of its current scheduling.
No public source inspected specifies an exact current matching/choice algorithm.

- https://blog.duolingo.com/guide-to-duolingo-practice-hub/
- https://blog.duolingo.com/covering-all-the-bases-duolingos-approach-to-reading-skills/
- https://research.duolingo.com/papers/portnoff.edm21.pdf

Fidel's own policy: two multiple-choice questions establish the session, then a
matching board of 3–5 distinct contiguous pairs, followed by remaining choice
questions. Short sets and ambiguous/duplicate labels fall back to choice.
Assessment quizzes (including spaced-repetition quizzes) stay individual choice.
Each target word is graded once; repairing a wrong match does not erase it.

## Implementation and persistence

MatchingRound and matching.css use the existing Fidel study palette and two-column
tap targets. English and Amharic meanings are shown together. Native buttons,
visible focus, next-target keyboard focus and reduced-motion support remain.
The existing LessonQuiz orchestrates mixed practice and existing results.
Exercise selection/shuffling lives in exercise-plan.ts with unit tests.

The existing lesson answer contract accepts question_type=matching. Existing
answer_attempts and user_words store results; no table or migration is needed.
Saved matching first attempts are immutable. Resume scans the actual saved word
IDs rather than trusting the maximum question_index, so unordered matches cannot
skip earlier unanswered words. Completion still requires every target answer.

## Local preview and validation

http://127.0.0.1:4186/ — direct matching round, full mixed practice and choice-only
quiz. Development fixture uses the real progress endpoints with a local test
identity and disposable in-memory SQLite on 8012. No Neon data changed.
Production app uses its existing authenticated route and vocabulary.

193 backend tests and 18 frontend tests passed. TypeScript, ESLint and production
build passed. Browser test verified failed saves, wrong pair/retry, first-attempt
score preservation, out-of-order reload/resume, 9/10 final result, switching from
two choice questions to matching, phone/dark layout, and reduced motion. Native
Enter-key matching succeeded, with focus moving to the next enabled word.

Visual critique: the 720px study desk and gold progress line preserve Fidel's
existing identity. Row-aligned word/meaning buttons remain readable in two
columns at 390px. Amharic meanings increased to 14px for mobile readability.
No shadows, decorative gradients, floating badges or timers were introduced.
Small text in the developer-only toolbar is intentional secondary metadata.

No branch pushed and no deployment performed. Fixture code stays outside the
production apps; the next PR must include only the actual source and tests.
