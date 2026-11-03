import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";
import * as zod from "zod";

// Exercise the real TypeScript client with a fake HTTP boundary, without a server.
const source = readFileSync(new URL("../src/lib/api/learning.ts", import.meta.url), "utf8");
function clientWith(apiFetch) {
  const exports = {};
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const require = (name) => {
    if (name === "zod") return zod;
    if (name === "@/lib/api") return { apiFetch };
    throw new Error(`Unexpected import: ${name}`);
  };
  new Function("require", "exports", compiled)(require, exports);
  return exports;
}

test("loads every word beyond the first 50 and forwards cancellation", async () => {
  const words = Array.from({ length: 114 }, (_, id) => ({ id: String(id) }));
  const requests = [];
  const signal = new AbortController().signal;
  const client = clientWith(async (path, _schema, init) => {
    const offset = Number(new URL(path, "https://example.test").searchParams.get("offset"));
    requests.push(offset);
    assert.equal(init.signal, signal);
    return {
      lesson: { id: "om-beginner-greetings", word_count: words.length },
      words: words.slice(offset, offset + 50),
      pagination: { limit: 50, offset, total: words.length, has_more: offset + 50 < words.length },
    };
  });
  const result = await client.getLessonWords("om-beginner-greetings", "om", signal);
  assert.deepEqual(requests, [0, 50, 100]);
  assert.deepEqual(result.words, words);
  assert.equal(result.pagination.has_more, false);
});

test("does not silently start an incomplete lesson when a later page fails", async () => {
  let requestCount = 0;
  const client = clientWith(async () => {
    if (requestCount++) throw new Error("Connection interrupted");
    return {
      words: [{ id: "first" }],
      pagination: { limit: 50, offset: 0, total: 60, has_more: true },
    };
  });
  await assert.rejects(client.getLessonWords("lesson", "om"), /Connection interrupted/);
});

test("rejects pagination that makes no progress instead of looping forever", async () => {
  const client = clientWith(async () => ({
    words: [], pagination: { limit: 50, offset: 0, total: 60, has_more: true },
  }));
  await assert.rejects(client.getLessonWords("lesson", "om"), /remaining lesson words/);
});
