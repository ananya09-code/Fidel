import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/study-activity.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exports = {};
new Function("exports", compiled)(exports);
const { activityLevel, activityWeeks, activityDateLabel, activityKeyboardDate } = exports;

test("every day occupies the correct Sunday-first row without inventing future days", () => {
  const days = Array.from({ length: 365 }, (_, offset) => {
    const date = new Date(Date.UTC(2025, 10, 4 + offset));
    return { date: date.toISOString().slice(0, 10), answers: offset % 20 };
  });
  const weeks = activityWeeks(days);
  assert.deepEqual(weeks.flatMap(week => week.days).filter(Boolean), days);
  for (const week of weeks) {
    assert.equal(week.days.length, 7);
    week.days.forEach((day, row) => {
      if (day) assert.equal(new Date(day.date + "T00:00:00Z").getUTCDay(), row);
    });
  }
  assert.ok(weeks.length >= 53 && weeks.length <= 54);
});

test("intensities change only at the documented answer thresholds", () => {
  assert.deepEqual([0, 1, 4, 5, 9, 10, 19, 20, 100].map(activityLevel), [0, 1, 1, 2, 2, 3, 3, 4, 4]);
});

test("date labels retain the server's calendar day, including leap day", () => {
  assert.equal(activityDateLabel("2024-02-29"), "February 29, 2024");
  assert.equal(activityDateLabel("2026-01-01"), "January 1, 2026");
});

test("keyboard navigation moves by day/week and clamps at the visible range", () => {
  const start = "2026-01-01", end = "2026-01-31";
  assert.equal(activityKeyboardDate("ArrowRight", "2026-01-01", start, end), "2026-01-08");
  assert.equal(activityKeyboardDate("ArrowUp", start, start, end), start);
  assert.equal(activityKeyboardDate("ArrowDown", end, start, end), end);
  assert.equal(activityKeyboardDate("Home", "2026-01-07", start, end), "2026-01-04");
  assert.equal(activityKeyboardDate("End", "2026-01-07", start, end), "2026-01-10");
  assert.equal(activityKeyboardDate("Tab", end, start, end), null);
});
