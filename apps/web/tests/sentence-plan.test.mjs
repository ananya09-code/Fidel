import assert from "node:assert/strict";
import { test } from "node:test";
import { sentenceAfterWord } from "../src/components/learn-ui/lesson/sentence-plan.ts";

test("offers only a ready, unseen sentence containing the newly learned word", () => {
  const exercises = [
    { id: "waiting", locked: true, completed: false, tiles: [{ word_id: "new" }] },
    { id: "done", locked: false, completed: true, tiles: [{ word_id: "new" }] },
    { id: "other", locked: false, completed: false, tiles: [{ word_id: "other" }] },
    { id: "ready", locked: false, completed: false, tiles: [{ word_id: "old" }, { word_id: "new" }] },
  ];
  assert.equal(sentenceAfterWord(exercises, "new", new Set())?.id, "ready");
  assert.equal(sentenceAfterWord(exercises, "new", new Set(["ready"])), undefined);
});
