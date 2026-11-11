import { useLayoutEffect, useRef, useState } from "react";
import type { StudyActivity, StudyActivityDay } from "@/lib/api/dashboard";
import { activityDateLabel, activityKeyboardDate, activityLevel, activityRangeStart, activityWeeks } from "@/lib/study-activity";
import type { ActivityRange } from "@/lib/study-activity";
import "./study-activity.css";

const levels = ["No answers", "1–4 answers", "5–9 answers", "10–19 answers", "20+ answers"];
const ranges: { value: ActivityRange; label: string; shortLabel: string }[] = [
  { value: "7d", label: "7 days", shortLabel: "7d" },
  { value: "30d", label: "30 days", shortLabel: "30d" },
  { value: "3m", label: "3 months", shortLabel: "3mo" },
  { value: "6m", label: "6 months", shortLabel: "6mo" },
  { value: "1y", label: "1 year", shortLabel: "1yr" },
];

export function StudyActivityCalendar({ activity }: { activity: StudyActivity }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const [range, setRange] = useState<ActivityRange>("30d");
  const [focusedDate, setFocusedDate] = useState(activity.end_date);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const startDate = activityRangeStart(activity.end_date, range, activity.start_date);
  const visibleDays = activity.days.filter(day => day.date >= startDate && day.date <= activity.end_date);
  const weeks = activityWeeks(visibleDays);
  const total = visibleDays.reduce((sum, day) => sum + day.answers, 0);
  const activeDays = visibleDays.filter(day => day.answers > 0).length;
  const selected = visibleDays.find(day => day.date === selectedDate);

  useLayoutEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
  }, [activity.end_date, range]);

  function chooseRange(next: ActivityRange) {
    setRange(next);
    setFocusedDate(activity.end_date);
    setSelectedDate(null);
  }

  function detail(date: string, answers: number) {
    return `${activityDateLabel(date)}: ${answers} practice ${answers === 1 ? "answer" : "answers"}`;
  }

  function renderDay(day: StudyActivityDay | null, row: number) {
    if (!day) return <span key={`blank-${row}`} aria-hidden="true" />;
    return <button key={day.date}
      ref={element => { if (element) buttons.current.set(day.date, element); else buttons.current.delete(day.date); }}
      type="button" tabIndex={focusedDate === day.date ? 0 : -1}
      aria-label={detail(day.date, day.answers)} aria-pressed={selectedDate === day.date} title={detail(day.date, day.answers)}
      data-level={activityLevel(day.answers)} data-today={day.date === activity.end_date ? "true" : undefined}
      onFocus={() => { setFocusedDate(day.date); setSelectedDate(day.date); }}
      onClick={() => { setFocusedDate(day.date); setSelectedDate(day.date); }}
      onKeyDown={event => { const next = activityKeyboardDate(event.key, day.date, startDate, activity.end_date); if (next) { event.preventDefault(); buttons.current.get(next)?.focus(); } }}
      className="study-weave-day"><span /></button>;
  }

  return <section aria-labelledby="study-activity-title" className="profile-activity study-weave">
    <div className="study-weave-intro">
      <div><h2 id="study-activity-title">Your practice pattern.</h2><p>Each mark is a day you came back to practise.</p></div>
      <div className="study-weave-totals" aria-label="Your activity in the selected period">
        <p><strong>{activeDays}</strong><span>active {activeDays === 1 ? "day" : "days"}</span></p>
        <p><strong>{total.toLocaleString("en-US")}</strong><span>practice {total === 1 ? "answer" : "answers"}</span></p>
      </div>
    </div>
    <div className="study-weave-range-row">
      <div className="study-weave-ranges" role="group" aria-label="Activity period">
        {ranges.map(option => <button key={option.value} type="button" aria-label={option.label}
          aria-pressed={range === option.value} onClick={() => chooseRange(option.value)}>
          <span className="study-weave-range-full">{option.label}</span><span className="study-weave-range-short">{option.shortLabel}</span>
        </button>)}
      </div>
      <span className="study-weave-date-span">{activityDateLabel(startDate)} – {activityDateLabel(activity.end_date)}</span>
    </div>
    {range === "7d" || range === "30d" ?
      <div className="study-weave-short" role="group" aria-label="Daily practice activity. Use arrow keys to explore days.">
        <div aria-hidden="true" className="study-weave-short-weekdays">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(name => <span key={name}>{name}</span>)}</div>
        {weeks.map((week, index) => <div key={index} className="study-weave-short-week">{week.days.map(renderDay)}</div>)}
      </div> :
      <div className="study-weave-chart-shell" role="group" aria-label="Daily practice activity. Use arrow keys to explore days.">
        <div aria-hidden="true" className="study-weave-weekdays"><span /><span /><span>Mon</span><span /><span>Wed</span><span /><span>Fri</span><span /></div>
        <div ref={scrollRef} className="study-weave-chart">
          <div className="study-weave-grid"><div className="study-weave-weeks">
            {weeks.map((week, index) => <div key={index} className="study-weave-week">
              <span aria-hidden="true" className="study-weave-month">{week.month}</span>
              {week.days.map(renderDay)}
            </div>)}
          </div></div>
        </div>
      </div>}
    <div className="study-weave-foot">
      <p className="study-weave-selected" aria-live="polite">{selected ? <><strong>{activityDateLabel(selected.date)}</strong><span>{selected.answers} practice {selected.answers === 1 ? "answer" : "answers"}</span></> : <><strong>Choose a day</strong><span>Tap a mark, or use the arrow keys.</span></>}</p>
      <div className="study-weave-legend" aria-label="A fuller mark means more practice answers"><span>Fewer answers</span><div>{levels.map((label, level) => <span key={label} className="study-weave-swatch" data-level={level} title={label} aria-label={label} />)}</div><span>More answers</span></div>
    </div>
    <p className="study-weave-note">{total === 0 ? "Your first saved answer will start the pattern. " : "Saved lesson and review answers build this pattern. "}Dates use {activity.timezone.replaceAll("_", " ")} time.</p>
  </section>;
}
