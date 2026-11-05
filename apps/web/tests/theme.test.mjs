import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(path, environment = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const exports = {};
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  new Function("require", "exports", "window", "document", compiled)(require, exports, environment.window, environment.document);
  return exports;
}
const { parseAppearance, resolveTheme, themeInitScript } = load("../src/lib/theme.ts");
const { AppearancePicker } = load("../src/components/theme/AppearancePicker.tsx");

test("explicit themes override the device and System follows it", () => {
  assert.equal(resolveTheme("dark", false), "dark");
  assert.equal(resolveTheme("light", true), "light");
  assert.equal(resolveTheme("system", true), "dark");
  assert.equal(resolveTheme("system", false), "light");
  assert.equal(parseAppearance("system"), "system");
  for (const value of [null, "invalid", "SYSTEM", {}]) assert.equal(parseAppearance(value), "light");
});

test("pre-paint script applies the same theme with missing or blocked storage", () => {
  for (const systemDark of [false, true]) {
    for (const cached of [null, "light", "dark", "system", "corrupt", "blocked"]) {
      const applied = {};
      vm.runInNewContext(themeInitScript, {
        localStorage: { getItem() { if (cached === "blocked") throw new Error("blocked"); return cached; } },
        matchMedia: () => ({ matches: systemDark }),
        document: { documentElement: { classList: { toggle(name, enabled) { applied[name] = enabled; } }, style: applied } },
      });
      const expected = resolveTheme(parseAppearance(cached), systemDark);
      assert.equal(applied.dark, expected === "dark");
      assert.equal(applied.colorScheme, expected);
    }
  }
});

test("appearance choices are a labelled native radio group with one selected value", () => {
  for (const value of ["light", "dark", "system"]) {
    const html = renderToStaticMarkup(React.createElement(AppearancePicker, { value, onChange() {} }));
    assert.ok(html.includes("<legend"));
    assert.equal((html.match(/type="radio"/g) ?? []).length, 3);
    assert.equal((html.match(/checked=""/g) ?? []).length, 1);
    assert.ok(html.includes(`checked="" value="${value}"`) || html.includes(`value="${value}" checked=""`));
  }
});

test("device changes update System mode, respect explicit choices and clean up listeners", () => {
  const applied = {};
  let listener;
  const media = {
    matches: false,
    addEventListener(name, callback) { assert.equal(name, "change"); listener = callback; },
    removeEventListener(name, callback) { assert.equal(name, "change"); assert.equal(listener, callback); listener = undefined; },
  };
  const { watchTheme } = load("../src/lib/theme.ts", {
    window: { matchMedia: () => media },
    document: { documentElement: { classList: { toggle(name, enabled) { applied[name] = enabled; } }, style: applied } },
  });
  for (const appearance of ["system", "light", "dark"]) {
    const cleanup = watchTheme(appearance);
    for (const matches of [true, false]) {
      media.matches = matches;
      listener();
      assert.equal(applied.colorScheme, resolveTheme(appearance, matches));
      assert.equal(applied.dark, applied.colorScheme === "dark");
    }
    cleanup();
    assert.equal(listener, undefined);
  }
});
