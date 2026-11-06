import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/components/learn-ui/lesson/encouragement.ts", import.meta.url), "utf8");
const exports = {};
new Function("exports", ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText)(exports);
const { encouragementFor, correctRun } = exports;

test("mistakes break the consecutive saved-answer run", () => {
  assert.equal(correctRun({}), 0);
  assert.equal(correctRun({ a: "a", b: "b", c: "wrong" }), 0);
  assert.equal(correctRun({ a: "wrong", b: "b", c: "c" }), 2);
  assert.equal(correctRun({ a: "a", b: "b", c: "c" }), 3);
});

test("milestone encouragement uses actual correct runs", () => {
  assert.equal(encouragementFor({ outcome: "correct", turn: 3, streak: 2 }).tone, "correct");
  assert.match(encouragementFor({ outcome: "correct", turn: 4, streak: 3 }).title, /^3 right/);
  assert.equal(encouragementFor({ outcome: "incorrect", turn: 4, streak: 3 }).tone, "encourage");
  assert.equal(encouragementFor({ outcome: "recovered", turn: 4, streak: 3 }).tone, "recovered");
});

test("retry and incorrect messages do not falsely claim a correct answer", () => {
  for (const outcome of ["incorrect", "retry"]) {
    for (let turn = 0; turn < 6; turn++) {
      const message = encouragementFor({ outcome, turn });
      assert.equal(message.tone, "encourage");
      assert.doesNotMatch(message.title, /right in a row|well remembered|perfect score/i);
    }
  }
});

test("correct answers receive varied but stable messages", () => {
  const first = encouragementFor({ outcome: "correct", turn: 1 });
  assert.notEqual(first.title, encouragementFor({ outcome: "correct", turn: 2 }).title);
  assert.deepEqual(first, encouragementFor({ outcome: "correct", turn: 1 }));
});
