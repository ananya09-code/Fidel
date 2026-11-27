import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import type { DashboardSummary } from "@/lib/api/dashboard";
import { studyWeek } from "@/lib/weekly-streak";
import { NoelAside } from "@/components/onboarding/NoelAside";

export function WeeklyStreak({ streakDays, activity }: {
  streakDays: number;
  activity: DashboardSummary["weekly_activity"];
}) {
  const week = studyWeek(activity);
  const milestone = [3, 7, 14, 30, 100].includes(streakDays) && week.some((day) => day.isToday && day.state === "studied");

  return <div className="home-streak">
    <div className="home-streak-heading">
      <h2>Study streak</h2>
      <Link to="/profile" className="home-streak-link" aria-label="View your full study activity">Year view <ArrowRight size={14} aria-hidden="true" /></Link>
    </div>
    <p className="home-streak-value"><span>{streakDays.toLocaleString()}</span> {streakDays === 1 ? "day" : "days"}</p>
    {week.length > 0 && <ol className="home-streak-week" aria-label="This week’s study activity">
      {week.map((day) => <li key={day.date} className={`home-streak-day home-streak-day--${day.state}${day.isToday ? " home-streak-day--today" : ""}`} aria-label={`${day.fullLabel}: ${day.state === "studied" ? "studied" : day.state === "upcoming" ? "upcoming" : day.isToday ? "ready to study" : "no study recorded"}`}>
        <span aria-hidden="true">{day.label}</span><span className="home-streak-mark" aria-hidden="true" />
      </li>)}
    </ol>}
    <p className="home-streak-caption">A day counts when you practise or learn.</p>
    {milestone && <NoelAside step={5} className="home-streak-noel">{streakDays} days in a row. See you for another word tomorrow.</NoelAside>}
  </div>;
}
