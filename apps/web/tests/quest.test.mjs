import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
const nativeRequire = createRequire(import.meta.url);
function load(path, overrides = {}) {
  const code = ts.transpileModule(
    readFileSync(new URL(`../src/${path}`, import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    },
  ).outputText;
  const exports = {};
  const require = (name) => {
    if (name in overrides) return overrides[name];
    if (name.endsWith(".css")) return {};
    if (name === "@tanstack/react-router")
      return {
        Link: ({ to, search: _search, children, ...props }) =>
          React.createElement("a", { href: to, ...props }, children),
      };
    if (name === "@/lib/api")
      return { SESSION_EXPIRED_MESSAGE: "Session expired" };
    if (name.startsWith("@/"))
      return load(
        `${name.slice(2)}${name.includes("components/") ? ".tsx" : ".ts"}`,
        overrides,
      );
    return nativeRequire(name);
  };
  new Function("require", "exports", code)(require, exports);
  return exports;
}
const quests = ["intro", "cafe", "neighbor", "market", "family"].map(
  (id, index) => ({
    id,
    title: id,
    description: "A conversation",
    version: 1,
    character: "guide",
    prerequisite: index ? "intro" : null,
    required: [],
    steps: [{ id: "hello", prompt: "Hello", accepts: ["hello"], kind: "word" }],
    state: null,
    locked: index > 0,
    reasons: index ? ["Collect words first."] : [],
    missing_words: [],
    unavailable_words: [],
  }),
);

test("quest clients use authenticated HTTP contracts and send server step/version", async () => {
  const calls = [];
  const token = async () => "test-token";
  const api = load("lib/api/quests.ts", {
    "@/lib/api": {
      authenticatedRequest: (value) => {
        assert.equal(value, token);
        return { token: value };
      },
      apiFetch: async (path, schema, options) => {
        calls.push({ path, options });
        return schema.parse(
          path.includes("/reply")
            ? {
                accepted: true,
                state: {
                  version: 1,
                  step_index: 1,
                  answers: [{ step_id: "hello", value: "x", text: "Hello" }],
                  completed: true,
                },
              }
            : path.includes("/start")
              ? { version: 1, step_index: 0, answers: [], completed: false }
              : { language_code: "om", quests, bank: [] },
        );
      },
    },
  });
  const signal = new AbortController().signal;
  assert.equal((await api.getQuests(token, "om", signal)).quests.length, 5);
  await api.startQuest(token, "om", "intro");
  await api.replyToQuest(token, "om", "intro", {
    expected_step: 0,
    version: 1,
    name: "Ana",
  });
  assert.equal(calls[0].path, "/api/v1/quests?language_code=om");
  assert.equal(calls[0].options.signal, signal);
  assert.equal(calls[1].options.method, "POST");
  assert.equal(calls[2].options.method, "PUT");
  assert.deepEqual(JSON.parse(calls[2].options.body), {
    expected_step: 0,
    version: 1,
    name: "Ana",
  });
});
test("typed quest responses reject incomplete persistence contracts", () => {
  const { questOverviewSchema, questReplySchema } = load("lib/api/quests.ts");
  assert.equal(
    questOverviewSchema.safeParse({ language_code: "om", quests, bank: [] })
      .success,
    true,
  );
  assert.equal(
    questOverviewSchema.safeParse({
      language_code: "unknown",
      quests,
      bank: [],
    }).success,
    false,
  );
  assert.equal(questReplySchema.safeParse({ accepted: true }).success, false);
  assert.equal(
    questReplySchema.safeParse({
      accepted: true,
      state: { version: 1, step_index: -1, answers: [], completed: true },
    }).success,
    false,
  );
});
test("five quest doors expose honest locks and the empty bank without issuing writes", () => {
  const { QuestExperience } = load("components/quest-ui/QuestExperience.tsx");
  const html = renderToStaticMarkup(
    React.createElement(QuestExperience, {
      overview: { language_code: "om", quests, bank: [] },
      onLanguage() {},
      onStart() {
        assert.fail("Rendering must not start a quest");
      },
      onReply() {
        assert.fail("Rendering must not save progress");
      },
      onRefresh() {},
    }),
  );
  assert.equal((html.match(/aria-label="Enter /g) ?? []).length, 5);
  assert.match(html, /0 \/ 5 visited/);
  assert.match(html, /Room for your first word/);
  assert.match(html, /Words in your pouch/);
  assert.doesNotMatch(html, /Local preview/);
});
test("provided character portraits are bundled locally without executable or external assets", () => {
  for (const lang of ["om", "am", "ti"])
    for (const role of ["guide", "host"]) {
      const svg = readFileSync(
        new URL(
          `../public/quest/characters/${lang}-${role}.svg`,
          import.meta.url,
        ),
        "utf8",
      );
      assert.match(svg, /<svg/);
      assert.match(svg, /<rect/);
      assert.doesNotMatch(svg, /<script|<foreignObject|\bhref=|\bon\w+=/i);
    }
});
