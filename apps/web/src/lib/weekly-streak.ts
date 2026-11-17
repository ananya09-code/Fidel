import type { DashboardSummary } from "@/lib/api/dashboard";

type ActivityDay = DashboardSummary["weekly_activity"][number];

export type StudyWeekDay = {
  date: string;
  label: string;
  fullLabel: string;
  state: "studied" | "open" | "upcoming";
  isToday: boolean;
};

/** Use the API's learner-local today, not the browser's possibly different timezone. */
export function studyWeek(activity: ActivityDay[]): StudyWeekDay[] {
  const todayDate = activity.at(-1)?.date;
  if (!todayDate || !/^\d{4}-\d{2}-\d{2}$/.test(todayDate)) return [];

  const today = new Date(`${todayDate}T00:00:00Z`);
  if (Number.isNaN(today.getTime())) return [];

  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() - ((today.getUTCDay() + 6) % 7));
  const activityByDate = new Map(activity.map((day) => [day.date, day.events > 0 || day.minutes > 0]));
  const formatter = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" });
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return labels.map((label, index) => {
    const day = new Date(monday);
    day.setUTCDate(monday.getUTCDate() + index);
    const date = day.toISOString().slice(0, 10);
    return {
      date,
      label,
      fullLabel: `${label}, ${formatter.format(day)}`,
      state: date > todayDate ? "upcoming" : activityByDate.get(date) ? "studied" : "open",
      isToday: date === todayDate,
    };
  });
}
