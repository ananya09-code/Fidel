import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Volume2 } from "lucide-react";
import { getWords } from "@/lib/api/words";
import { greetings, type SampleLanguage } from "./content";

// Resolve audio on demand; never bundle expiring presigned URLs or invent speech.
export function WordPlayer({ language }: { language: SampleLanguage }) {
  const [state, setState] = useState<"idle" | "loading" | "playing" | "unavailable" | "error">("idle");
  const audio = useRef<HTMLAudioElement | null>(null);
  const request = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const sample = greetings[language];

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      request.current?.abort();
      audio.current?.pause();
    };
  }, []);

  async function listen() {
    if (state === "loading" || state === "playing") return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    setState("loading");
    try {
      const result = await getWords({language_code:language,search:sample.word,audio_available:true,page_size:20},controller.signal);
      if (!mounted.current || controller.signal.aborted) return;
      const word = result.data.find(word => word.text.trim().replace(/[.!?]+$/, "").toLocaleLowerCase() === sample.word.toLocaleLowerCase());
      if (!word?.audio.available || !word.audio.url) { setState("unavailable"); return; }
      const player = new Audio(word.audio.url);
      audio.current = player;
      player.onended = () => { if (mounted.current) setState("idle"); };
      player.onerror = () => { if (mounted.current) setState("error"); };
      await player.play();
      if (mounted.current) setState("playing");
    } catch {
      if (mounted.current) setState("error");
    } finally { window.clearTimeout(timeout); }
  }

  return (
    <div className="editorial-audio">
      <button type="button" className="editorial-listen" onClick={() => void listen()} disabled={state === "loading" || state === "playing"} aria-label={`Listen to ${sample.word} in ${sample.name}`}>
        {state === "loading" ? <LoaderCircle className="editorial-spinner" size={21} aria-hidden="true" /> : <Volume2 size={21} aria-hidden="true" />}
        {state === "loading" ? "Finding recording…" : state === "playing" ? "Playing…" : "Listen"}
      </button>
      <p className="editorial-audio-status" role="status">
        {state === "error" ? "Audio couldn’t load. Please try again." : state === "unavailable" ? "A reviewed recording isn’t available for this word yet." : "Reviewed pronunciation, when available."}
      </p>
    </div>
  );
}
