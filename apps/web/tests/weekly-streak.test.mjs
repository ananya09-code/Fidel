import assert from "node:assert/strict";
import { test } from "node:test";

import { studyWeek } from "../src/lib/weekly-streak.ts";

test("the week follows the API's learner-local day across a month boundary", () => {
  const week = studyWeek([
    { date: "2026-10-30", events: 2, minutes: 3 },
    { date: "2026-10-31", events: 0, minutes: 0 },
    { date: "2026-11-01", events: 1, minutes: 1 },
  ]);

  assert.deepEqual(week.map((day) => day.date), [
    "2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29",
    "2026-10-30", "2026-10-31", "2026-11-01",
  ]);
  assert.equal(week[4].state, "studied");
  assert.equal(week[5].state, "open");
  assert.equal(week[6].isToday, true);
  assert.equal(week[6].state, "studied");
});

test("future days remain upcoming and no activity stays honest", () => {
  const week = studyWeek([
    { date: "2026-11-16", events: 0, minutes: 0 },
    { date: "2026-11-17", events: 0, minutes: 0 },
  ]);
  assert.deepEqual(week.map((day) => day.state), ["open", "open", "upcoming", "upcoming", "upcoming", "upcoming", "upcoming"]);
  assert.equal(week[1].isToday, true);
  assert.deepEqual(studyWeek([]), []);
});

test("a completed session counts even without a same-day answer event", () => {
  const week = studyWeek([
    { date: "2026-11-16", events: 0, minutes: 1 },
    { date: "2026-11-17", events: 0, minutes: 0 },
  ]);
  assert.equal(week[0].state, "studied");
  assert.equal(week[1].state, "open");
});
