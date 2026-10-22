
import { createFileRoute, Link } from "@tanstack/react-router";
import fidelLogo from "@/assets/fidallogo.png";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Clock3,
  GraduationCap,
  Heart,
  Languages,
  MessageCircle,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

type Language = "om" | "am";
type Level = "beginner" | "some" | "conversational" | "improving";
type Motivation =
  | "family"
  | "conversation"
  | "culture"
  | "work"
  | "travel"
  | "literacy"
  | "personal";
type DailyGoal = 5 | 10 | 15 | 20;

type OnboardingData = {
  language: Language | null;
  level: Level | null;
  motivations: Motivation[];
  dailyGoal: DailyGoal;
};

const steps = [
  {
    title: "Choose your language",
    description: "Which language would you like to learn?",
  },
  {
    title: "Where are you starting?",
    description: "We'll help you find the right place to begin.",
  },
  {
    title: "What brings you to Fidel?",
    description: "Choose what matters most to you.",
  },
  {
    title: "Set your daily goal",
    description: "Small steps can lead to big progress.",
  },
];

const languages = [
  {
    id: "om" as const,
    name: "Afaan Oromoo",
    nativeName: "Afaan Oromoo",
    description: "Learn words, expressions, and everyday conversations.",
    symbol: "A",
    colors: "bg-[var(--sand)]/60",
  },
  {
    id: "am" as const,
    name: "Amharic",
    nativeName: "አማርኛ",
    description: "Build confidence in one of Ethiopia's major languages.",
    symbol: "አ",
    colors: "bg-[var(--foam)]",
  },
];

const levels = [
  {
    id: "beginner" as const,
    icon: Sparkles,
    title: "Complete beginner",
    description: "I'm starting from zero.",
  },
  {
    id: "some" as const,
    icon: BookOpen,
    title: "I know a little",
    description: "I already know a few words and phrases.",
  },
  {
    id: "conversational" as const,
    icon: MessageCircle,
    title: "I can have simple conversations",
    description: "I understand some of the language.",
  },
  {
    id: "improving" as const,
    icon: GraduationCap,
    title: "I want to improve",
    description: "I know the language but want to get better.",
  },
];

const motivations = [
  {
    id: "family" as const,
    icon: Heart,
    title: "Family & friends",
    description: "Connect with the people I care about.",
  },
  {
    id: "conversation" as const,
    icon: MessageCircle,
    title: "Everyday conversations",
    description: "Speak more naturally in daily life.",
  },
  {
    id: "culture" as const,
    icon: Languages,
    title: "Culture & heritage",
    description: "Connect with my roots and culture.",
  },
  {
    id: "work" as const,
    icon: GraduationCap,
    title: "Work & education",
    description: "Use the language professionally or academically.",
  },
  {
    id: "travel" as const,
    icon: Sparkles,
    title: "Travel",
    description: "Feel confident visiting new places.",
  },
  {
    id: "literacy" as const,
    icon: BookOpen,
    title: "Reading & writing",
    description: "Improve my language and literacy skills.",
  },
  {
    id: "personal" as const,
    icon: Target,
    title: "Personal growth",
    description: "Learn something new for myself.",
  },
];

const dailyGoals = [
  {
    id: 5 as const,
    title: "5 minutes",
    description: "A small daily habit",
    icon: Zap,
  },
  {
    id: 10 as const,
    title: "10 minutes",
    description: "A comfortable pace",
    icon: Clock3,
  },
  {
    id: 15 as const,
    title: "15 minutes",
    description: "Ready to make progress",
    icon: Target,
  },
  {
    id: 20 as const,
    title: "20 minutes",
    description: "I'm ready for more",
    icon: Trophy,
  },
];

function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState(false);

  const [data, setData] = useState<OnboardingData>({
    language: null,
    level: null,
    motivations: [],
    dailyGoal: 5,
  });

  const progress = completed ? 100 : ((step + 1) / steps.length) * 100;

  const canContinue =
    (step === 0 && data.language !== null) ||
    (step === 1 && data.level !== null) ||
    (step === 2 && data.motivations.length > 0) ||
    step === 3;

  const selectedLanguage = languages.find(
    (language) => language.id === data.language,
  );

  const selectedLevel = levels.find((level) => level.id === data.level);

  function toggleMotivation(id: Motivation) {
    setData((current) => ({
      ...current,
      motivations: current.motivations.includes(id)
        ? current.motivations.filter((item) => item !== id)
        : [...current.motivations, id],
    }));
  }

  function handleContinue() {
    if (!canContinue) return;

    if (step < steps.length - 1) {
      setStep((current) => current + 1);
      return;
    }

    // UI-only for now. Connect this data to FastAPI later.
    console.log("Fidel onboarding completed:", data);
    setCompleted(true);
  }

  function handleBack() {
    if (completed) {
      setCompleted(false);
      setStep(steps.length - 1);
      return;
    }

    if (step > 0) {
      setStep((current) => current - 1);
    }
  }

  function handleStartLearning() {
    // Connect to the first lesson route when it is ready.
    console.log("Ready to start learning:", data);
  }

  return (
    <main className="relative isolate flex min-h-screen flex-col overflow-hidden bg-[var(--bg-base)] text-[var(--sea-ink)]">
      {/* Soft background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[var(--foam)]/70 blur-3xl" />
        <div className="absolute -right-40 top-20 h-96 w-96 rounded-full bg-[var(--sand)]/50 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-orange-100/20 blur-3xl" />
      </div>

      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link
          to="/"
          className="relative z-10 flex shrink-0 items-center gap-2.5"
          aria-label="Fidel home"
        >
          <img
            src={fidelLogo}
            alt="Fidel"
            className="h-10 w-10 object-contain drop-shadow-sm"
          />
          <span className="text-xl font-bold tracking-tight text-[var(--sea-ink)]">
            Fidel
          </span>
        </Link>

        {!completed && (
          <span className="text-sm font-medium text-slate-500">
            <span className="hidden sm:inline">Getting started · </span>
            {step + 1} of {steps.length}
          </span>
        )}
      </header>

      {/* Orange progress bar */}
      <div className="mx-auto w-full max-w-3xl px-5 sm:px-8">
        <Progress
          value={progress}
          className="h-1.5 bg-slate-200/70 [&>div]:bg-orange-500"
        />
      </div>

      {/* Main */}
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 pb-8 pt-8 sm:px-8 sm:pt-12">
        {completed ? (
          <CompletionScreen
            language={selectedLanguage?.name ?? "your language"}
            level={selectedLevel?.title ?? "your level"}
            dailyGoal={data.dailyGoal}
            onBack={handleBack}
            onStart={handleStartLearning}
          />
        ) : (
          <>
            {/* Step heading */}
            <div className="mb-8 text-center sm:mb-10">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200/70 bg-white/70 text-[var(--sea-ink)] shadow-sm backdrop-blur">
                {step === 0 && <Languages className="h-6 w-6" />}
                {step === 1 && <GraduationCap className="h-6 w-6" />}
                {step === 2 && <Heart className="h-6 w-6" />}
                {step === 3 && <Target className="h-6 w-6" />}
              </div>

              <p className="mb-2 text-sm font-semibold tracking-wide text-orange-600">
                Let's personalize your journey
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-4xl">
                {steps[step].title}
              </h1>

              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500 sm:text-base">
                {steps[step].description}
              </p>
            </div>

            {/* Step 1: Language selection */}
            {step === 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {languages.map((language) => {
                  const selected = data.language === language.id;

                  return (
                    <button
                      key={language.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        setData((current) => ({
                          ...current,
                          language: language.id,
                        }))
                      }
                      className={`group relative flex min-h-56 flex-col rounded-3xl border-2 p-6 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sea-ink)] focus-visible:ring-offset-2 ${selected
                        ? "border-[var(--sea-ink)] bg-white shadow-md"
                        : `border-white/80 ${language.colors} hover:border-slate-300`
                        }`}
                    >
                      {selected && (
                        <span className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--sea-ink)] text-white">
                          <Check className="h-4 w-4" />
                        </span>
                      )}

                      {/* Orange language icon */}
                      <span
                        className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl font-bold shadow-sm ${selected
                          ? "bg-orange-500 text-white"
                          : "bg-orange-50 text-orange-600"
                          }`}
                      >
                        {language.symbol}
                      </span>

                      <span className="text-xl font-bold text-[var(--sea-ink)]">
                        {language.name}
                      </span>

                      <span className="mt-1 text-sm font-medium text-slate-500">
                        {language.nativeName}
                      </span>

                      <span className="mt-3 text-sm leading-6 text-slate-600">
                        {language.description}
                      </span>

                      <span className="mt-auto flex items-center gap-2 pt-5 text-xs font-semibold text-slate-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                        Start your journey
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 2: Current level */}
            {step === 1 && (
              <div className="grid gap-3">
                {levels.map((level) => {
                  const selected = data.level === level.id;
                  const Icon = level.icon;

                  return (
                    <SelectionCard
                      key={level.id}
                      selected={selected}
                      onClick={() =>
                        setData((current) => ({
                          ...current,
                          level: level.id,
                        }))
                      }
                      icon={<Icon className="h-5 w-5" />}
                      title={level.title}
                      description={level.description}
                    />
                  );
                })}
              </div>
            )}

            {/* Step 3: Motivation */}
            {step === 2 && (
              <>
                <p className="mb-4 text-center text-xs text-slate-400">
                  Select all that apply.
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  {motivations.map((motivation) => {
                    const selected = data.motivations.includes(motivation.id);
                    const Icon = motivation.icon;

                    return (
                      <SelectionCard
                        key={motivation.id}
                        selected={selected}
                        onClick={() => toggleMotivation(motivation.id)}
                        icon={<Icon className="h-5 w-5" />}
                        title={motivation.title}
                        description={motivation.description}
                      />
                    );
                  })}
                </div>
              </>
            )}

            {/* Step 4: Daily goal */}
            {step === 3 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {dailyGoals.map((goal) => {
                  const selected = data.dailyGoal === goal.id;
                  const Icon = goal.icon;

                  return (
                    <button
                      key={goal.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        setData((current) => ({
                          ...current,
                          dailyGoal: goal.id,
                        }))
                      }
                      className={`flex items-center gap-4 rounded-2xl border-2 p-5 text-left transition duration-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sea-ink)] focus-visible:ring-offset-2 ${selected
                        ? "border-[var(--sea-ink)] bg-white shadow-sm"
                        : "border-white/80 bg-white/60 hover:border-slate-300"
                        }`}
                    >
                      <span
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${selected
                          ? "bg-orange-500 text-white"
                          : "bg-orange-50 text-orange-600"
                          }`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-[var(--sea-ink)]">
                          {goal.title}
                        </span>
                        <span className="mt-1 block text-sm text-slate-500">
                          {goal.description}
                        </span>
                      </span>

                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected
                          ? "border-[var(--sea-ink)] bg-[var(--sea-ink)] text-white"
                          : "border-slate-300"
                          }`}
                      >
                        {selected && <Check className="h-3 w-3" />}
                      </span>
                    </button>
                  );
                })}

                <p className="mt-2 text-center text-xs leading-5 text-slate-400 sm:col-span-2">
                  You can always change your daily goal later.
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between gap-4 border-t border-slate-200/60 pt-6 sm:mt-10">
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                disabled={step === 0}
                className="gap-2 text-slate-600 hover:text-[var(--sea-ink)]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              <Button
                type="button"
                onClick={handleContinue}
                disabled={!canContinue}
                className="h-12 min-w-36 gap-2 rounded-xl bg-[var(--sea-ink)] px-6 text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {step === steps.length - 1 ? "Finish setup" : "Continue"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <p className="mt-5 text-center text-xs text-slate-400">
              No pressure. You can change your preferences later.
            </p>
          </>
        )}
      </div>
    </main>
  );
}

type SelectionCardProps = {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
};

function SelectionCard({
  selected,
  onClick,
  icon,
  title,
  description,
}: SelectionCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`group flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition duration-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sea-ink)] focus-visible:ring-offset-2 sm:p-5 ${selected
        ? "border-[var(--sea-ink)] bg-white shadow-sm"
        : "border-white/80 bg-white/60 hover:border-slate-300"
        }`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${selected
          ? "bg-orange-500 text-white"
          : "bg-orange-50 text-orange-600 group-hover:bg-orange-100"
          }`}
      >
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-[var(--sea-ink)]">
          {title}
        </span>
        <span className="mt-1 block text-sm leading-5 text-slate-500">
          {description}
        </span>
      </span>

      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${selected
          ? "border-[var(--sea-ink)] bg-[var(--sea-ink)] text-white"
          : "border-slate-300 bg-white"
          }`}
      >
        {selected && <Check className="h-3 w-3" />}
      </span>
    </button>
  );
}

type CompletionScreenProps = {
  language: string;
  level: string;
  dailyGoal: DailyGoal;
  onBack: () => void;
  onStart: () => void;
};

function CompletionScreen({
  language,
  level,
  dailyGoal,
  onBack,
  onStart,
}: CompletionScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
      <div className="relative mb-8">
        <div className="flex h-28 w-28 items-center justify-center rounded-[2rem] bg-[var(--sea-ink)] shadow-xl shadow-slate-900/10">
          <span className="text-5xl font-bold text-white">ፊ</span>
        </div>

        <span className="absolute -right-3 -top-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-white bg-white text-orange-500 shadow-md">
          <Sparkles className="h-6 w-6" />
        </span>
      </div>

      <p className="mb-3 text-sm font-semibold tracking-wide text-orange-600">
        Your journey starts now
      </p>

      <h1 className="max-w-lg text-3xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
        You're ready to learn!
      </h1>

      <p className="mt-4 max-w-md text-sm leading-7 text-slate-500 sm:text-base">
        Your first step toward a new language starts here. Let's learn something
        useful today.
      </p>

      <Card className="mt-8 w-full max-w-md rounded-3xl border-white/80 bg-white/70 p-5 text-left shadow-sm backdrop-blur-md sm:p-6">
        <h2 className="mb-5 flex items-center gap-2 font-semibold text-[var(--sea-ink)]">
          <Sparkles className="h-4 w-4 text-orange-500" />
          Your learning plan
        </h2>

        <div className="space-y-4">
          <SummaryRow
            icon={<Languages className="h-4 w-4" />}
            label="Learning"
            value={language}
          />

          <SummaryRow
            icon={<GraduationCap className="h-4 w-4" />}
            label="Your level"
            value={level}
          />

          <SummaryRow
            icon={<Clock3 className="h-4 w-4" />}
            label="Daily goal"
            value={`${dailyGoal} minutes a day`}
          />
        </div>
      </Card>

      <Button
        type="button"
        onClick={onStart}
        className="mt-8 h-12 w-full max-w-md gap-2 rounded-xl bg-[var(--sea-ink)] text-white shadow-sm hover:opacity-90"
      >
        Start my first lesson
        <ArrowRight className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        onClick={onBack}
        className="mt-3 gap-2 text-slate-500 hover:text-[var(--sea-ink)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Change my answers
      </Button>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--foam)] text-[var(--sea-ink)]">
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-xs text-slate-500">{label}</span>
        <span className="mt-0.5 block truncate text-sm font-semibold text-[var(--sea-ink)]">
          {value}
        </span>
      </span>
    </div>
  );
}
