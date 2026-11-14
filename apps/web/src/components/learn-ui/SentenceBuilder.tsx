import { useAuth } from "@clerk/tanstack-react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, LockKeyhole, RotateCcw, Volume2 } from "lucide-react";
import { PageState } from "@/components/common-ui/PageState";
import { usePreferences } from "@/hooks/use-preferences";
import { getSentenceExercises, submitSentenceAnswer, type SentenceAnswerResult } from "@/lib/api/sentences";
import "./sentence-builder.css";

export function SentenceBuilder() {
  const { getToken, userId, isLoaded, isSignedIn } = useAuth();
  const preferences = usePreferences();
  const queryClient = useQueryClient();
  const language = preferences.data?.learning_language;
  const queryKey = ["auth", "sentences", userId ?? "signed-out", language ?? "unselected"] as const;
  const exercises = useQuery({
    queryKey,
    queryFn: ({ signal }) => getSentenceExercises(getToken, language!, signal),
    enabled: isLoaded && Boolean(isSignedIn && userId && language), retry: false,
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [tileOrder, setTileOrder] = useState<string[]>([]);
  const [result, setResult] = useState<SentenceAnswerResult | null>(null);
  const [playing, setPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const active = exercises.data?.exercises.find((item) => item.id === activeId);
  const submit = useMutation({
    mutationFn: () => submitSentenceAnswer(getToken, activeId!, selected),
    onSuccess: (answer) => {
      setResult(answer);
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  function open(id: string) {
    const tiles = exercises.data?.exercises.find((item) => item.id === id)?.tiles ?? [];
    const shuffled = tiles.map((tile) => tile.id);
    for (let index = shuffled.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
    }
    setTileOrder(shuffled); setActiveId(id); setSelected([]); setResult(null); setAudioError(false); submit.reset();
  }
  function play(url: string) {
    const audio = new Audio(url);
    setAudioError(false); setPlaying(true);
    audio.onended = () => setPlaying(false);
    audio.onerror = () => { setPlaying(false); setAudioError(true); void exercises.refetch(); };
    void audio.play().catch(() => { setPlaying(false); setAudioError(true); void exercises.refetch(); });
  }

  return <section className="sentence-builder" aria-labelledby="sentence-title">
    <div className="sentence-heading"><div><span className="sentence-index">After the words</span><h2 id="sentence-title">Build a sentence</h2><p>Put familiar words together. Listen, arrange, and try again.</p></div>
      {active && <button type="button" className="sentence-back" onClick={() => open("")}><ArrowLeft size={17} aria-hidden="true" /> All sentences</button>}
    </div>
    {preferences.isPending || exercises.isPending ? <PageState kind="loading" title="Loading sentences" compact /> :
      preferences.isError || exercises.isError ? <PageState kind="error" title="Couldn't load sentences" description={preferences.error?.message ?? exercises.error?.message} actionLabel="Try again" onAction={() => { void preferences.refetch(); void exercises.refetch(); }} compact /> :
      !exercises.data?.exercises.length ? <PageState kind="empty" title="Sentences are on their way" description="Reviewed sentence audio will appear here when it is ready." compact /> :
      active ? <div className="sentence-play">
        <div className="sentence-prompt"><span>Arrange the words to say</span><strong>{active.meaning ?? "Listen and build the sentence"}</strong>
          {active.audio_url && <button type="button" className="sentence-listen" onClick={() => play(active.audio_url!)} disabled={playing}><Volume2 size={18} aria-hidden="true" /> {playing ? "Playing…" : "Listen"}</button>}
          {audioError && <p role="alert">Audio couldn't play. Try again in a moment.</p>}
        </div>
        <div className="sentence-response" aria-label="Your sentence">{selected.length ? selected.map((id, index) => {
          const tile = active.tiles.find((item) => item.id === id)!;
          return <button type="button" key={id} onClick={() => { setSelected(selected.filter((_, i) => i !== index)); setResult(null); }} disabled={submit.isPending} aria-label={`Remove ${tile.text}`}>{tile.text}</button>;
        }) : <span>Tap the words below</span>}</div>
        <div className="sentence-tiles" aria-label="Available words">{tileOrder.map((id) => {
          const tile = active.tiles.find((item) => item.id === id)!;
          return <button type="button" key={tile.id} disabled={selected.includes(tile.id) || submit.isPending} onClick={() => { setSelected([...selected, tile.id]); setResult(null); }}>{tile.text}</button>;
        })}</div>
        {result && <div className={`sentence-result ${result.is_correct ? "is-correct" : "is-try-again"}`} role="status"><strong>{result.is_correct ? "You built it." : "Almost. Try another order."}</strong><span>{result.is_correct ? result.sentence : result.hint}</span>{result.is_correct && result.meaning_amharic && <span>{result.meaning} · {result.meaning_amharic}</span>}</div>}
        {submit.isError && <p className="sentence-error" role="alert">{submit.error.message}</p>}
        <div className="sentence-actions"><button type="button" className="sentence-reset" onClick={() => { setSelected([]); setResult(null); submit.reset(); }} disabled={!selected.length || submit.isPending}><RotateCcw size={16} aria-hidden="true" /> Start over</button><button type="button" className="sentence-check" disabled={selected.length !== active.tiles.length || submit.isPending || Boolean(result?.is_correct)} onClick={() => submit.mutate()}>{submit.isPending ? "Checking…" : "Check sentence"}<ArrowRight size={17} aria-hidden="true" /></button></div>
      </div> : <ol className="sentence-list">{exercises.data.exercises.map((item, index) => <li key={item.id}><span className="sentence-number">{String(index + 1).padStart(2, "0")}</span><div><strong>{item.meaning ?? "A new sentence"}</strong><span>{item.completed ? "Completed" : item.locked ? item.missing_words.length ? `Learn ${item.missing_words.join(", ")} first` : "Waiting for reviewed audio" : "Ready to build"}</span></div>{item.locked ? <LockKeyhole size={18} aria-label="Locked" /> : <button type="button" onClick={() => open(item.id)} aria-label={`Build ${item.meaning ?? "sentence"}`}>{item.completed ? <Check size={19} aria-hidden="true" /> : <ArrowRight size={19} aria-hidden="true" />}</button>}</li>)}</ol>}
  </section>;
}
