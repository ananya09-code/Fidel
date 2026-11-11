import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const publicRoot = new URL("../public/", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("manifest.webmanifest", publicRoot), "utf8"));

test("installed Fidel opens the online learning app", () => {
  assert.equal(manifest.name, "Fidel — Learn Ethiopian languages");
  assert.equal(manifest.start_url, "/Home");
  assert.equal(manifest.scope, "/");
  assert.equal(manifest.display, "standalone");
});

test("manifest icons exist at their declared PNG sizes", async () => {
  for (const icon of manifest.icons) {
    const data = await readFile(new URL(icon.src.slice(1), publicRoot));
    assert.equal(data.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    const [width, height] = icon.sizes.split("x").map(Number);
    assert.equal(data.readUInt32BE(16), width);
    assert.equal(data.readUInt32BE(20), height);
  }
  const appleIcon = await readFile(new URL("fidel-icon-180.png", publicRoot));
  assert.equal(appleIcon.readUInt32BE(16), 180);
  assert.equal(appleIcon.readUInt32BE(20), 180);
});
