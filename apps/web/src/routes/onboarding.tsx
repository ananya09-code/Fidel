
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@clerk/tanstack-react-start";
import { FidelTeacherMark } from "@/components/common-ui/FidelTeacherMark";
import { InstallFidel, useFidelInstalled } from "@/components/install/InstallFidel";
import { PageState } from "@/components/common-ui/PageState";
import "@/components/common-ui/app-ui.css";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  GraduationCap,
  Heart,
  Languages,
  MessageCircle,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";




import { AuthLoading } from "@/components/auth/AuthLoading";
import {
  usePreferences,
  useUpdatePreferences,
} from "@/hooks/use-preferences";
import type { UserPreferences } from "@/lib/api/preferences";
import { AppearancePicker } from "@/components/theme/AppearancePicker";
import { LoaderCircle } from "lucide-react";
import { useThemePreview } from "@/components/theme/ThemeProvider";
import type { Appearance } from "@/lib/theme";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

type Language = "om" | "am" | "ti";
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
  appearance: Appearance;
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
    description: "How many words would you like to learn each day?",
  },
  {
    title: "Make yourself comfortable",
    description: "Choose how Fidel looks. Try a theme to preview it now.",
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
  {
    id: "ti" as const,
    name: "Tigrinya",
    nativeName: "ትግርኛ",
    description: "Begin with everyday words in Tigrinya’s own script.",
    symbol: "ት",
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
    title: "5 words",
    description: "A small daily habit",
    icon: Zap,
  },
  {
    id: 10 as const,
    title: "10 words",
    description: "A comfortable pace",
    icon: BookOpen,
  },
  {
    id: 15 as const,
    title: "15 words",
    description: "Ready to make progress",
    icon: Target,
  },
  {
    id: 20 as const,
    title: "20 words",
    description: "I'm ready for more",
    icon: Trophy,
  },
];

function OnboardingPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const preferencesQuery = usePreferences();

  useEffect(() => {
    if (!isLoaded || isSignedIn) return;
    window.location.replace("/sign-in?redirect=%2Fonboarding");
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || !isSignedIn || preferencesQuery.isPending) {
    return <AuthLoading />;
  }

  if (preferencesQuery.isError) {
    return <main className="app-standalone"><h1>Let’s get you started</h1><PageState kind="error" title="We couldn’t load your setup" description={preferencesQuery.error.message} actionLabel="Try again" onAction={() => void preferencesQuery.refetch()} /></main>;
  }

  return <OnboardingFlow initialPreferences={preferencesQuery.data} />;
}

function OnboardingFlow({
  initialPreferences,
}: {
  initialPreferences: UserPreferences;
}) {
  const navigate = useNavigate();
  const previewAppearance = useThemePreview();
  const updatePreferences = useUpdatePreferences();
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState(
    initialPreferences.onboarding_completed,
  );
  const [data, setData] = useState<OnboardingData>({
    language: initialPreferences.learning_language,
    level: initialPreferences.proficiency_level,
    motivations: initialPreferences.motivations,
    dailyGoal: initialPreferences.daily_goal_words,
    appearance: initialPreferences.appearance,
  });



  const canContinue =
    (step === 0 && data.language !== null) ||
    (step === 1 && data.level !== null) ||
    (step === 2 && data.motivations.length > 0) ||
    step === 3 || step === 4;


  function toggleMotivation(id: Motivation) {
    setData((current) => ({
      ...current,
      motivations: current.motivations.includes(id)
        ? current.motivations.filter((item) => item !== id)
        : [...current.motivations, id],
    }));
  }

  async function handleContinue() {
    if (!canContinue) return;

    if (step < steps.length - 1) {
      setStep((current) => current + 1);
      return;
    }

    if (!data.language || !data.level) return;

    try {
      await updatePreferences.mutateAsync({
        learning_language: data.language,
        proficiency_level: data.level,
        motivations: data.motivations,
        daily_goal_words: data.dailyGoal,
        appearance: data.appearance,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        onboarding_completed: true,
      });
      setCompleted(true);
    } catch {
      // The mutation exposes the API error beside the navigation controls.
    }
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
    void navigate({ to: "/Learn" });
  }


  return <OnboardingView step={step} data={data} completed={completed} canContinue={Boolean(canContinue)} isSaving={updatePreferences.isPending} error={updatePreferences.error?.message} onBack={handleBack} onContinue={() => void handleContinue()} onStart={handleStartLearning} onLanguage={(language) => setData((current) => ({ ...current, language }))} onLevel={(level) => setData((current) => ({ ...current, level }))} onMotivation={toggleMotivation} onGoal={(dailyGoal) => setData((current) => ({ ...current, dailyGoal }))} onAppearance={(appearance) => { setData((current) => ({ ...current, appearance })); previewAppearance(appearance); }} />;
}

type OnboardingViewProps = {
 step: number; data: OnboardingData; completed: boolean; canContinue: boolean; isSaving?: boolean; error?: string;
 onBack: () => void; onContinue: () => void; onStart: () => void;
 onLanguage: (value: Language) => void; onLevel: (value: Level) => void;
 onMotivation: (value: Motivation) => void; onGoal: (value: DailyGoal) => void; onAppearance: (value: Appearance) => void;
};

export function OnboardingView({ step, data, completed, canContinue, isSaving, error, onBack, onContinue, onStart, onLanguage, onLevel, onMotivation, onGoal, onAppearance }: OnboardingViewProps) {
 const installed = useFidelInstalled();
 const language = languages.find((item) => item.id === data.language);
 const level = levels.find((item) => item.id === data.level);
 return <main className="fidel-onboarding">
  <header className="onboarding-header"><Link to="/" className="app-wordmark" aria-label="Fidel home"><FidelTeacherMark className="app-header-mark" /><span>Fidel<span className="app-wordmark-dot">.</span></span></Link>{!completed && <span>{step + 1} of {steps.length}</span>}</header>
  <div className="onboarding-content">
   {completed ? <section className="onboarding-complete"><FidelTeacherMark className="onboarding-teacher" /><h1>A new conversation starts here.</h1><p>Your learning plan is ready.</p><dl><div><dt>Learning</dt><dd>{language?.name ?? "Your language"}</dd></div><div><dt>Your level</dt><dd>{level?.title ?? "Your level"}</dd></div><div><dt>Daily goal</dt><dd>{data.dailyGoal} words</dd></div></dl><button type="button" className="app-primary" onClick={onStart}>Start learning<ArrowRight size={18} aria-hidden="true" /></button><button type="button" className="app-secondary" onClick={onBack}>Change my answers</button>{!installed && <div className="onboarding-install"><p>Want Fidel on your home screen?</p><InstallFidel /></div>}</section> : <>
    <progress className="onboarding-progress" value={step + 1} max={steps.length} aria-label="Setup progress" />
    <header className="onboarding-title"><h1>{steps[step].title}</h1><p>{steps[step].description}</p></header>
    <fieldset className="onboarding-options" disabled={isSaving}><legend className="sr-only">{steps[step].title}</legend>
    {step === 0 && languages.map((item) => <Choice key={item.id} selected={data.language === item.id} title={item.name + (item.id !== "om" ? " · " + item.nativeName : "")} description={item.description} onClick={() => onLanguage(item.id)} />)}
    {step === 1 && levels.map((item) => <Choice key={item.id} selected={data.level === item.id} title={item.title} description={item.description} onClick={() => onLevel(item.id)} />)}
    {step === 2 && <><p className="onboarding-select-note">Choose all that feel right.</p>{motivations.map((item) => <Choice key={item.id} selected={data.motivations.includes(item.id)} title={item.title} description={item.description} onClick={() => onMotivation(item.id)} />)}</>}
    {step === 3 && dailyGoals.map((item) => <Choice key={item.id} selected={data.dailyGoal === item.id} title={item.title} description={item.description} onClick={() => onGoal(item.id)} />)}
    {step === 4 && <AppearancePicker value={data.appearance} onChange={onAppearance} />}
    </fieldset>
    {error && <p className="app-error" role="alert">{error}</p>}
    <div className="onboarding-actions"><button type="button" className="app-secondary" onClick={onBack} disabled={step === 0 || isSaving}><ArrowLeft size={17} aria-hidden="true" />Back</button><button type="button" className="app-primary" onClick={onContinue} disabled={!canContinue || isSaving}>{isSaving && <LoaderCircle size={17} className="app-spinner" aria-hidden="true" />}{step === steps.length - 1 ? "Finish setup" : "Continue"}<ArrowRight size={17} aria-hidden="true" /></button></div>
    <p className="onboarding-note">You can change these choices in Settings.</p>
   </>}
  </div>
 </main>;
}

function Choice({ selected, title, description, onClick }: { selected: boolean; title: string; description: string; onClick: () => void }) {
 return <button type="button" className="app-choice" aria-pressed={selected} onClick={onClick}><span><strong>{title}</strong><span>{description}</span></span><span className="choice-check" aria-hidden="true">{selected && <Check size={16} />}</span></button>;
}
