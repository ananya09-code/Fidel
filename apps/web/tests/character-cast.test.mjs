import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/character-cast.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exports = {};
new Function("exports", compiled)(exports);
const { characterFor, characterForQuest, characterForTopic, reviewCharacterFor } = exports;

test("all language casts have eight distinct, loadable pixel characters", () => {
  for (const language of ["om", "am", "ti"]) {
    const roles = ["coffee", "student", "techie", "grandmother", "peacemaker", "runner", "market", "child"];
    const members = roles.map((role) => characterFor(language, role));
    assert.equal(new Set(members.map((member) => member.id)).size, 8);
    for (const member of members) {
      assert.ok(member.name);
      const asset = new URL(`../public${member.image}`, import.meta.url);
      assert.ok(existsSync(asset), `${language}/${member.id} missing`);
      assert.match(readFileSync(asset, "utf8"), /viewBox="0 0 24 32"/);
    }
  }
});

test("quest cast stays tied to authored locations, with legacy fallback", () => {
  for (const language of ["om", "am", "ti"]) {
    assert.equal(characterForQuest(language, "intro", "guide").id, characterFor(language, "student").id);
    assert.equal(characterForQuest(language, "cafe", "host").id, characterFor(language, "coffee").id);
    assert.equal(characterForQuest(language, "neighbor", "guide").id, characterFor(language, "peacemaker").id);
    assert.equal(characterForQuest(language, "market", "host").id, characterFor(language, "market").id);
    assert.equal(characterForQuest(language, "family", "guide").id, characterFor(language, "grandmother").id);
    assert.equal(characterForQuest(language, "future", "host").id, characterFor(language, "coffee").id);
  }
});

test("review companion is stable on resume and topic companions have meaningful roles", () => {
  const words = ["word-1", "word-2", "word-3"];
  const first = reviewCharacterFor("om", words);
  assert.deepEqual(reviewCharacterFor("om", [...words]), first);
  assert.equal(characterForTopic("om", "food_and_drinks").id, characterFor("om", "coffee").id);
  assert.equal(characterForTopic("ti", "family").id, characterFor("ti", "grandmother").id);
});
