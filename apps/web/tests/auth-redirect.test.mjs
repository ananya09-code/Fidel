import assert from "node:assert/strict";
import { test } from "node:test";
import { getPostAuthTarget } from "../src/lib/auth-redirect.ts";

test("auth returns to the saved-preferences gate for normal sign-in and onboarding links", () => {
  for (const redirect of [undefined, "/onboarding", "/onboarding?step=1", "/sign-in", "/sign-up/verify", "https://example.com"])
    assert.equal(getPostAuthTarget(redirect), "/Home");
  assert.equal(getPostAuthTarget("/review?start=true"), "/review?start=true");
});
