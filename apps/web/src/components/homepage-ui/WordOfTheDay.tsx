
import { useEffect, useRef, useState } from "react";
import { Headphones, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type WordOfTheDayProps = {
  word?: string;
  pronunciation?: string;
  meaning?: string;
  amharicMeaning?: string;
  audioSrc?: string;
  language?: string;
};

export function WordOfTheDay({
  word = "Akkam",
  pronunciation,
  meaning = "Hello / How are you?",
  amharicMeaning,
  audioSrc,
  language = "Afaan Oromoo",
}: WordOfTheDayProps) {
  const [playing, setPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const resolvedAmharic =
    amharicMeaning ??
    (word === "Akkam" ? "ሰላም / እንዴት ነህ?" : "Translation unavailable");

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  async function playAudio() {
    if (!audioSrc || playing) return;

    setAudioError(false);

    const audio = new Audio(audioSrc);
    audioRef.current = audio;

    audio.onended = () => {
      setPlaying(false);
      audioRef.current = null;
    };

    audio.onerror = () => {
      setPlaying(false);
      setAudioError(true);
      audioRef.current = null;
    };

    setPlaying(true);

    try {
      await audio.play();
    } catch {
      setPlaying(false);
      setAudioError(true);
      audioRef.current = null;
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-medium text-[var(--sea-ink)]/55">
          Build your vocabulary
        </p>

        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[var(--sea-ink)]">
          Word of the day
        </h2>
      </div>

      <Card className="overflow-hidden rounded-2xl border border-[var(--sea-ink)]/10 bg-white/60 shadow-sm">
        <CardContent className="flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex min-w-0 items-start gap-4 sm:items-center sm:gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--sand)]">
              <Headphones
                className="h-6 w-6 text-[var(--sea-ink)]"
                strokeWidth={1.8}
              />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-medium text-[var(--sea-ink)]/50">
                {language}
              </p>

              <h3 className="mt-1 text-3xl font-bold tracking-tight text-[var(--sea-ink)]">
                {word}
              </h3>

              {pronunciation && (
                <p className="mt-1 text-sm text-[var(--sea-ink)]/55">
                  {pronunciation}
                </p>
              )}

              <div className="mt-3 space-y-1 text-sm text-[var(--sea-ink)]/70">
                <p><span className="font-semibold">English:</span> {meaning}</p>
                <p><span className="font-semibold">Amharic:</span> {resolvedAmharic}</p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <Button
              type="button"
              variant="outline"
              onClick={playAudio}
              disabled={!audioSrc || playing}
              className="w-full rounded-xl border-[var(--sea-ink)]/15 bg-white/60 text-[var(--sea-ink)] hover:bg-[var(--sand)]/25 sm:w-auto"
              aria-label={`Listen to ${word} pronunciation`}
            >
              <Volume2 className="mr-2 h-4 w-4" />
              {playing ? "Playing..." : "Listen"}
            </Button>

            {audioError && (
              <p role="status" className="text-xs text-destructive">
                Audio couldn't be played. Try again later.
              </p>
            )}

            {!audioSrc && (
              <p className="text-xs text-[var(--sea-ink)]/50">
                Audio unavailable
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
