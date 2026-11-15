import assert from "node:assert/strict";
import { test } from "node:test";
import { appEntryState } from "../src/lib/first-run.ts";

test("new Google and email sessions enter onboarding before app content", () => {
  const preferences = { isPending: false, isError: false, onboarding_completed: false };
  assert.equal(appEntryState(false, false, preferences), "checking");
  assert.equal(appEntryState(true, false, preferences), "sign-in");
  assert.equal(appEntryState(true, true, { ...preferences, isPending: true }), "checking");
  assert.equal(appEntryState(true, true, preferences), "onboarding");
});

test("saved setup lets returning learners in and API failure stays recoverable", () => {
  assert.equal(appEntryState(true, true, { isPending: false, isError: false, onboarding_completed: true }), "ready");
  assert.equal(appEntryState(true, true, { isPending: false, isError: true }), "error");
});
