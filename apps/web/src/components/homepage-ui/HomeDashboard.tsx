import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { DashboardSummary } from "@/lib/api/dashboard";
import { topicLabel } from "./labels";
import "./home.css";

type Props = {
  data: DashboardSummary;
  languageCode: "om" | "am";
  topics: ReactNode;
  dailyWord: ReactNode;
};

/** Presentation only: all learner figures come from the authenticated dashboard. */
export function HomeDashboard({ data, languageCode, topics, dailyWord }: Props) {
  const language = languageCode === "am" ? "Amharic" : "Afaan Oromoo";
  const remaining = Math.max(0, data.daily_word_goal - data.words_learned_today);
  const current = data.current_lesson;
  const lessonTotal = current?.question_count ?? 0;
  const lessonDone = Math.min(lessonTotal, current?.question_index ?? 0);
  const goalPercent = Math.min(100, data.words_learned_today / data.daily_word_goal * 100);

  return (
    <div className="fidel-home">
      <header className="home-title">
        <div>
          <h1>{languageCode === "am" ? "ሰላም" : "Akkam"}. A little more, every day.</h1>
          <p>{language} <span aria-hidden="true">·</span> {remaining > 0 ? `${remaining} more ${remaining === 1 ? "word" : "words"} to reach today’s goal.` : "Today’s word goal is complete."}</p>
        </div>
        <Link to="/settings" className="home-text-link">Your learning settings <ArrowRight size={15} aria-hidden="true" /></Link>
      </header>

      <section className="home-summary" aria-label="Your learning progress">
        <div className="home-goal">
          <h2>Today’s word goal</h2>
          <p className="home-goal-value">{data.words_learned_today.toLocaleString()} <span>/ {data.daily_word_goal} words</span></p>
          <div className="home-track" role="progressbar" aria-label="Daily word goal" aria-valuemin={0} aria-valuemax={data.daily_word_goal} aria-valuenow={Math.min(data.words_learned_today, data.daily_word_goal)}>
            <span style={{ width: `${goalPercent}%` }} />
          </div>
        </div>
        {[
          ["Words learned", data.learned_words, "In your vocabulary"],
          ["Lessons completed", data.lessons_completed, "From your learning path"],
          ["Current streak", data.streak_days, data.streak_days === 1 ? "Day of learning" : "Days of learning"],
        ].map(([label, value, caption]) => (
          <div className="home-stat" key={label}>
            <h2>{label}</h2><p>{value.toLocaleString()}</p><span>{caption}</span>
          </div>
        ))}
      </section>

      <div className="home-main-grid">
        <section className="home-next home-panel">
          <div className="home-section-heading"><h2>Your next lesson</h2><Link to="/Learn" className="home-text-link">Learning path <ArrowRight size={15} aria-hidden="true" /></Link></div>
          <div className="home-lesson-body">
            <h3>{current ? topicLabel(current.title) : "Start with a few words"}</h3>
            <p>{current ? current.stage === "practice" ? "Put the words you’ve learned into practice." : "Pick up where you left off." : "Choose a topic on your path and begin learning."}</p>
          </div>
          {current && (
            <div className="home-lesson-progress">
              <div><span>Session progress</span><span>{lessonDone} / {lessonTotal} cards</span></div>
              <div className="home-track" role="progressbar" aria-label="Lesson session progress" aria-valuemin={0} aria-valuemax={lessonTotal || 1} aria-valuenow={lessonDone}><span style={{ width: `${lessonTotal ? lessonDone / lessonTotal * 100 : 0}%` }} /></div>
            </div>
          )}
          <div className="home-lesson-actions">
            {current ? <Link className="home-primary" to="/Learn/$lessonId" params={{ lessonId: current.lesson_key }} search={{ language_code: languageCode }}>Continue lesson <ArrowRight size={17} aria-hidden="true" /></Link> : <Link className="home-primary" to="/Learn">Start learning <ArrowRight size={17} aria-hidden="true" /></Link>}
            <Link to="/review" search={{ start: false }} className="home-review-link"><span>Review your words</span><span>{data.needs_review_words} to review <ArrowRight size={15} aria-hidden="true" /></span></Link>
          </div>
        </section>
        <div className="home-word-panel home-panel">{dailyWord}</div>
      </div>

      <div className="home-bottom-grid">
        <div className="home-panel">{topics}</div>
        <section className="home-panel home-history">
          <div className="home-section-heading"><h2>Recent learning</h2><Link to="/profile" className="home-text-link">Your activity <ArrowRight size={15} aria-hidden="true" /></Link></div>
          {data.recent_activity.length ? <ul>{data.recent_activity.slice(0, 3).map((activity, index) => (
            <li key={`${activity.occurred_at}-${index}`}>
              <div><h3>{topicLabel(activity.title)}</h3><p>{activity.kind === "lesson" ? "Lesson" : "Review"} <span aria-hidden="true">·</span> <time dateTime={activity.occurred_at}>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(activity.occurred_at))}</time></p></div>
              <span className="home-result">{activity.correct_count} / {activity.total_count}<small>correct</small></span>
            </li>
          ))}</ul> : <p className="home-empty">Your completed lessons and reviews will appear here. Start a lesson to make your first entry.</p>}
        </section>
      </div>
    </div>
  );
}
