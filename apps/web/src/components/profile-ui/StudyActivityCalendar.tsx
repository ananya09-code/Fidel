import { useLayoutEffect, useRef, useState } from "react";
import type { StudyActivity } from "@/lib/api/dashboard";
import { activityDateLabel, activityKeyboardDate, activityLevel, activityWeeks } from "@/lib/study-activity";
import "./study-activity.css";

const levels = ["No answers", "1–4 answers", "5–9 answers", "10–19 answers", "20+ answers"];

export function StudyActivityCalendar({ activity }: { activity: StudyActivity }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const [focusedDate, setFocusedDate] = useState(activity.end_date);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const weeks = activityWeeks(activity.days);
  const total = activity.days.reduce((sum, day) => sum + day.answers, 0);
  const activeDays = activity.days.filter(day => day.answers > 0).length;
  const selected = activity.days.find(day => day.date === selectedDate);

  useLayoutEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
  }, [activity.end_date]);

  function detail(date: string, answers: number) {
    return `${activityDateLabel(date)}: ${answers} practice ${answers === 1 ? "answer" : "answers"}`;
  }

  return <section aria-labelledby="study-activity-title" className="profile-activity study-weave">
    <div className="study-weave-intro">
      <div><h2 id="study-activity-title">A year in words.</h2><p>Each mark is a day you came back to practise.</p></div>
      <div className="study-weave-totals" aria-label="Your activity this year">
        <p><strong>{activeDays}</strong><span>active {activeDays === 1 ? "day" : "days"}</span></p>
        <p><strong>{total.toLocaleString("en-US")}</strong><span>practice {total === 1 ? "answer" : "answers"}</span></p>
      </div>
    </div>
    <div className="study-weave-chart-shell" role="group" aria-label="Daily practice activity. Use arrow keys to explore days.">
      <div aria-hidden="true" className="study-weave-weekdays"><span /><span /><span>Mon</span><span /><span>Wed</span><span /><span>Fri</span><span /></div>
      <div ref={scrollRef} className="study-weave-chart">
        <div className="study-weave-grid">
        <div className="study-weave-weeks">{weeks.map((week, index) => <div key={index} className="study-weave-week">
          <span aria-hidden="true" className="study-weave-month">{week.month}</span>
          {week.days.map((day, row) => day ? <button key={day.date}
            ref={element => { if (element) buttons.current.set(day.date, element); else buttons.current.delete(day.date); }}
            type="button" tabIndex={focusedDate === day.date ? 0 : -1}
            aria-label={detail(day.date, day.answers)} aria-pressed={selectedDate === day.date} title={detail(day.date, day.answers)}
            data-level={activityLevel(day.answers)} data-today={day.date === activity.end_date ? "true" : undefined}
            onFocus={() => { setFocusedDate(day.date); setSelectedDate(day.date); }}
            onClick={() => { setFocusedDate(day.date); setSelectedDate(day.date); }}
            onKeyDown={event => { const next = activityKeyboardDate(event.key, day.date, activity.start_date, activity.end_date); if (next) { event.preventDefault(); buttons.current.get(next)?.focus(); } }}
            className="study-weave-day"><span /></button> : <span key={`blank-${row}`} aria-hidden="true" />)}
        </div>)}</div>
        </div>
      </div>
    </div>
    <div className="study-weave-foot">
      <p className="study-weave-selected" aria-live="polite">{selected ? <><strong>{activityDateLabel(selected.date)}</strong><span>{selected.answers} practice {selected.answers === 1 ? "answer" : "answers"}</span></> : <><strong>Choose a day</strong><span>Swipe through the year, or use the arrow keys.</span></>}</p>
      <div className="study-weave-legend" aria-label="A fuller mark means more practice answers"><span>Fewer answers</span><div>{levels.map((label, level) => <span key={label} className="study-weave-swatch" data-level={level} title={label} aria-label={label} />)}</div><span>More answers</span></div>
    </div>
    <p className="study-weave-note">{total === 0 ? "Your first saved answer will start the pattern. " : "Saved lesson and review answers build this pattern. "}Dates use {activity.timezone.replaceAll("_", " ")} time.</p>
  </section>;
}
