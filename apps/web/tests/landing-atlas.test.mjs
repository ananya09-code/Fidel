import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const map = JSON.parse(readFileSync(new URL("../src/components/landing-ui/map-data.json",import.meta.url),"utf8"));
const content = {};
new Function("exports",ts.transpileModule(readFileSync(new URL("../src/components/landing-ui/content.ts",import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(content);

test("the atlas covers all twelve regions and both city administrations",()=>{
  const expected=["ET01","ET02","ET03","ET04","ET05","ET06","ET07","ET08","ET11","ET12","ET13","ET14","ET15","ET16"];
  assert.deepEqual(map.regions.map(r=>r.id).sort(),expected);
  assert.deepEqual(content.regions.map(r=>r.id).sort(),expected);
  for(const shape of map.regions){
    assert.ok(shape.path.startsWith("M"));
    assert.ok(!/NaN|Infinity|undefined/.test(shape.path));
    assert.equal(shape.center.length,2);
    assert.ok(shape.center.every(Number.isFinite));
    const region=content.regions.find(r=>r.id===shape.id);
    assert.ok(region.languages.length>0);
    assert.ok(content.greetings[region.sample]);
  }
});
