import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/feedback-haptics.ts", import.meta.url), "utf8");
const exports = {};
new Function("exports", ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText)(exports);
const { playFeedbackHaptic } = exports;

test("unsupported and disabled haptics never interrupt an answer", () => {
  delete globalThis.navigator;
  assert.doesNotThrow(() => playFeedbackHaptic("correct", true));
  const calls = [];
  globalThis.navigator = { vibrate: pattern => calls.push(pattern) };
  playFeedbackHaptic("correct", false);
  assert.deepEqual(calls, []);
  globalThis.navigator = { vibrate: () => { throw new Error("blocked by device"); } };
  assert.doesNotThrow(() => playFeedbackHaptic("retry", true));
  delete globalThis.navigator;
});

test("supported devices receive short, distinct cues", () => {
  const calls = [];
  globalThis.navigator = { vibrate: pattern => calls.push(pattern) };
  playFeedbackHaptic("correct", true);
  playFeedbackHaptic("retry", true);
  playFeedbackHaptic("complete", true);
  assert.deepEqual(calls, [25, [15, 45, 15], [25, 55, 35]]);
  delete globalThis.navigator;
});
