import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpenCheck,
  Headphones,
  Languages,
  Layers3,
  Sparkles,
} from "lucide-react";

const steps = [
  {
    icon: Layers3,
    number: "01",
    title: "Choose a useful topic",
    description: "Begin with greetings, daily life, food, family, and other words you can use right away.",
  },
  {
    icon: Headphones,
    number: "02",
    title: "Listen and remember",
    description: "Hear approved pronunciation while learning each word with English and Amharic meaning support.",
  },
  {
    icon: BookOpenCheck,
    number: "03",
    title: "Practise at your pace",
    description: "Use short flashcard sessions and focused reviews to make new vocabulary stick.",
  },
];

const courses = [
  {
    code: "OM",
    name: "Afaan Oromoo",
    native: "Afaan Oromoo",
    sample: "Akkam",
    meaning: "Hello · How are you?",
    accent: "from-[#F5A843] to-[#E78435]",
  },
  {
    code: "AM",
    name: "Amharic",
    native: "አማርኛ",
    sample: "ሰላም",
    meaning: "Hello · Peace",
    accent: "from-[#4BAF8F] to-[#267760]",
  },
];

export function LandingSections() {
  return (
    <>
      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--sand)]/35 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--sea-ink)]">
            <Sparkles className="size-3.5" />
            Made for steady progress
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-[-0.035em] text-[var(--sea-ink)] sm:text-5xl">
            A simple rhythm that keeps you learning
          </h2>
          <p className="mt-5 text-base leading-8 text-[var(--sea-ink)]/60">
            Fidel turns real vocabulary into short, approachable sessions—so every visit moves you forward.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <article key={step.number} className="group relative overflow-hidden rounded-[1.75rem] border border-[var(--sea-ink)]/10 bg-white/60 p-6 shadow-[0_18px_50px_rgba(17,54,47,0.06)] backdrop-blur sm:p-8">
                <div aria-hidden="true" className="absolute -right-12 -top-12 size-36 rounded-full bg-[var(--sand)]/20 blur-3xl transition group-hover:bg-[var(--sand)]/35" />
                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--sea-ink)] text-white shadow-lg shadow-black/10">
                    <Icon className="size-5" />
                  </div>
                  <span className="text-sm font-bold tracking-widest text-[var(--sea-ink)]/25">{step.number}</span>
                </div>
                <h3 className="relative mt-8 text-xl font-bold text-[var(--sea-ink)]">{step.title}</h3>
                <p className="relative mt-3 text-sm leading-7 text-[var(--sea-ink)]/60">{step.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="languages" className="border-y border-[var(--sea-ink)]/8 bg-white/35">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-12">
          <div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#2E7D67]">
              <Languages className="size-4" />
              Ethiopian languages, thoughtfully taught
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-[-0.035em] text-[var(--sea-ink)] sm:text-5xl">
              Start with the language that connects you
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-[var(--sea-ink)]/60">
              Learn Afaan Oromoo or Amharic with clear translations, focused topics, and pronunciation that has been reviewed before it reaches your lesson.
            </p>
            <Link to="/sign-up" className="group mt-8 inline-flex items-center gap-2 rounded-2xl bg-[var(--sea-ink)] px-6 py-4 text-sm font-semibold text-white shadow-xl shadow-[var(--sea-ink)]/15 transition hover:-translate-y-0.5">
              Choose your language
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {courses.map((course) => (
              <article key={course.code} className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-[0_24px_60px_rgba(17,54,47,0.09)] backdrop-blur sm:p-8">
                <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${course.accent}`} />
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-[var(--sea-ink)] text-xs font-bold tracking-wider text-white">{course.code}</span>
                  <span className="rounded-full bg-[var(--sand)]/30 px-3 py-1 text-xs font-semibold text-[var(--sea-ink)]/65">Beginner friendly</span>
                </div>
                <p className="mt-8 text-sm font-medium text-[var(--sea-ink)]/50">{course.native}</p>
                <h3 className="mt-1 text-2xl font-bold text-[var(--sea-ink)]">{course.name}</h3>
                <div className="mt-8 rounded-2xl bg-[var(--bg-base)] p-5">
                  <p className="text-3xl font-bold tracking-tight text-[var(--sea-ink)]">{course.sample}</p>
                  <p className="mt-2 text-sm text-[var(--sea-ink)]/55">{course.meaning}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
        <div className="relative overflow-hidden rounded-[2.25rem] bg-[var(--sea-ink)] px-6 py-14 text-center text-white shadow-[0_30px_80px_rgba(17,54,47,0.22)] sm:px-12 sm:py-20">
          <div aria-hidden="true" className="absolute -left-24 -top-24 size-72 rounded-full bg-[#F4A340]/20 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-28 -right-20 size-80 rounded-full bg-[#54C7A4]/20 blur-3xl" />
          <div className="relative mx-auto max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/55">Your first word is waiting</p>
            <h2 className="mt-4 text-3xl font-bold tracking-[-0.035em] sm:text-5xl">Build a connection, one word at a time.</h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-white/65">Create your free learning profile, choose a language, and continue from exactly where you left off.</p>
            <Link to="/sign-up" className="group mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-bold text-[var(--sea-ink)] shadow-xl transition hover:-translate-y-0.5">
              Start learning free
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--sea-ink)]/8 px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-[var(--sea-ink)]/50 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold text-[var(--sea-ink)]">Fidel</p>
          <p>Learn Ethiopian languages with clarity and care.</p>
        </div>
      </footer>
    </>
  );
}
