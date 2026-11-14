import { useEffect, useRef, useState } from "react";
import { ArrowRight, Volume2 } from "lucide-react";
import { useAuth } from "@clerk/tanstack-react-start";
import { useQueryClient } from "@tanstack/react-query";
import type { CastMember } from "@/lib/character-cast";
import { submitSentenceAnswer, type SentenceAnswerResult, type SentenceExercise } from "@/lib/api/sentences";
import "./sentence-round.css";

export function SentenceRound({ exercise, character, onContinue }: {
  exercise: SentenceExercise;
  character: CastMember;
  onContinue: () => void;
}) {
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();
  const audio = useRef<HTMLAudioElement>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<SentenceAnswerResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const tiles = exercise.tiles;

  useEffect(() => () => { audio.current?.pause(); }, []);

  async function play() {
    if (!audio.current) return;
    setError(null);
    try {
      audio.current.currentTime = 0;
      await audio.current.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
      setError("Audio couldn't play. You can still build the sentence.");
    }
  }

  async function check() {
    if (saving || selected.length !== tiles.length) return;
    setSaving(true);
    setError(null);
    try {
      const answer = await submitSentenceAnswer(getToken, exercise.id, selected);
      setResult(answer);
      void queryClient.invalidateQueries({ queryKey: ["auth", "sentences", userId ?? "signed-out", exercise.language_code] });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Couldn't save this sentence. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="fidel-study study-sentence-round">
    <header className="study-header"><span>Practice · Use your words</span><span>Sentence</span></header>
    <h1>Build a sentence</h1>
    <div className="study-sentence-scene">
      <img src={character.image} alt="" width={116} height={140} />
      <div className="study-sentence-speech">
        <span>{character.name} says</span>
        <strong>{exercise.meaning ?? "Listen and put the words in order."}</strong>
        {exercise.meaning_amharic && <span lang="am">{exercise.meaning_amharic}</span>}
        {exercise.audio_url && <button type="button" onClick={() => void play()} disabled={playing}><Volume2 size={18} aria-hidden="true" />{playing ? "Playing…" : "Listen to the sentence"}</button>}
      </div>
    </div>
    <p className="study-sentence-instruction">Put the words in the order you would say them.</p>
    <div className="study-sentence-answer" role="group" aria-label="Your sentence">
      {selected.length === 0 && <span>Choose the first word</span>}
      {selected.map((id) => {
        const tile = tiles.find((item) => item.id === id)!;
        return <button type="button" key={id} disabled={saving} onClick={() => { setSelected(selected.filter((item) => item !== id)); setResult(null); }} aria-label={`Remove ${tile.text}`}>{tile.text}</button>;
      })}
    </div>
    <div className="study-sentence-bank" role="group" aria-label="Word bank">
      {tiles.map((tile) => <button type="button" key={tile.id} disabled={selected.includes(tile.id) || saving || Boolean(result?.is_correct)} onClick={() => { setSelected([...selected, tile.id]); setResult(null); }}>{tile.text}</button>)}
    </div>
    {result && <div className={`study-sentence-feedback ${result.is_correct ? "is-correct" : "is-try-again"}`} role="status"><strong>{result.is_correct ? "You built it." : "Hmm, try another order."}</strong><span>{result.is_correct ? result.sentence : result.hint}</span></div>}
    {error && <p className="study-error" role="alert">{error}</p>}
    <div className="study-sentence-actions">
      <button type="button" className="study-text-button" disabled={saving} onClick={onContinue}>{result?.is_correct ? "Continue practice" : "Skip for now"}</button>
      {!result?.is_correct && <button type="button" className="study-primary" disabled={saving || selected.length !== tiles.length} onClick={() => void check()}>{saving ? "Saving…" : "Check"}<ArrowRight size={18} aria-hidden="true" /></button>}
      {result?.is_correct && <button type="button" className="study-primary" onClick={onContinue}>Continue<ArrowRight size={18} aria-hidden="true" /></button>}
    </div>
    {exercise.audio_url && <audio ref={audio} src={exercise.audio_url} preload="none" onEnded={() => setPlaying(false)} onError={() => { setPlaying(false); setError("Audio couldn't play. You can still build the sentence."); }} />}
  </div>;
}
