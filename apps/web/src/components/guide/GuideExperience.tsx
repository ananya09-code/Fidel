import { useEffect, useRef, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@clerk/tanstack-react-start";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

import { FidelTeacherMark } from "@/components/common-ui/FidelTeacherMark";
import { usePreferences, useUpdatePreferences } from "@/hooks/use-preferences";
import "./guide.css";

export const GUIDE_EVENT = "fidel:guide";
const TOUR_VERSION = 1;
// Bump this when the release-note copy below changes in a shipped update.
const UPDATE_VERSION = "2026-11";

type GuideMode = "tour" | "updates" | null;
const stops = [
  { title: "Your day starts here", body: "Home shows your daily word goal, the lesson you can continue, and what you recently practised.", destination: "Home" },
  { title: "Follow your learning path", body: "Learn is arranged by topic. Finish the words in a lesson to move forward, and pick up unfinished sessions here.", destination: "Learn" },
  { title: "Keep words close", body: "Search the Dictionary to hear approved recordings, save favourites, and mark words you want to review.", destination: "Dictionary" },
  { title: "Bring words back", body: "Review gives you practice from your saved words. Your answers are remembered so words return when you need them.", destination: "Review" },
  { title: "Take your words into the village", body: "Fidel Quest opens short conversations as your word bank grows. Choose a word you know to reply.", destination: "Quest" },
] as const;

export function GuideExperience() {
  const preferences = usePreferences();
  const { userId } = useAuth();
  const update = useUpdatePreferences();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname.toLowerCase() });
  const [mode, setMode] = useState<GuideMode>(null);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
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
      setMode(requested);
      if (requested === "tour") {
        setStep(0);
        void navigate({ to: "/Home" });
      }
    };
    window.addEventListener(GUIDE_EVENT, open);
    return () => window.removeEventListener(GUIDE_EVENT, open);
  }, [navigate]);

  useEffect(() => { if (mode) heading.current?.focus(); }, [mode, step]);

  function visit(index: number) {
    setStep(index);
    setError(null);
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
  const stop = stops[step];
  return <aside className="guide-panel" role="dialog" aria-modal="false" aria-labelledby="guide-title" aria-describedby="guide-copy">
    <div className="guide-top"><FidelTeacherMark className="guide-teacher" /><button type="button" className="guide-close" onClick={() => void close()} disabled={update.isPending} aria-label={mode === "tour" ? "Close tour" : "Close what's new"}><X size={18} /></button></div>
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
  </aside>;
}

export function openGuide(mode: "tour" | "updates") {
  window.dispatchEvent(new CustomEvent(GUIDE_EVENT, { detail: mode }));
}
