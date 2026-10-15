import { useState } from "react";
import { Headphones, Volume2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

type WordOfTheDayProps = {
  word?: string;
  pronunciation?: string;
  meaning?: string;
  audioSrc?: string;
};

export function WordOfTheDay({
  word = "Akkam",
  pronunciation = "Pronunciation to be verified",
  meaning = "Hello / How?",
  audioSrc,
}: WordOfTheDayProps) {
  const [playing, setPlaying] = useState(false);

  async function playAudio() {
    if (!audioSrc || playing) return;

    const audio = new Audio(audioSrc);
    setPlaying(true);

    audio.onended = () => setPlaying(false);
    audio.onerror = () => setPlaying(false);

    try {
      await audio.play();
    } catch {
      setPlaying(false);
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Word of the day</h2>

        <p className="mt-1 text-sm text-muted-foreground">
          A little Afaan Oromoo every day.
        </p>
      </div>

      <Card className="rounded-3xl border-[var(--foam)]">
        <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[var(--sand)]">
              <Headphones className="h-8 w-8 text-[var(--sea-ink)]" />
            </div>

            <div>
              <h3 className="text-3xl font-bold text-[var(--sea-ink)]">
                {word}
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                {pronunciation}
              </p>

              <p className="mt-2 font-medium">{meaning}</p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={playAudio}
            disabled={!audioSrc || playing}
            className="rounded-xl"
          >
            <Volume2 className="mr-2 h-4 w-4" />
            {playing ? "Playing..." : "Listen"}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
