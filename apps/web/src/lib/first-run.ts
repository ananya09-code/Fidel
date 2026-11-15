export const TOUR_VERSION = 1;
export const UPDATE_VERSION = "2026-11";

type EntryState = "checking" | "sign-in" | "onboarding" | "error" | "ready";

export function appEntryState(
  authLoaded: boolean,
  signedIn: boolean,
  preferences: { isPending: boolean; isError: boolean; onboarding_completed?: boolean },
): EntryState {
  if (!authLoaded) return "checking";
  if (!signedIn) return "sign-in";
  if (preferences.isPending) return "checking";
  if (preferences.isError) return "error";
  return preferences.onboarding_completed ? "ready" : "onboarding";
}
