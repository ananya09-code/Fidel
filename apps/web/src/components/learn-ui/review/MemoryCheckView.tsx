import { Link } from "@tanstack/react-router";
import { ArrowRight, LoaderCircle } from "lucide-react";
import type { SpacedReviewOverview } from "@/lib/api/reviews";
import "./memory-check.css";

type Props = { data?: SpacedReviewOverview; loading?: boolean; error?: string; onRetry?: () => void };

export function MemoryCheckView({ data, loading, error, onRetry }: Props) {
  const enoughWords = (data?.scheduled_count ?? 0) >= 2;
  const active = data?.active_session;
  const canStart = Boolean(active || (data?.due_count && enoughWords));
  const next = data?.next_review_at ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(data.next_review_at)) : null;
  const questionCount = active ? Math.max(0, active.total_count - active.answers.length) : Math.min(10, data?.due_count ?? 0);
  return <section className="memory-check" aria-label="Vocabulary quiz">
    <div className="memory-check-copy">
      <h2>Quiz yourself.</h2>
      <p>{loading ? <><LoaderCircle size={17} className="memory-spinner" aria-hidden="true" /><span role="status">Preparing your quiz</span></> : error ? <span role="alert">{error}</span> : active ? `${active.answers.length} of ${active.total_count} answered. Pick up your saved quiz.` : !enoughWords ? "Learn at least two words. Your first quiz opens 3 days after learning." : data?.due_count ? "How much do you remember? Test yourself with a random mix of words you’ve learned." : next ? `You’re all caught up. Your next quiz opens ${next}.` : "Keep learning. A new quiz will appear when your words are ready."}</p>
      <p className="memory-format">Multiple choice <span aria-hidden="true">·</span> Saved as you go</p>
      <details className="memory-schedule"><summary>When do I get a quiz?</summary><p>Words return after 3 days, then 2 weeks, 1 month, 3 months, 6 months and 1 year as you remember them. Missed words return after 1 day.</p></details>
    </div>
    <div className="memory-quiz-action">
      {!loading && !error && <p className="memory-question-count"><strong>{questionCount}</strong><span>{questionCount === 1 ? "question" : "questions"} {active ? "left" : "ready"}</span></p>}
      {active && <progress className="memory-saved-progress" value={active.answers.length} max={active.total_count} aria-label="Saved quiz progress" />}
      {error ? <button type="button" className="memory-action" onClick={onRetry}>Try again</button> : canStart ? <Link to="/review" search={{ start: true, mode: "spaced" }} className="memory-action">{active ? "Continue quiz" : "Start quiz"}<ArrowRight size={18} aria-hidden="true" /></Link> : !loading && <Link to="/Learn" className="memory-action memory-action-secondary">Learn more words<ArrowRight size={18} aria-hidden="true" /></Link>}
    </div>
  </section>;
}
