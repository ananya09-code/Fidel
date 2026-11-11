import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, Pause, RotateCcw, Volume2 } from "lucide-react";
import { FidelTeacherMark } from "@/components/common-ui/FidelTeacherMark";
import { getWords } from "@/lib/api/words";
import "./lesson-preview.css";

const steps = ["Learn", "Practise", "Review"] as const;
const words = [
  { text: "Galatoomi", english: "Thank you", amharic: "አመሰግናለሁ" },
  { text: "Buna", english: "Coffee", amharic: "ቡና" },
];

/** A deliberately unsaved sample, separate from authenticated lesson progress. */
export function LessonPreview() {
  const [active, setActive] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [feedback, setFeedback] = useState("Pick a word, then its meaning.");
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const player = useRef<HTMLAudioElement | null>(null);
  const [loadAudio, setLoadAudio] = useState(false);
  const recording = useQuery({
    queryKey: ["words", "landing-greeting"],
    queryFn: ({ signal }) => getWords({ language_code: "om", search: "Galatoomi", page_size: 10 }, signal),
    enabled: loadAudio,
    staleTime: 60 * 60_000,
    retry: false,
  });
  const audioUrl = recording.data?.data.find(word => word.text.toLowerCase() === "galatoomi" && word.audio.available)?.audio.url;

  useEffect(() => () => { player.current?.pause(); }, []);

  async function listen() {
    setLoadAudio(true);
    if (!audioUrl) return;
    if (playing) { player.current?.pause(); setPlaying(false); return; }
    let audio = player.current;
    if (!audio) {
      audio = new Audio(audioUrl);
      audio.addEventListener("ended", () => setPlaying(false));
      audio.addEventListener("pause", () => setPlaying(false));
      player.current = audio;
    }
    setAudioError(false);
    try { await audio.play(); setPlaying(true); } catch { setAudioError(true); setPlaying(false); }
  }

  function match(index: number) {
    if (selected === null) { setFeedback("Choose an Afaan Oromoo word first."); return; }
    if (selected !== index) { setFeedback("Almost. Try the other meaning."); return; }
    const next = [...matched, index];
    setMatched(next);
    setSelected(null);
    setFeedback(next.length === 2 ? "Two little words. Two new connections." : "That’s a match. One more to go.");
  }

  function reset() {
    setActive(0); setFlipped(false); setSelected(null); setMatched([]);
    setFeedback("Pick a word, then its meaning."); setRevealed(false); setReviewed(false);
    player.current?.pause(); setPlaying(false);
  }

  return <section id="practice" className="editorial-section lesson-preview" aria-labelledby="practice-heading">
    <div className="editorial-section-intro">
      <h2 id="practice-heading">Learn it, say it,<br />keep it.</h2>
      <div><p>A small thank-you goes a long way.<br />Try taking one through Fidel.</p><p className="lesson-preview-note">Sample lesson · your progress isn’t saved here.</p></div>
    </div>
    <div className="lesson-preview-nav" role="group" aria-label="Explore the sample lesson">
      {steps.map((step, index) => <button key={step} type="button" aria-pressed={active === index} onClick={() => setActive(index)}>{step}<ArrowRight size={18} aria-hidden="true" /></button>)}
      <button type="button" className="lesson-preview-reset" aria-label="Restart sample lesson" onClick={reset}><RotateCcw size={18} aria-hidden="true" /></button>
    </div>
    <div className="lesson-preview-spread" data-ui="Sample Fidel lesson">
      <article className={`lesson-preview-panel preview-learn ${active === 0 ? "is-active" : ""}`} aria-labelledby="preview-learn-title">
        <div className="preview-panel-heading"><h3 id="preview-learn-title">Meet your first word.</h3><span>Afaan Oromoo</span></div>
        <button className={`preview-flashcard ${flipped ? "is-flipped" : ""}`} type="button" onClick={() => setFlipped(value => !value)} aria-label={flipped ? "Show Galatoomi" : "Flip Galatoomi to see its meaning"} aria-pressed={flipped}>
          <span className="preview-card-inner">
            <span className="preview-card-face"><span lang="om" className="preview-large-word">Galatoomi</span><span>Ga-la-too-mi</span><span className="preview-card-hint">Tap to turn it over <RotateCcw size={15} aria-hidden="true" /></span></span>
            <span className="preview-card-face preview-card-back"><span className="preview-large-word">Thank you</span><span lang="am">አመሰግናለሁ</span><span className="preview-card-hint">A conversation starts here.</span></span>
          </span>
        </button>
        <div className="preview-audio-row"><button type="button" onClick={() => void listen()} disabled={loadAudio && !audioUrl && (recording.isFetching || recording.isFetched)}>{playing ? <Pause size={18} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}{playing ? "Pause" : audioUrl ? "Listen" : loadAudio ? recording.isFetching ? "Finding audio…" : "Audio unavailable" : "Find native audio"}</button><span>{audioError ? "Audio couldn’t play. Try again." : "Hear it. Then make it yours."}</span></div>
        <button type="button" className="preview-mobile-next" onClick={() => setActive(1)}>Try a match <ArrowRight size={18} aria-hidden="true" /></button>
      </article>

      <article className={`lesson-preview-panel preview-practise ${active === 1 ? "is-active" : ""}`} aria-labelledby="preview-practise-title">
        <div className="preview-panel-heading"><h3 id="preview-practise-title">Put two and two together.</h3><span>Match the pairs</span></div>
        <div className="preview-match-grid">
          <div>{words.map((word, index) => <button type="button" key={word.text} lang="om" disabled={matched.includes(index)} aria-pressed={selected === index} onClick={() => { setSelected(index); setFeedback("Now choose its meaning."); }} className={matched.includes(index) ? "is-matched" : ""}>{word.text}{matched.includes(index) && <Check size={17} aria-hidden="true" />}</button>)}</div>
          <div>{[1, 0].map(index => <button type="button" key={index} disabled={matched.includes(index)} onClick={() => match(index)} className={matched.includes(index) ? "is-matched" : ""}><span>{words[index].english}<span lang="am">{words[index].amharic}</span></span>{matched.includes(index) && <Check size={17} aria-hidden="true" />}</button>)}</div>
        </div>
        <div className="preview-teacher"><FidelTeacherMark /><p role="status">{feedback}</p></div>
        <button type="button" className="preview-mobile-next" onClick={() => setActive(2)}>Come back to it <ArrowRight size={18} aria-hidden="true" /></button>
      </article>

      <article className={`lesson-preview-panel preview-review ${active === 2 ? "is-active" : ""}`} aria-labelledby="preview-review-title">
        <div className="preview-panel-heading"><h3 id="preview-review-title">Remember this one?</h3><span>A little later…</span></div>
        <div className="preview-recall"><p>What does this word mean?</p><p lang="om" className="preview-large-word">Galatoomi</p><div className="preview-recall-answer" aria-live="polite">{revealed ? <><span>Thank you</span><span lang="am">አመሰግናለሁ</span></> : <span>Let it come back to you.</span>}</div>
          <button className="preview-recall-button" type="button" disabled={reviewed} onClick={() => revealed ? setReviewed(true) : setRevealed(true)}>{reviewed ? <><Check size={18} aria-hidden="true" /> A little more familiar</> : revealed ? "I remembered it" : "Reveal meaning"}</button>
        </div>
        <div className="preview-review-rhythm" aria-label="Example review intervals, adapted to your answers in the app"><span className="is-done">Today</span><span className={reviewed ? "is-done" : ""}>In 3 days</span><span>Later</span></div>
        <p className="preview-review-note" role="status">{reviewed ? "That’s the idea. Your answers shape when words return." : "Words return over time, at a pace shaped by your answers."}</p>
      </article>
    </div>
  </section>;
}
