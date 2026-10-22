import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Volume2,
  Sparkles,
} from "lucide-react";

const languageCards = [
  {
    number: "01",
    language: "Amharic",
    native: "አማርኛ",
    word: "ሰላም",
    meaning: "Hello · Peace",
  },
  {
    number: "02",
    language: "Afaan Oromoo",
    native: "Afaan Oromoo",
    word: "Akkam",
    meaning: "Hello · How are you?",
  },
  {
    number: "03",
    language: "Tigrinya",
    native: "ትግርኛ",
    word: "ሰላም",
    meaning: "Hello · Peace",
  },
];

export function Hero() {
  // Afaan Oromoo starts in the center.
  const [centerIndex, setCenterIndex] = useState(1);

  // Automatically rotate the cards.
  useEffect(() => {
    const interval = window.setInterval(() => {
      setCenterIndex((current) => (current + 1) % languageCards.length);
    }, 3500);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="relative isolate mx-auto max-w-[1440px] overflow-hidden px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24 lg:px-12 lg:pt-28">
      {/* Ambient background lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -right-20 top-0 h-[420px] w-[420px] rounded-full bg-emerald-200/30 blur-[120px]" />
        <div className="absolute left-[25%] top-40 h-[320px] w-[320px] rounded-full bg-orange-200/20 blur-[110px]" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-teal-200/30 blur-[100px]" />
      </div>

      <div className="grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
        {/* Left: Introduction */}
        <div className="relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/50 px-4 py-2 text-sm font-medium text-[var(--sea-ink)] shadow-[0_4px_16px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl">
            <Sparkles className="h-4 w-4 text-orange-500" />
            Learn at your own pace
          </div>

          <div className="space-y-6">
            <h1 className="max-w-2xl text-5xl font-bold leading-[1.08] tracking-[-0.055em] text-[var(--sea-ink)] sm:text-6xl lg:text-7xl xl:text-[84px]">
              Discover a language.
              <span className="mt-2 block bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 bg-clip-text text-transparent">
                Connect with a culture.
              </span>
            </h1>

            <p className="max-w-lg text-base leading-8 text-[var(--sea-ink)]/65 sm:text-lg">
              Learn Ethiopian languages through short lessons, useful
              everyday words, and authentic pronunciation.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/learn"
              className="group inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-[var(--sea-ink)] px-6 py-4 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(15,23,42,0.16),inset_0_1px_0_rgba(255,255,255,0.16)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(15,23,42,0.2)] active:translate-y-0"
            >
              Start learning
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>

            <Link
              to="/dictionary"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/80 bg-white/50 px-6 py-4 text-sm font-semibold text-[var(--sea-ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_4px_16px_rgba(15,23,42,0.04)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/75 active:translate-y-0"
            >
              <BookOpen className="h-4 w-4" />
              Explore words
            </Link>
          </div>

          <p className="text-sm text-[var(--sea-ink)]/50">
            Start with one word. Build a connection that lasts.
          </p>
        </div>

        {/* Right: Rotating language cards */}
        <div className="relative mx-auto w-full max-w-[560px] lg:mr-0">
          {/* Ambient green glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-10 top-12 h-72 rounded-full bg-emerald-400/25 blur-[90px]"
          />

          {/* Card stage */}
          <div className="relative mx-auto h-[390px] w-full sm:h-[430px]">
            {languageCards.map((card, index) => {
              /*
               * Determine each card's position relative to the center.
               *
               * Center: active language
               * Left:   previous language
               * Right:  next language
               */
              const position =
                index === centerIndex
                  ? "center"
                  : index ===
                    (centerIndex + languageCards.length - 1) %
                    languageCards.length
                    ? "left"
                    : "right";

              const isCenter = position === "center";
              const isLeft = position === "left";

              const positionClasses = isCenter
                ? "left-1/2 top-7 z-30 -translate-x-1/2 hover:-translate-y-3"
                : isLeft
                  ? "left-[1%] top-14 z-10 -rotate-[9deg] hover:-translate-y-3 hover:-rotate-[12deg] sm:left-[2%]"
                  : "right-[-3%] top-14 z-20 rotate-[9deg] hover:-translate-y-3 hover:rotate-[12deg] sm:right-[-4%]";

              return (
                <article
                  key={card.number}
                  className={`group absolute h-[320px] w-[220px] overflow-hidden rounded-[28px] border border-white/20 bg-gradient-to-br from-[#19483c] via-[#10372e] to-[#09251f] p-5 text-[#f1f8f3] shadow-[0_25px_65px_rgba(9,37,31,0.25),inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-2xl transition-all duration-700 ease-in-out sm:h-[350px] sm:w-[240px] sm:p-6 ${positionClasses}`}
                >
                  {/* Reflective glass surface */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.17] via-transparent to-transparent"
                  />

                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-emerald-300/20 blur-[55px]"
                  />

                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-teal-300/15 blur-[45px]"
                  />

                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"
                  />

                  <div className="relative flex h-full flex-col">
                    {/* Card header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
                        <BookOpen className="h-5 w-5 text-emerald-100" />
                      </div>

                      <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/75">
                        {card.number} / 03
                      </span>
                    </div>

                    {/* Language and greeting */}
                    <div className="flex flex-1 flex-col items-center justify-center text-center">
                      <span className="rounded-full border border-emerald-200/20 bg-emerald-200/10 px-3 py-1.5 text-xs font-medium text-emerald-100">
                        {card.language}
                      </span>

                      <p className="mt-5 text-sm text-white/50">
                        {card.native}
                      </p>

                      <h2
                        className={`mt-2 whitespace-nowrap font-bold tracking-[-0.06em] text-white ${card.word === "Akkam"
                            ? "text-5xl sm:text-6xl"
                            : "text-6xl sm:text-7xl"
                          }`}
                      >
                        {card.word}
                      </h2>

                      <p className="mt-3 text-sm leading-6 text-white/65">
                        {card.meaning}
                      </p>
                    </div>

                    {/* Pronunciation button */}
                    <div className="flex justify-center">
                      <button
                        type="button"
                        aria-label={`Listen to ${card.word} in ${card.language}`}
                        title={`Listen to ${card.word}`}
                        className="flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white shadow-[0_8px_24px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.3)] backdrop-blur-2xl transition-all duration-300 hover:scale-110 hover:bg-white/25 active:scale-95"
                      >
                        <Volume2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Caption */}
          <div className="relative z-30 -mt-1 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/65 px-4 py-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.06),inset_0_1px_0_white] backdrop-blur-2xl">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-medium text-[var(--sea-ink)] sm:text-sm">
                Three languages. One place to begin.
              </span>
            </div>
          </div>

          {/* Floating badge */}
          <div className="absolute -right-1 top-1 z-40 hidden items-center gap-2 rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-[0_12px_32px_rgba(15,23,42,0.1),inset_0_1px_0_white] backdrop-blur-2xl sm:flex lg:-right-3">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
            <span className="text-xs font-medium text-[var(--sea-ink)]">
              A new language awaits
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
