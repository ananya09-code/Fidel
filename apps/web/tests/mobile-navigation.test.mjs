import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const realRequire = createRequire(import.meta.url);
const source = readFileSync(new URL("../src/components/common-ui/MobileBottomNavigation.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function render(pathname) {
  const exports = {};
  const require = (name) => name === "@tanstack/react-router" ? {
    useRouterState: ({ select }) => select({ location: { pathname } }),
    Link: ({ to, ...props }) => React.createElement("a", { href: to, ...props }),
  } : realRequire(name);
  new Function("require", "exports", compiled)(require, exports);
  return renderToStaticMarkup(React.createElement(exports.MobileBottomNavigation));
}

test("mobile navigation includes five named destinations and safe-area padding", () => {
  const html = render("/Home");
  assert.equal((html.match(/<a /g) ?? []).length, 5);
  for (const path of ["/Home", "/Learn", "/review", "/dictionary", "/profile"]) {
    assert.ok(html.includes(`href="${path}"`));
  }
  assert.ok(html.includes('aria-label="Mobile navigation"'));
  assert.ok(html.includes("md:hidden"));
  assert.ok(html.includes("safe-area-inset-bottom"));
});

test("nested lessons highlight Learn and matching is case-insensitive", () => {
  for (const path of ["/Learn/om-beginner-greetings", "/learn/", "/LEARN"]) {
    const html = render(path);
    assert.match(html, /href="\/Learn" aria-current="page"/);
    assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1);
  }
});

test("route prefixes do not falsely select a tab", () => {
  assert.ok(!render("/learner").includes('aria-current="page"'));
  assert.ok(!render("/settings").includes('aria-current="page"'));
});
