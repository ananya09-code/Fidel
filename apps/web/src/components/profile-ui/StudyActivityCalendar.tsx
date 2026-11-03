import { useLayoutEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";

import type { StudyActivity } from "@/lib/api/dashboard";
import { activityDateLabel, activityKeyboardDate, activityLevel, activityWeeks } from "@/lib/study-activity";

const colors = Array.from({ length: 5 }, (_, index) => `var(--activity-${index})`);
const intensityLabels = ["No answers", "1–4 answers", "5–9 answers", "10–19 answers", "20+ answers"];

export function StudyActivityCalendar({ activity }: { activity: StudyActivity }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const [focusedDate, setFocusedDate] = useState(activity.end_date);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const weeks = activityWeeks(activity.days);
  const total = activity.days.reduce((sum, day) => sum + day.answers, 0);
  const activeDays = activity.days.filter((day) => day.answers > 0).length;
  const selected = activity.days.find((day) => day.date === selectedDate);

  useLayoutEffect(() => {
    // On phones show the most recent weeks first, without scrolling the page.
    if (scrollRef.current) scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
  }, [activity.end_date]);

  function detail(date: string, answers: number) {
    return `${activityDateLabel(date)}: ${answers} practice ${answers === 1 ? "answer" : "answers"}`;
  }

  return (
    <section aria-labelledby="study-activity-title" className="min-w-0 rounded-3xl border border-[var(--sea-ink)]/10 bg-[var(--bg-base)] p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[var(--sea-ink)]">
            <CalendarDays className="size-5" aria-hidden="true" />
            <h2 id="study-activity-title" className="font-semibold">Your study activity</h2>
          </div>
          <p className="mt-2 text-sm text-[var(--sea-ink)]/60">
            {total.toLocaleString("en-US")} practice {total === 1 ? "answer" : "answers"} in the last year
          </p>
        </div>
        <span className="rounded-full bg-[var(--sand)]/60 px-3 py-1.5 text-xs font-medium text-[var(--sea-ink)]">
          {activeDays} active {activeDays === 1 ? "day" : "days"}
        </span>
      </div>

      <div ref={scrollRef} className="mt-6 overflow-x-auto pb-3" role="group" aria-label="Daily practice activity. Use arrow keys to explore days.">
        <div className="flex min-w-max gap-3 p-1">
          <div aria-hidden="true" className="sticky left-0 z-10 grid shrink-0 grid-rows-[20px_repeat(7,12px)] gap-[3px] bg-[var(--bg-base)] pr-2 text-[10px] leading-3 text-[var(--sea-ink)]/55">
            <span /><span /><span>Mon</span><span /><span>Wed</span><span /><span>Fri</span><span />
          </div>
          <div className="flex gap-[3px]">
            {weeks.map((week, index) => (
              <div key={index} className="grid w-3 grid-rows-[20px_repeat(7,12px)] gap-[3px]">
                <span aria-hidden="true" className="text-[10px] leading-4 text-[var(--sea-ink)]/55">{week.month}</span>
                {week.days.map((day, row) => day ? (
                  <button
                    key={day.date}
                    ref={(element) => { if (element) buttons.current.set(day.date, element); else buttons.current.delete(day.date); }}
                    type="button"
                    tabIndex={focusedDate === day.date ? 0 : -1}
                    aria-label={detail(day.date, day.answers)}
                    aria-pressed={selectedDate === day.date}
                    title={detail(day.date, day.answers)}
                    onFocus={() => { setFocusedDate(day.date); setSelectedDate(day.date); }}
                    onClick={() => { setFocusedDate(day.date); setSelectedDate(day.date); }}
                    onKeyDown={(event) => {
                      const next = activityKeyboardDate(event.key, day.date, activity.start_date, activity.end_date);
                      if (next) { event.preventDefault(); buttons.current.get(next)?.focus(); }
                    }}
                    className={`size-3 rounded-[3px] border border-[var(--sea-ink)]/5 outline-offset-2 transition-[filter] hover:brightness-90 focus-visible:outline-2 focus-visible:outline-[var(--sea-ink)] ${day.date === activity.end_date ? "ring-1 ring-[var(--sea-ink)]/40 ring-offset-1 ring-offset-[var(--bg-base)]" : ""}`}
                    style={{ backgroundColor: colors[activityLevel(day.answers)] }}
                  />
                ) : <span key={`blank-${row}`} aria-hidden="true" />)}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--sea-ink)]/60">
        <p aria-live="polite" className="min-h-4">
          {selected ? detail(selected.date, selected.answers) : "Tap a square or use the arrow keys to explore."}
        </p>
        <div className="flex items-center gap-1.5" aria-label="Darker green means more practice answers">
          <span className="mr-1">Less</span>
          {colors.map((color, index) => <span key={color} title={intensityLabels[index]} className="size-3 rounded-[3px] border border-[var(--sea-ink)]/5" style={{ backgroundColor: color }} />)}
          <span className="ml-1">More</span>
        </div>
      </div>
      <p className="mt-4 border-t border-[var(--sea-ink)]/10 pt-4 text-xs leading-5 text-[var(--sea-ink)]/55">
        {total === 0 ? "Your first practice answer will light up this calendar. " : "Every saved lesson or review answer counts, even when you’re still practising. "}
        Dates use {activity.timezone.replaceAll("_", " ")} time.
      </p>
    </section>
  );
}
