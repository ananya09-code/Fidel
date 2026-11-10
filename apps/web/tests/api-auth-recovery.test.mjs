import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";
import * as zod from "zod";
import { createRequire } from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Run the real request client against an isolated fake HTTP/Clerk boundary.
const source = readFileSync(new URL("../src/lib/api.ts", import.meta.url), "utf8")
  .replaceAll("import.meta.env", "viteEnv");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function client(fetch) {
  const exports = {};
  new Function("require", "exports", "fetch", "viteEnv", "process", compiled)(
    () => zod, exports, fetch, {}, { env: {} },
  );
  return exports;
}
const schema = zod.z.object({ saved: zod.z.boolean() });
const ok = () => Response.json({ saved: true });
const rejected = () => Response.json({ detail: "Rejected fixture token" }, { status: 401 });

test("a rejected token is refreshed without reloading and retried once", async () => {
  const tokens = [], calls = [];
  const api = client(async (_url, init) => {
    calls.push(init);
    return calls.length === 1 ? rejected() : ok();
  });
  const getToken = async options => { tokens.push(options); return options?.skipCache ? "fresh-fixture" : "stale-fixture"; };
  assert.deepEqual(await api.apiFetch("/reviews", schema, api.authenticatedRequest(getToken)), { saved: true });
  assert.deepEqual(tokens, [undefined, { skipCache: true }]);
  assert.deepEqual(calls.map(x => x.headers.get("Authorization")), ["Bearer stale-fixture", "Bearer fresh-fixture"]);
  assert.ok(calls.every(x => !("getToken" in x)));
});

test("an accepted token sends only one request and never forces refresh", async () => {
  let calls = 0;
  const api = client(async () => { calls++; return ok(); });
  await api.apiFetch("/preferences", schema, api.authenticatedRequest(async options => {
    assert.equal(options, undefined); return "fixture";
  }));
  assert.equal(calls, 1);
});

test("persistent rejection stops at two requests with a clear session error", async () => {
  let calls = 0;
  const api = client(async () => { calls++; return rejected(); });
  await assert.rejects(api.apiFetch("/reviews", schema, api.authenticatedRequest(async () => "fixture")),
    error => error.status === 401 && error.message === api.SESSION_EXPIRED_MESSAGE);
  assert.equal(calls, 2);
});

test("missing or failed token refresh never sends an unauthenticated retry", async () => {
  for (const fail of [() => null, () => { throw new Error("Clerk unavailable"); }]) {
    let calls = 0;
    const api = client(async () => { calls++; return rejected(); });
    await assert.rejects(api.apiFetch("/reviews", schema, api.authenticatedRequest(async options =>
      options?.skipCache ? fail() : "fixture")), error => error.status === 401);
    assert.equal(calls, 1);
  }
});

test("a missing initial session sends no API request", async () => {
  const api = client(() => { assert.fail("No request without a session"); });
  await assert.rejects(api.apiFetch("/reviews", schema, api.authenticatedRequest(async () => null)),
    error => error.status === 401);
});

test("answer PUT retries only the rejected request and preserves the body and signal", async () => {
  const calls = [], signal = new AbortController().signal;
  let appliedWrites = 0;
  const api = client(async (_url, init) => {
    calls.push(init);
    if (calls.length === 1) return rejected();
    appliedWrites++;
    return ok();
  });
  const body = JSON.stringify({ word_id: "fixture-word", selected_word_id: "fixture-choice" });
  await api.apiFetch("/answers", schema, { ...api.authenticatedRequest(async () => "fixture"), method: "PUT", body, signal });
  assert.equal(appliedWrites, 1);
  for (const init of calls) {
    assert.equal(init.method, "PUT"); assert.equal(init.body, body); assert.equal(init.signal, signal);
    assert.equal(init.headers.get("Content-Type"), "application/json");
  }
});

test("void responses use the same bounded recovery", async () => {
  let calls = 0;
  const api = client(async () => ++calls === 1 ? rejected() : new Response(null, { status: 204 }));
  await api.apiFetchVoid("/profile", { ...api.authenticatedRequest(async () => "fixture"), method: "DELETE" });
  assert.equal(calls, 2);
});

test("network errors, forbidden requests and server failures never replay writes", async () => {
  for (const status of [0, 403, 500, 503]) {
    let calls = 0, tokens = 0;
    const api = client(async () => {
      calls++;
      if (!status) throw new TypeError("Connection lost");
      return new Response(null, { status });
    });
    await assert.rejects(api.apiFetch("/answers", schema, {
      ...api.authenticatedRequest(async () => { tokens++; return "fixture"; }), method: "PUT", body: "{}",
    }), error => error.status === status);
    assert.equal(calls, 1); assert.equal(tokens, 1);
  }
});

test("aborting during token refresh cancels the retry", async () => {
  const controller = new AbortController(); let calls = 0;
  const api = client(async () => { calls++; return rejected(); });
  await assert.rejects(api.apiFetch("/reviews", schema, {
    ...api.authenticatedRequest(async options => {
      if (options?.skipCache) controller.abort();
      return "fixture";
    }), signal: controller.signal,
  }), error => error.name === "AbortError");
  assert.equal(calls, 1);
});

test("parallel users keep request-local credentials through refresh", async () => {
  const calls = [];
  const api = client(async (url, init) => {
    const token = init.headers.get("Authorization"); calls.push([url, token]);
    return token.endsWith("stale") ? rejected() : ok();
  });
  await Promise.all(["alice", "bob"].map(user => api.apiFetch(`/${user}`, schema,
    api.authenticatedRequest(async options => `${user}-${options?.skipCache ? "fresh" : "stale"}`))));
  for (const [url, token] of calls) assert.ok(token.startsWith(`Bearer ${url.split("/").at(-1)}-`));
  assert.equal(calls.length, 4);
});

test("public and literal-token requests have no implicit auth refresh", async () => {
  let calls = 0;
  const api = client(async () => { calls++; return rejected(); });
  await assert.rejects(api.apiFetch("/words", schema), error => error.status === 401);
  await assert.rejects(api.apiFetch("/profile", schema, api.authenticatedRequest("fixture")), error => error.status === 401);
  assert.equal(calls, 2);
});

test("every protected client forwards the Clerk getter to shared recovery", async () => {
  const getToken = async () => "fixture";
  const api = client(() => { assert.fail("HTTP is stubbed by this contract test"); });
  const clients = {
    dashboard: "getDashboard", learning: "getProgress", preferences: "getPreferences",
    profile: "getProfile", reviews: "getReviews", vocabulary: "getVocabularyState",
  };
  for (const [name, method] of Object.entries(clients)) {
    const source = readFileSync(new URL(`../src/lib/api/${name}.ts`, import.meta.url), "utf8");
    const code = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const exports = {};
    const require = name => name === "zod" ? zod : name === "@/lib/languages" ? {
      learningLanguageCodes: ["om", "am", "ti"],
    } : {
      ...api,
      apiFetch: async (_path, _schema, init) => { assert.equal(init.getToken, getToken); return {}; },
    };
    new Function("require", "exports", code)(require, exports);
    await exports[method](getToken);
  }
});

test("expired-session page states offer sign-in while ordinary errors keep retry", () => {
  const api = client(() => { assert.fail("Rendering does not call HTTP"); });
  const source = readFileSync(new URL("../src/components/common-ui/PageState.tsx", import.meta.url), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {}, realRequire = createRequire(import.meta.url);
  new Function("require", "exports", code)(name => name === "@/lib/api" ? api : name.endsWith(".css") ? {} : realRequire(name), exports);
  const render = description => renderToStaticMarkup(React.createElement(exports.PageState, {
    kind: "error", title: "Couldn’t load reviews", description, actionLabel: "Try again", onAction() {},
  }));
  assert.match(render(api.SESSION_EXPIRED_MESSAGE), /href="\/sign-in"/);
  assert.match(render(api.SESSION_EXPIRED_MESSAGE), /Sign in again/);
  assert.doesNotMatch(render(api.SESSION_EXPIRED_MESSAGE), /Try again/);
  assert.match(render("Connection interrupted"), /Try again/);
  assert.doesNotMatch(render("Connection interrupted"), /href="\/sign-in"/);
});
