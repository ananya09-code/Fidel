# Fidel mobile

This Expo app is for private testing. It uses the same Fidel API, account, approved audio, and saved progress as the website. Lesson sessions contain up to ten words. Larger lessons can take several sessions.

## Run on your phone

1. From the repository root, run `pnpm install --frozen-lockfile`.
2. Copy `.env.example` to `.env.local` in this directory and enter the publishable key for the Clerk instance you intend to test. Use the same instance as the API. Keep the Clerk secret key on the API server.
3. From the repository root, run `pnpm --filter @fidel/mobile start` and open it with a compatible Expo Go client. Keep the development computer running and on the same network as the phone.

For a self-contained Android build, use the `preview` profile in `eas.json` with an Expo account, or generate the Android project with `expo prebuild --platform android` and run Gradle’s `:app:assembleRelease` task with the required SDK and Java configured. Expo’s generated release configuration uses its debug signing key for local testing.

Clerk requires its Native API to be enabled in the chosen instance. Register package and bundle ID `et.fidelapp.mobile` in that instance when preparing the standalone app. For an API with `CLERK_AUTHORIZED_PARTIES` configured, deploy this branch’s API code and enable `CLERK_ALLOW_NATIVE_SESSIONS=true` on the test API. It verifies the Clerk signature and issuer and enforces the existing allowlist on tokens with a browser origin. See the [Clerk hosted authentication guide](https://clerk.com/docs/expo/guides/account-portal/hosted-auth) for callback requirements.

## Week of testing

- Use an existing Fidel account and verify the selected language, theme, and goal match the web.
- Play and pause pronunciation. Close the app during a lesson, then resume it from Home.
- Finish a practice session and verify its progress on the website.
- Complete a review and switch courses to check that statistics and review words follow your selected language.
