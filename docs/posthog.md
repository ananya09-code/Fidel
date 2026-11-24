# PostHog setup

Set VITE_POSTHOG_PROJECT_TOKEN to your public project token and VITE_POSTHOG_HOST to https://us.i.posthog.com in Vercel Production, then redeploy. Leave the token empty to disable. Development builds do not send events. No backend changes or migrations are needed.

Explicit events run after validated successful saves: onboarding_completed, lesson_started, lesson_completed, review_started, review_completed, quest_started, quest_completed. Pageviews follow router pathname changes. Clerk IDs link learning events to learners. Logout resets identity. Repeated session events are deduplicated in memory per identity. Reloads or multiple devices can repeat events. Analytics is best effort and saved progress remains the source of truth.

Autocapture, replay, exception collection, surveys and feature flags are disabled. Authentication/admin screens are excluded. Do Not Track is respected. URL query strings and fragments are stripped. No emails, names, answer text, tokens or credentials are explicitly sent.

After deployment, check Live events for a pageview and a completed lesson. Confirm the Clerk identity, then sign out and check anonymous pageviews. Build an onboarding-to-first-lesson funnel, daily active learners, and day-one/day-seven retention. Configure product usage limits to stay within the free allowance and update the privacy notice for usage analytics.
