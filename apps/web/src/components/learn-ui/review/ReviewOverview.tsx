import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, LoaderCircle, Pause, Volume2 } from "lucide-react";
import { FidelTeacherMark } from "@/components/common-ui/FidelTeacherMark";
import { topicLabel } from "@/components/homepage-ui/labels";
import type { ReviewOverview as ReviewData } from "@/lib/api/reviews";
import "./review.css";
import type { ReactNode } from "react";

type Props = {
  data: ReviewData;
  onStart: () => void;
  isStarting?: boolean;
  error?: string | null;
  memoryCheck?: ReactNode;
};

export function ReviewHeader() {
  return <header className="review-heading"><h1>Review</h1><p>Bring familiar words back to mind.</p></header>;
}

function sessionDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date);
}

export function ReviewOverview({ data, onStart, isStarting = false, error, memoryCheck }: Props) {
  const [hideMeanings, setHideMeanings] = useState(false);
  const [showAllWords, setShowAllWords] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => () => { audio.current?.pause(); }, []);
  const active = data.active_session;
  const words = showAllWords ? data.queue : data.queue.slice(0, 6);
  const history = showAllHistory ? data.history : data.history.slice(0, 4);
  const answered = active?.answers.length ?? 0;
  const canStart = Boolean(active || data.queue.length);
  const categories = new Set(data.queue.map((word) => word.category)).size;

  function play(word: ReviewData["queue"][number]) {
    if (!word.audio_url) return;
    audio.current?.pause();
    if (playingId === word.id) {
      setPlayingId(null);
      return;
    }
    const player = new Audio(word.audio_url);
    audio.current = player;
    setAudioError(null);
    setPlayingId(word.id);
    player.onended = () => { if (audio.current === player) setPlayingId(null); };
    void player.play().catch(() => {
      if (audio.current !== player) return;
      setPlayingId(null);
      setAudioError("Couldn’t play " + word.text + ". Try listening again.");
    });
  }

  return <div className="fidel-review">
    <ReviewHeader />
    {memoryCheck}
    <section className="review-start-panel" aria-labelledby="review-start-title">
      <FidelTeacherMark className="review-teacher" />
      <div className="review-start-copy">
        <h2 id="review-start-title">{active ? "Pick up your review" : data.queue.length ? data.queue.length + (data.queue.length === 1 ? " word to reconnect with" : " words to reconnect with") : "A little room for new words"}</h2>
        <p>{active ? answered + " of " + active.total_count + " answered. Your place is saved." : data.queue.length ? "A short practice with words that need another look." : "No words are waiting for review. Keep learning and come back when you need a refresher."}</p>
        {active && <progress value={answered} max={active.total_count} aria-label="Saved review progress" />}
      </div>
      {canStart ? <button type="button" className="review-primary" disabled={isStarting} onClick={onStart}>{isStarting ? <LoaderCircle size={18} className="review-spinner" aria-hidden="true" /> : <ArrowRight size={18} aria-hidden="true" />}{active ? "Continue review" : "Start review"}{isStarting && <span className="sr-only" role="status">Preparing review</span>}</button> : <Link to="/Learn" className="review-primary">Explore lessons<ArrowRight size={18} aria-hidden="true" /></Link>}
    </section>
    {error && <p className="review-error" role="alert">{error}</p>}
    <div className="review-columns">
      <section className="review-queue" aria-labelledby="review-queue-title">
        <div className="review-section-heading"><div><h2 id="review-queue-title">Words to revisit</h2><p>{data.queue.length ? data.queue.length + " in the next review · " + categories + (categories === 1 ? " topic" : " topics") : "Your review queue is clear"}</p></div>{data.queue.length > 0 && <button type="button" className="review-text-button" aria-pressed={hideMeanings} onClick={() => setHideMeanings(!hideMeanings)}>{hideMeanings ? "Show meanings" : "Hide meanings"}</button>}</div>
        {audioError && <p className="review-error" role="alert">{audioError}</p>}
        {words.length ? <ul className="review-words">{words.map((word) => <li key={word.id}>
          <div className="review-word-identity"><h3>{word.text}</h3><span>{topicLabel(word.category)}</span></div>
          <div className="review-meanings">{hideMeanings ? <p className="review-recall-prompt">Can you remember it?</p> : <dl><div><dt>English</dt><dd>{word.meaning}</dd></div><div><dt>Amharic</dt><dd lang="am">{word.amharic ?? "Translation unavailable"}</dd></div></dl>}</div>
          <button type="button" className="review-listen" disabled={!word.audio_url} onClick={() => play(word)} aria-label={(playingId === word.id ? "Pause " : "Listen to ") + word.text} title={word.audio_url ? "Listen to pronunciation" : "Audio unavailable"}>{playingId === word.id ? <Pause size={18} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}</button>
        </li>)}</ul> : <div className="review-empty"><h3>Nothing to revisit right now.</h3><p>Words you mark for review in the Dictionary will appear here.</p><Link to="/dictionary" search={{ category: undefined }}>Find a word<ArrowRight size={16} aria-hidden="true" /></Link></div>}
        {data.queue.length > 6 && <button type="button" className="review-more" aria-expanded={showAllWords} onClick={() => setShowAllWords(!showAllWords)}>{showAllWords ? "Show fewer words" : "Show all " + data.queue.length + " words"}</button>}
      </section>
      <section className="review-history" aria-labelledby="review-history-title">
        <div className="review-section-heading"><div><h2 id="review-history-title">Recent practice</h2><p>Your latest completed sessions</p></div></div>
        {history.length ? <ul>{history.map((session) => <li key={session.id}><div><time dateTime={session.completed_at}>{sessionDate(session.completed_at)}</time><span>{session.total_count} {session.total_count === 1 ? "word" : "words"} practised</span></div><div className="review-result"><strong>{session.correct_count}/{session.total_count}</strong><span>{Math.round(session.correct_count / session.total_count * 100)}% correct</span></div></li>)}</ul> : <div className="review-history-empty"><p>Your first review goes here.</p><span>Finish a session to see how it went.</span></div>}
        {data.history.length > 4 && <button type="button" className="review-more" aria-expanded={showAllHistory} onClick={() => setShowAllHistory(!showAllHistory)}>{showAllHistory ? "Show fewer sessions" : "Show all recent sessions"}</button>}
      </section>
    </div>
  </div>;
}
