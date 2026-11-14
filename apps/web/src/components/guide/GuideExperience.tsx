import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@clerk/tanstack-react-start";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

import { usePreferences, useUpdatePreferences } from "@/hooks/use-preferences";
import { characterFor } from "@/lib/character-cast";
import "./guide.css";

export const GUIDE_EVENT = "fidel:guide";
const TOUR_VERSION = 1;
// Bump this when the release-note copy below changes in a shipped update.
const UPDATE_VERSION = "2026-11";

type GuideMode = "tour" | "updates" | null;
const stops = [
  { title: "Your day starts here", body: "Your goal, next lesson, and recent practice live on Home.", bubble: "A few words today? I’ll keep count with you.", tip: "The goal counts new words, not minutes. Change it any time in Settings.", destination: "Home" },
  { title: "Follow your learning path", body: "Choose a topic and finish its words to move forward.", bubble: "See that path? Each stop has words to collect.", tip: "Leave a lesson halfway through and you can continue it later.", destination: "Learn" },
  { title: "Keep words close", body: "Find a word, hear it, and save it for later.", bubble: "The Dictionary is our word shelf.", tip: "Mark a word for review when you want more practice with it.", destination: "Dictionary" },
  { title: "Bring words back", body: "Practise familiar words and see what is ready for review.", bubble: "Let’s see what you remember.", tip: "Your answers are saved so words can return when you need them.", destination: "Review" },
  { title: "Take your words into the village", body: "Use words you’ve learned in short Quest conversations.", bubble: "There’s someone waiting at the next door.", tip: "Choose a word from your bank to reply. More words open more doors.", destination: "Quest" },
] as const;
const paths = ["/home", "/learn", "/dictionary", "/review", "/quest"] as const;
type Highlight = { top: number; left: number; width: number; height: number };

function placePanel(rect: DOMRect, panel: HTMLElement | null) {
  const gap = 16;
  const width = panel?.offsetWidth || Math.min(324, window.innerWidth - 32);
  const height = panel?.offsetHeight || 300;
  const roomRight = window.innerWidth - rect.right;
  const roomLeft = rect.left;
  let left: number;
  let top: number;
  if (window.innerWidth >= 768 && roomRight >= width + gap * 2) {
    left = rect.right + gap;
    top = rect.top;
  } else if (window.innerWidth >= 768 && roomLeft >= width + gap * 2) {
    left = rect.left - width - gap;
    top = rect.top;
  } else {
    left = window.innerWidth >= 768
      ? Math.min(window.innerWidth - width - gap, Math.max(gap, rect.left))
      : Math.max(gap, (window.innerWidth - width) / 2);
    top = rect.bottom + gap + height <= window.innerHeight - gap
      ? rect.bottom + gap
      : rect.top - height - gap;
  }
  return {
    left: Math.round(Math.max(gap, Math.min(left, window.innerWidth - width - gap))),
    top: Math.round(Math.max(gap, Math.min(top, window.innerHeight - height - gap))),
  };
}

export function GuideExperience() {
  const preferences = usePreferences();
  const { userId } = useAuth();
  const update = useUpdatePreferences();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname.toLowerCase() });
  const [mode, setMode] = useState<GuideMode>(null);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [tipOpen, setTipOpen] = useState(false);
  const [characterBeat, setCharacterBeat] = useState(0);
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const isReady = Boolean(highlight);
  const [waiting, setWaiting] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ top: 16, left: 16 });
  const heading = useRef<HTMLHeadingElement>(null);
  const panel = useRef<HTMLElement>(null);
  const autoOpened = useRef<string | null>(null);

  useEffect(() => {
    if (!userId || autoOpened.current === userId || pathname !== "/home" || !preferences.data?.onboarding_completed) return;
    const next = preferences.data.tour_completed_version < TOUR_VERSION ? "tour"
      : preferences.data.last_seen_update !== UPDATE_VERSION ? "updates" : null;
    const timer = window.setTimeout(() => {
      autoOpened.current = userId;
      if (next) setMode(next);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname, preferences.data, userId]);

  useEffect(() => {
    const open = (event: Event) => {
      const requested = (event as CustomEvent<"tour" | "updates">).detail;
      setError(null);
      setTipOpen(false);
      setMode(requested);
      if (requested === "tour") {
        setHighlight(null);
        setWaiting(false);
        setStep(0);
        void navigate({ to: "/Home" });
      }
    };
    window.addEventListener(GUIDE_EVENT, open);
    return () => window.removeEventListener(GUIDE_EVENT, open);
  }, [navigate]);

  useEffect(() => { if (mode === "updates" || isReady) heading.current?.focus({ preventScroll: true }); }, [mode, step, isReady]);

  useEffect(() => {
    if (mode !== "tour" || isReady) return;
    const timer = window.setTimeout(() => setWaiting(true), 1500);
    return () => window.clearTimeout(timer);
  }, [mode, step, isReady]);

  useEffect(() => {
    if (mode !== "tour" || !highlight || !panel.current) return;
    const current = panel.current;
    const updatePosition = () => {
      const position = placePanel(new DOMRect(highlight.left, highlight.top, highlight.width, highlight.height), current);
      setPanelPosition((previous) => previous.top === position.top && previous.left === position.left ? previous : position);
    };
    const observer = new ResizeObserver(updatePosition);
    observer.observe(current);
    updatePosition();
    return () => observer.disconnect();
  }, [mode, highlight]);

  useEffect(() => {
    if (mode !== "tour" || pathname !== paths[step]) return;
    let frame = 0;
    let target: HTMLElement | null = null;
    let targetSize: ResizeObserver | null = null;
    const measure = () => {
      frame = 0;
      const element = document.querySelector<HTMLElement>(`[data-guide-target="${stops[step].destination}"]`);
      if (!element || element.getBoundingClientRect().width === 0) {
        setHighlight(null);
        return;
      }
      if (target !== element) {
        targetSize?.disconnect();
        target = element;
        targetSize = new ResizeObserver(schedule);
        targetSize.observe(element);
      }
      const rect = element.getBoundingClientRect();
      if (rect.height < window.innerHeight && (rect.top < 0 || rect.bottom > window.innerHeight)) {
        element.scrollIntoView({ block: "center", behavior: "instant" });
      }
      const visible = element.getBoundingClientRect();
      const next = { top: Math.round(visible.top), left: Math.round(visible.left), width: Math.round(visible.width), height: Math.round(visible.height) };
      setHighlight((previous) => previous && Object.keys(next).every((key) => previous[key as keyof Highlight] === next[key as keyof Highlight]) ? previous : next);
      setPanelPosition((previous) => {
        const position = placePanel(visible, panel.current);
        return previous.top === position.top && previous.left === position.left ? previous : position;
      });
      if (!panel.current) schedule();
    };
    function schedule() {
      if (!frame) frame = window.requestAnimationFrame(measure);
    }
    const observer = new MutationObserver(schedule);
    observer.observe(document.querySelector("main") ?? document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-guide-target"] });
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    schedule();
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      targetSize?.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
    };
  }, [mode, pathname, step]);

  function visit(index: number) {
    setHighlight(null);
    setWaiting(false);
    setStep(index);
    setError(null);
    setTipOpen(false);
    setCharacterBeat((beat) => beat + 1);
    switch (stops[index].destination) {
      case "Home": void navigate({ to: "/Home" }); break;
      case "Learn": void navigate({ to: "/Learn" }); break;
      case "Dictionary": void navigate({ to: "/dictionary" }); break;
      case "Review": void navigate({ to: "/review", search: { start: false } }); break;
      case "Quest": void navigate({ to: "/quest" }); break;
    }
  }

  async function close() {
    if (!mode || update.isPending) return;
    setError(null);
    try {
      await update.mutateAsync(mode === "tour"
        ? { tour_completed_version: TOUR_VERSION, last_seen_update: UPDATE_VERSION }
        : { last_seen_update: UPDATE_VERSION });
      setMode(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Couldn't save your guide progress. Try again.");
    }
  }

  useEffect(() => {
    if (!mode) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") void close(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  if (!mode) return null;
  if (mode === "tour" && (pathname !== paths[step] || !highlight)) {
    return waiting ? <aside className="guide-panel guide-waiting" role="status">
      <span>Opening {stops[step].destination}…</span>
      <button type="button" className="guide-close" onClick={() => void close()} disabled={update.isPending} aria-label="Close tour"><X size={18} /></button>
      {error && <p className="guide-error" role="alert">{error}</p>}
    </aside> : null;
  }
  const stop = stops[step];
  const companion = characterFor(preferences.data?.learning_language ?? "om", "student");
  const bubble = mode === "tour"
    ? tipOpen ? stop.tip : step === 0 ? `Your goal is ${preferences.data?.daily_goal_words ?? 5} words today. I’ll keep count with you.` : stop.bubble
    : tipOpen ? "Try a village conversation after you collect a few words." : "I’ve found a few new ways for us to practise.";
  const position: CSSProperties | undefined = mode === "tour" ? { top: panelPosition.top, left: panelPosition.left } : undefined;
  return <>
  {mode === "tour" && highlight && <div className="guide-spotlight" aria-hidden="true" style={{ top: highlight.top - 6, left: highlight.left - 6, width: highlight.width + 12, height: highlight.height + 12 }} />}
  <aside ref={panel} className={`guide-panel${mode === "tour" ? " is-tour" : ""}`} style={position} role="dialog" aria-modal="false" aria-labelledby="guide-title" aria-describedby="guide-copy">
    <div className="guide-top"><span className="guide-journey">A little walk with {companion.name}</span><button type="button" className="guide-close" onClick={() => void close()} disabled={update.isPending} aria-label={mode === "tour" ? "Close tour" : "Close what's new"}><X size={18} /></button></div>
    <div className="guide-scene">
      <button type="button" className="guide-character" aria-label={`${tipOpen ? "Show message from" : "Ask"} ${companion.name}${tipOpen ? "" : " for a tip"}`} aria-pressed={tipOpen} onClick={() => { setTipOpen((open) => !open); setCharacterBeat((beat) => beat + 1); }}>
        <img key={characterBeat} src={companion.image} alt="" width="88" height="118" />
      </button>
      <div className="guide-speech" aria-live="polite"><strong>{companion.name}</strong><p key={`${mode}-${step}-${tipOpen}`}>{bubble}</p><span>{tipOpen ? "Tap to hear the first thought" : "Tap your guide for a tip"}</span></div>
    </div>
    {mode === "tour" ? <>
      <p className="guide-progress">{step + 1} of {stops.length} · {stop.destination}</p>
      <h2 id="guide-title" ref={heading} tabIndex={-1}>{stop.title}</h2>
      <p id="guide-copy">{stop.body}</p>
      <div className="guide-dashes" aria-label="Tour progress">{stops.map((item, index) => <button type="button" key={item.destination} aria-label={`Go to ${item.destination}`} aria-current={step === index ? "step" : undefined} onClick={() => visit(index)} className={step === index ? "active" : ""} />)}</div>
      <div className="guide-actions"><button type="button" className="guide-quiet" onClick={() => void close()} disabled={update.isPending}>Skip tour</button><div>{step > 0 && <button type="button" className="guide-back" onClick={() => visit(step - 1)}><ArrowLeft size={16} /> Back</button>}<button type="button" className="guide-next" disabled={update.isPending} onClick={() => step === stops.length - 1 ? void close() : visit(step + 1)}>{step === stops.length - 1 ? "Finish" : "Next"}<ArrowRight size={16} /></button></div></div>
    </> : <>
      <h2 id="guide-title" ref={heading} tabIndex={-1}>What’s new in Fidel</h2>
      <p id="guide-copy">More ways to use the words you’ve learned.</p>
      <ul className="guide-updates"><li><strong>Village conversations</strong><span>Bring words from your bank into Fidel Quest.</span></li><li><strong>Listening practice</strong><span>Hear a word, then build your answer.</span></li><li><strong>Meet your guides</strong><span>Characters now join practice and quests.</span></li></ul>
      <div className="guide-actions"><span>November 2026</span><button type="button" className="guide-next" disabled={update.isPending} onClick={() => void close()}>Got it <ArrowRight size={16} /></button></div>
    </>}
    {error && <p className="guide-error" role="alert">{error}</p>}
  </aside></>;
}

export function openGuide(mode: "tour" | "updates") {
  window.dispatchEvent(new CustomEvent(GUIDE_EVENT, { detail: mode }));
}
