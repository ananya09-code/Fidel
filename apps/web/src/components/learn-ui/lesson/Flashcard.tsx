import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Volume2 } from "lucide-react";
import "./lesson.css";

export type FlashcardWord = {
  id: string;
  word: string;
  transliteration?: string | null;
  meaning: string;
  amharic?: string | null;
  example?: string | null;
  audioUrl?: string | null;
};

type FlashcardProps = {
  word: FlashcardWord;
  currentIndex: number;
  total: number;
  direction?: "next" | "previous";
  onPrevious: () => void;
  onNext: () => void;
  onFinish: () => void;
};

const EASE = "cubic-bezier(.22,1,.36,1)";
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function WordFace({ word }: { word: FlashcardWord }) {
  return <>
    <div className="study-word">
      <h2>{word.word}</h2>
      {word.transliteration && <p>{word.transliteration}</p>}
    </div>
    <dl className="study-translations">
      <div><dt>Amharic</dt><dd lang="am">{word.amharic ?? "Translation unavailable"}</dd></div>
      <div><dt>English</dt><dd>{word.meaning}</dd></div>
    </dl>
    {word.example && <p className="study-example">{word.example}</p>}
  </>;
}

export function Flashcard({
  word, currentIndex, total, direction = "next", onPrevious, onNext, onFinish,
}: FlashcardProps) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [outgoing, setOutgoing] = useState<FlashcardWord | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isplaying, setisPlaying] = useState(false);
  const surface = useRef<HTMLDivElement>(null);
  const ghost = useRef<HTMLDivElement>(null);
  const moving = useRef(false);
  const previousId = useRef(word.id);
  const exitX = useRef(0);
  const pointer = useRef<{ x: number; y: number; at: number } | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => { audio.current?.pause(); }, [word.id]);

  useLayoutEffect(() => {
    if (previousId.current === word.id) return;
    previousId.current = word.id;
    if (!surface.current || reducedMotion()) {
      moving.current = false;
      return;
    }
    moving.current = true;
    const sign = direction === "previous" ? -1 : 1;
    const distance = Math.min(surface.current.clientWidth * .8, 440);
    const incoming = surface.current.animate([
      { transform: `translate3d(${sign * distance}px,0,0) rotate(${sign * 2}deg) scale(.97)`, opacity: 0 },
      { transform: "translate3d(0,0,0) rotate(0) scale(1)", opacity: 1 },
    ], { duration: 440, easing: EASE });
    const leaving = ghost.current?.animate([
      { transform: `translate3d(${exitX.current}px,0,0) rotate(0)`, opacity: 1 },
      { transform: `translate3d(${-sign * distance}px,0,0) rotate(${-sign * 3}deg)`, opacity: 0 },
    ], { duration: 320, easing: EASE, fill: "forwards" });
    void incoming.finished.then(() => {
      moving.current = false;
      setOutgoing(null);
    }).catch(() => { });
    return () => {
      incoming.cancel();
      leaving?.cancel();
      moving.current = false;
    };
  }, [word.id, direction]);

  function navigate(target: "next" | "previous") {
    if (moving.current || (target === "previous" && currentIndex === 0)) {
      setDragX(0);
      return;
    }
    audio.current?.pause();
    setAudioError(null);
    setDragging(false);
    pointer.current = null;
    if (target === "next" && currentIndex === total - 1) {
      setDragX(0);
      onFinish();
      return;
    }
    moving.current = !reducedMotion();
    exitX.current = dragX;
    setOutgoing(reducedMotion() ? null : word);
    setDragX(0);
    if (target === "next") onNext();
    else onPrevious();
  }

  function resetDrag() {
    pointer.current = null;
    setDragging(false);
    setDragX(0);
  }

  function playAudio() {
    if (!word.audioUrl) return;
    audio.current?.pause();
    const player = new Audio(word.audioUrl);

    player.onplay = () => setisPlaying(true);

    player.onended = () => setisPlaying(false);
    audio.current = player;
    setAudioError(null);
    void player.play().catch(() => setAudioError(word.id));
  }

  return <section className="study-flashcards" aria-label="Vocabulary flashcards">
    <div className="study-progress-label"><span>Your vocabulary</span><span aria-live="polite">{currentIndex + 1} of {total}</span></div>
    <progress className="study-progress" value={currentIndex + 1} max={total} aria-label="Flashcard progress" />
    <div className="study-deck">
      {outgoing && <div ref={ghost} className="study-card study-card-ghost" aria-hidden="true">
        <WordFace word={outgoing} />
        <div className="study-audio"><span className="study-secondary"><Volume2 size={18} />{outgoing.audioUrl ? "Listen" : "Audio unavailable"}</span></div>
      </div>}
      <div
        ref={surface} className={`study-card${dragging ? " is-dragging" : ""}`}
        tabIndex={0} role="group" aria-roledescription="flashcard"
        aria-label={`${word.word}. Use left and right arrows to change words.`}
        style={{ transform: `translate3d(${dragX}px,0,0) rotate(${dragX / 100}deg)` }}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
          event.preventDefault();
          if (!event.repeat) navigate(event.key === "ArrowRight" ? "next" : "previous");
        }}
        onPointerDown={(event) => {
          if (moving.current || (event.pointerType === "mouse" && event.button !== 0)) return;
          if ((event.target as HTMLElement).closest("button")) return;
          pointer.current = { x: event.clientX, y: event.clientY, at: performance.now() };
          setDragging(true);
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const start = pointer.current;
          if (!start || moving.current) return;
          const dx = event.clientX - start.x;
          if (Math.abs(event.clientY - start.y) > Math.max(12, Math.abs(dx))) {
            resetDrag();
            return;
          }
          setDragX(Math.max(-260, Math.min(260, dx * (dx > 0 && currentIndex === 0 ? .15 : .85))));
        }}
        onPointerUp={(event) => {
          const start = pointer.current;
          if (!start) return;
          const dx = event.clientX - start.x;
          const velocity = Math.abs(dx) / Math.max(performance.now() - start.at, 1);
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
          if (Math.abs(dx) > 64 || (Math.abs(dx) > 22 && velocity > .55)) navigate(dx < 0 ? "next" : "previous");
          else resetDrag();
        }}
        onPointerCancel={resetDrag}
      >
        <WordFace word={word} />
        <div className="study-audio">
          <button type="button" className="study-secondary" disabled={!word.audioUrl} onClick={playAudio}><Volume2 size={18} aria-hidden="true" />{word.audioUrl ? (isplaying ? "Playing...." : "Listen") : "Audio unavailable"}</button>
          {audioError === word.id && <p role="alert">Audio couldn’t play. Try again.</p>}
        </div>
      </div>
    </div>
    <div className="study-card-controls">
      <button type="button" className="study-secondary" onClick={() => navigate("previous")} disabled={currentIndex === 0}><ArrowLeft size={18} aria-hidden="true" />Previous</button>
      <button type="button" className="study-primary" onClick={() => navigate("next")}>{currentIndex === total - 1 ? "Finish cards" : "Next word"}<ArrowRight size={18} aria-hidden="true" /></button>
    </div>
    <p className="study-swipe-hint">Swipe a card, or use the arrow keys.</p>
  </section>;
}
