import { Link } from "@tanstack/react-router";
import { ArrowUpRight, LoaderCircle } from "lucide-react";
import type { SpacedReviewOverview } from "@/lib/api/reviews";
import "./memory-check.css";

type Props = { data?: SpacedReviewOverview; loading?: boolean; error?: string; onRetry?: () => void };

export function MemoryCheckView({ data, loading, error, onRetry }: Props) {
  const enoughWords = (data?.scheduled_count ?? 0) >= 2;
  const canStart = Boolean(data?.active_session || (data?.due_count && enoughWords));
  const next = data?.next_review_at ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(data.next_review_at)) : null;
  return <section className="memory-check" aria-label="Spaced repetition memory check">
    <div className="memory-check-copy">
      <h2>See what stays with you.</h2>
      <p>{loading ? <><LoaderCircle size={17} className="memory-spinner" aria-hidden="true" /><span role="status">Checking your next quiz</span></> : error ? <span role="alert">{error}</span> : data?.active_session ? "You have a saved review. Finish it before starting a new memory check." : !enoughWords ? "Learn at least two words. Your first memory check opens 3 days after learning." : data?.due_count ? `${data.due_count} ${data.due_count === 1 ? "word is" : "words are"} ready. Try a random mix of up to 10 words you’ve learned.` : next ? `All caught up. Your next words return ${next}.` : "Keep learning. Your words will return when it’s time."}</p>
      <ol className="memory-intervals" aria-label="Intervals after successful recall">
        {["3 days", "2 weeks", "1 month", "3 months", "6 months", "1 year"].map((label, i) => <li key={label}><span aria-hidden="true">{i === 0 ? "◈" : "·"}</span>{label}</li>)}
      </ol>
      <p className="memory-note">Correct recalls space words further apart. Missed words return after 1 day.</p>
    </div>
    {error ? <button type="button" className="memory-action" onClick={onRetry}>Try again</button> : canStart ? <Link to="/review" search={{ start: true, mode: "spaced" }} className="memory-action">{data?.active_session ? "Continue saved review" : "Start memory check"}<ArrowUpRight size={18} aria-hidden="true" /></Link> : !loading && <Link to="/Learn" className="memory-action memory-action-secondary">Keep learning<ArrowUpRight size={18} aria-hidden="true" /></Link>}
  </section>;
}
