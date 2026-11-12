import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/feedback-sounds.ts", import.meta.url), "utf8");
const exports = {};
new Function("exports", ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText)(exports);
const { prepareFeedbackSound, playFeedbackSound } = exports;

test("optional feedback stays silent when disabled or browser audio is unavailable", () => {
  delete globalThis.window;
  assert.doesNotThrow(() => {
    prepareFeedbackSound(true);
    playFeedbackSound("correct", true);
    playFeedbackSound("retry", false);
  });
});

test("answer cues unlock on the gesture and schedule distinct, quiet sounds", async () => {
  const frequencies = [];
  let contexts = 0;
  class AudioContextMock {
    state = "suspended";
    currentTime = 0;
    destination = {};
    constructor() { contexts++; }
    async resume() { this.state = "running"; }
    createGain() {
      return {
        gain: {
          setValueAtTime() {}, exponentialRampToValueAtTime() {},
          cancelScheduledValues() {}, setTargetAtTime() {},
        },
        connect() {}, disconnect() {},
      };
    }
    createOscillator() {
      return {
        frequency: { setValueAtTime(value) { frequencies.push(value); } },
        connect() {}, disconnect() {}, start() {}, stop() {},
      };
    }
  }
  globalThis.window = { AudioContext: AudioContextMock };
  playFeedbackSound("correct", false);
  assert.equal(contexts, 0);
  prepareFeedbackSound(true);
  await Promise.resolve();
  playFeedbackSound("correct", true);
  playFeedbackSound("retry", true);
  playFeedbackSound("complete", true);
  assert.equal(contexts, 1);
  assert.deepEqual(frequencies, [523.25, 659.25, 392, 349.23, 392, 523.25, 659.25]);
  playFeedbackSound("complete", false);
  assert.equal(frequencies.length, 7);
  delete globalThis.window;
});
