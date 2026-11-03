import type { StudyActivityDay } from "@/lib/api/dashboard";

export function activityDate(key: string) {
  // Keys already represent the learner's local day. Never convert them again.
  return new Date(`${key}T00:00:00Z`);
}

export function activityDateLabel(key: string) {
  return activityDate(key).toLocaleDateString("en-US", {
    timeZone: "UTC", month: "long", day: "numeric", year: "numeric",
  });
}

export function activityLevel(answers: number) {
  if (answers === 0) return 0;
  if (answers < 5) return 1;
  if (answers < 10) return 2;
  if (answers < 20) return 3;
  return 4;
}

export function activityWeeks(days: StudyActivityDay[]) {
  const padded: (StudyActivityDay | null)[] = [];
  if (days.length) {
    padded.push(...Array<null>(activityDate(days[0].date).getUTCDay()).fill(null));
    padded.push(...days);
    while (padded.length % 7) padded.push(null);
  }
  const weeks = [];
  let lastLabelColumn = -4;
  for (let index = 0; index < padded.length; index += 7) {
    const week = padded.slice(index, index + 7);
    const monthStart = week.find((day) => day && activityDate(day.date).getUTCDate() === 1);
    let month = "";
    if (monthStart && index / 7 - lastLabelColumn >= 3) {
      month = activityDate(monthStart.date).toLocaleDateString("en-US", { timeZone: "UTC", month: "short" });
      lastLabelColumn = index / 7;
    }
    weeks.push({ days: week, month });
  }
  return weeks;
}

export function activityKeyboardDate(key: string, date: string, start: string, end: string) {
  const offsets: Record<string, number> = {
    ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7,
    Home: -activityDate(date).getUTCDay(), End: 6 - activityDate(date).getUTCDay(),
  };
  if (!Object.hasOwn(offsets, key)) return null;
  const next = activityDate(date);
  next.setUTCDate(next.getUTCDate() + offsets[key]);
  const nextKey = next.toISOString().slice(0, 10);
  return nextKey < start ? start : nextKey > end ? end : nextKey;
}
