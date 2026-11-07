import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play } from "lucide-react";

const languages = [
  {
    name: "Amharic", native: "አማርኛ", code: "am", greeting: "ሰላም", pronunciation: "Selam",
    meaning: "Hello · Peace", amharic: "ሰላም", colour: "paper",
    story: "A greeting can open a whole conversation. Meet Amharic in its own script, with meanings you can follow and words you can return to.",
    note: "A familiar beginning, in its own script.",
  },
  {
    name: "Afaan Oromoo", native: "Afaan Oromoo", code: "om", greeting: "Akkam", pronunciation: "Ak-kam",
    meaning: "Hello · How are you?", amharic: "ሰላም · እንዴት ነህ?", colour: "orange",
    story: "Start with Akkam. Build a collection of everyday words, with English and Amharic meanings beside them. A small lesson can become a real connection.",
    note: "One word. The start of a connection.",
  },
  {
    name: "Tigrinya", native: "ትግርኛ", code: "ti", greeting: "ሰላም", pronunciation: "Selam",
    meaning: "Hello · Peace", amharic: "ሰላም", colour: "sage",
    story: "The same greeting, another living language. Explore Tigrinya’s place in Ethiopia on the map. This is a language preview; lessons are not available yet.",
    note: "A language to discover. Lessons to come.",
  },
] as const;

/** A small, accessible greeting carousel, with touch swipes and a quiet static fallback. */
export function LanguageDeck({ start }: { start: "/Home" | "/sign-up" }) {
  const [active, setActive] = useState(1);
  const [paused, setPaused] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const stage = useRef<HTMLDivElement>(null);
  const visible = useRef(false);
  const engaged = useRef(false);
  const hovered = useRef(false);
  const gesture = useRef<{ id: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { visible.current = entry.isIntersecting; }, { threshold: .45 });
    if (stage.current) observer.observe(stage.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const timer = window.setInterval(() => {
      if (!paused && !reduced.matches && visible.current && !document.hidden && !engaged.current && !hovered.current) {
        setActive(index => (index + 1) % languages.length);
      }
    }, 5500);
    return () => window.clearInterval(timer);
  }, [paused, active]);

  function choose(index: number) {
    const next = (index + languages.length) % languages.length;
    setActive(next);
    // A deliberate choice stops the timer so visitors have time to read it.
    setPaused(true);
    setAnnouncement(`${languages[next].name}. ${languages[next].pronunciation}: ${languages[next].meaning}.`);
  }

  function startSwipe(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function finishSwipe(event: PointerEvent<HTMLDivElement>) {
    const origin = gesture.current;
    gesture.current = null;
    if (!origin || origin.id !== event.pointerId) return;
    const dx = event.clientX - origin.x, dy = event.clientY - origin.y;
    if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.4) choose(active + (dx < 0 ? 1 : -1));
  }

  const selected = languages[active];

  return <section id="languages" className="editorial-languages editorial-section" aria-labelledby="languages-heading">
    <div className="editorial-section-intro"><h2 id="languages-heading">Every language,<br />on its own terms.</h2><p>A greeting is a small beginning.<br />See where it takes you.</p></div>
    <div ref={stage} className="language-deck-layout" role="region" aria-roledescription="carousel" aria-label="Language greeting cards"
      onMouseEnter={() => { hovered.current = true; }} onMouseLeave={() => { hovered.current = false; }}
      onFocusCapture={() => { engaged.current = true; }} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) engaged.current = false; }}
      onKeyDown={event => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); choose(active + (event.key === "ArrowRight" ? 1 : -1)); } }}>
      <div className="language-deck-story">
        <div className="language-deck-choices" role="group" aria-label="Choose a language">
          {languages.map((language, index) => <button type="button" key={language.code} aria-pressed={active === index} onClick={() => choose(index)}>{language.name}</button>)}
        </div>
        <p className="language-deck-narrative">{selected.story}</p>
        {selected.code === "ti" ? <a className="language-deck-link" href="#atlas">Explore the map <ArrowUpRight size={20} aria-hidden="true" /></a> : <Link className="language-deck-link" to={start}>Start learning <ArrowUpRight size={20} aria-hidden="true" /></Link>}
      </div>
      <div className="language-deck-interaction">
        <div className="language-deck-stage" data-ui="Interactive language cards" onPointerDown={startSwipe} onPointerUp={finishSwipe} onPointerCancel={() => { gesture.current = null; }} onLostPointerCapture={() => { gesture.current = null; }}>
          {languages.map((language, index) => {
            const position = index === active ? "front" : index === (active + 1) % languages.length ? "right" : "left";
            return <article key={language.code} className={`language-postcard postcard-${language.colour} deck-${position}`} aria-hidden={index !== active} inert={index !== active} aria-roledescription="slide" aria-label={`${language.name} greeting`}>
              {index === active && <>
                <div className="language-postcard-top"><span>{language.name}</span>{language.code !== "om" && <span lang={language.code}>{language.native}</span>}</div>
                <div className="language-postcard-word"><h3 lang={language.code}>{language.greeting}</h3><p>{language.pronunciation}</p></div>
                <div className="language-postcard-meaning"><p>{language.meaning}</p><p lang="am">{language.amharic}</p></div>
                <p className="language-postcard-note">{language.note}</p>
              </>}
              <svg className="postcard-weave" viewBox="0 0 240 18" fill="none" aria-hidden="true"><path d="m0 9 9-9 9 9-9 9Zm24 0 9-9 9 9-9 9Zm24 0 9-9 9 9-9 9Zm24 0 9-9 9 9-9 9Zm24 0 9-9 9 9-9 9Zm24 0 9-9 9 9-9 9Zm24 0 9-9 9 9-9 9Zm24 0 9-9 9 9-9 9Zm24 0 9-9 9 9-9 9Zm24 0 9-9 9 9-9 9Z" stroke="currentColor" strokeWidth="2" /></svg>
            </article>;
          })}
        </div>
        <div className="language-deck-controls"><button type="button" aria-label="Previous language" onClick={() => choose(active - 1)}><ArrowLeft size={21} aria-hidden="true" /></button><span>Swipe to say hello</span><button type="button" aria-label="Next language" onClick={() => choose(active + 1)}><ArrowRight size={21} aria-hidden="true" /></button><button type="button" aria-label={paused ? "Play language cards" : "Pause language cards"} aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? <Play size={17} aria-hidden="true" /> : <Pause size={17} aria-hidden="true" />}</button></div>
      </div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</p>
    </div>
  </section>;
}
