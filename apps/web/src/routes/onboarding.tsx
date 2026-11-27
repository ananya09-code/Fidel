
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@clerk/tanstack-react-start";
import { FidelTeacherMark } from "@/components/common-ui/FidelTeacherMark";
import { NoelGuide } from "@/components/onboarding/NoelGuide";
import { NoelWeave } from "@/components/onboarding/NoelWeave";
import { characterFor } from "@/lib/character-cast";
import { InstallFidel, useFidelInstalled } from "@/components/install/InstallFidel";
import { PageState } from "@/components/common-ui/PageState";
import "@/components/common-ui/app-ui.css";
import "./onboarding.css";

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
  Pause,
  Play,
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
import { onboardingAppearance, readDeviceAppearance, type Appearance } from "@/lib/theme";
import type { ReactNode } from "react";
import { PushDeviceControls } from "@/components/settings-ui/PushDeviceControls";
import { TOUR_VERSION } from "@/lib/first-run";

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
  const [intro, setIntro] = useState(!initialPreferences.onboarding_completed);
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState(
    initialPreferences.onboarding_completed,
  );
  const [data, setData] = useState<OnboardingData>({
    language: initialPreferences.learning_language,
    level: initialPreferences.proficiency_level,
    motivations: initialPreferences.motivations,
    dailyGoal: initialPreferences.daily_goal_words,
    appearance: onboardingAppearance(initialPreferences.appearance, initialPreferences.onboarding_completed, readDeviceAppearance()),
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
    } else {
      setIntro(true);
    }
  }

  function handleStartLearning() {
    void navigate({ to: "/Home" });
  }

  return <OnboardingView intro={intro} onBegin={() => setIntro(false)} step={step} data={data} completed={completed} tourPending={initialPreferences.tour_completed_version < TOUR_VERSION} canContinue={Boolean(canContinue)} isSaving={updatePreferences.isPending} error={updatePreferences.error?.message} notificationControl={completed ? <PushDeviceControls variant="onboarding" /> : undefined} onBack={handleBack} onContinue={() => void handleContinue()} onStart={handleStartLearning} onLanguage={(language) => setData((current) => ({ ...current, language }))} onLevel={(level) => setData((current) => ({ ...current, level }))} onMotivation={toggleMotivation} onGoal={(dailyGoal) => setData((current) => ({ ...current, dailyGoal }))} onAppearance={(appearance) => { setData((current) => ({ ...current, appearance })); previewAppearance(appearance); }} />;
}

type OnboardingViewProps = {
 intro?: boolean; onBegin?: () => void; step: number; data: OnboardingData; completed: boolean; tourPending?: boolean; canContinue: boolean; isSaving?: boolean; error?: string; notificationControl?: ReactNode;
 onBack: () => void; onContinue: () => void; onStart: () => void;
 onLanguage: (value: Language) => void; onLevel: (value: Level) => void;
 onMotivation: (value: Motivation) => void; onGoal: (value: DailyGoal) => void; onAppearance: (value: Appearance) => void;
};

const storyLines = [
  "Start with a hello.",
  "Start from where you are.",
  "Keep your reason close.",
  "A few words, every day.",
  "Make this place yours.",
];

function OnboardingStory({ step, data, completed }: { step: number; data: OnboardingData; completed: boolean }) {
  const [motionPaused, setMotionPaused] = useState(false);
  const language = languages.find((item) => item.id === data.language);
  const note = completed ? "Ready for our first word?" : [
    language ? `${language.name}. Good choice!` : "Which language shall we learn?",
    data.level ? "I've got a place for you." : "Tell me what you already know.",
    data.motivations.length ? "I'll remember that." : "What brings you here?",
    `${data.dailyGoal} words a day? We can do that.`,
    "Which one feels like you?",
  ][step];
  return <aside className={`onboarding-story onboarding-story--${completed ? "complete" : step} ${motionPaused ? "onboarding-story--paused" : ""}`} aria-label="A note from Noel">
    <NoelWeave />
    <div className="onboarding-story-top"><span>Noel, your guide</span><span className="onboarding-story-controls"><span>{completed ? "05" : String(step + 1).padStart(2, "0")} / 05</span><button type="button" onClick={() => setMotionPaused((paused) => !paused)} aria-label={motionPaused ? "Play Noel's animation" : "Pause Noel's animation"}>{motionPaused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}</button></span></div>
    <div className="onboarding-story-art" key={completed ? "complete" : step}>
      <span className="onboarding-story-glyph" aria-hidden="true">{language?.nativeName ?? "ፊደል"}</span>
      <p className="onboarding-speech" aria-live="polite">{note}</p>
      <div className="onboarding-guide"><NoelGuide step={completed ? 5 : step} /></div>
      <div className="onboarding-scene-detail" aria-hidden="true">{completed ? "እንጀምር" : step === 0 ? "ሰላም  ·  Akkam  ·  ሰላም" : step === 3 ? `${data.dailyGoal} words / day` : language?.nativeName ?? "ፊደል"}</div>
    </div>
    <div className="onboarding-story-bottom"><h2>{completed ? "Let's begin." : storyLines[step]}</h2><p>Your first conversation is closer than you think.</p></div>
  </aside>;
}

export function OnboardingView({ intro, onBegin, step, data, completed, tourPending, canContinue, isSaving, error, notificationControl, onBack, onContinue, onStart, onLanguage, onLevel, onMotivation, onGoal, onAppearance }: OnboardingViewProps) {
  const installed = useFidelInstalled();
  const [welcomePaused, setWelcomePaused] = useState(false);
  const language = languages.find((item) => item.id === data.language);
  const level = levels.find((item) => item.id === data.level);
  if (intro) return <main className={`onboarding-welcome ${welcomePaused ? "onboarding-welcome--paused" : ""}`}>
    <NoelWeave />
    <Link to="/" className="app-wordmark" aria-label="Fidel home"><FidelTeacherMark className="app-header-mark" /><span>Fidel<span className="app-wordmark-dot">.</span></span></Link>
    <button type="button" className="onboarding-welcome-motion" onClick={() => setWelcomePaused((paused) => !paused)} aria-label={welcomePaused ? "Play Noel's scene" : "Pause Noel's scene"}>{welcomePaused ? <Play size={17} aria-hidden="true" /> : <Pause size={17} aria-hidden="true" />}</button>
    <div className="onboarding-welcome-center">
      <div className="onboarding-welcome-guide"><NoelGuide step={0} /></div>
      <h1>Hi, I'm Noel.</h1>
      <p>Tell me a little about yourself. We'll find the right words to start with.</p>
      <button type="button" className="app-primary" onClick={onBegin}>Let's begin <ArrowRight size={18} aria-hidden="true" /></button>
    </div>
    <span className="onboarding-welcome-foot">A word at a time, together.</span>
  </main>;
  return <main className="fidel-onboarding">
    <OnboardingStory step={step} data={data} completed={completed} />
    <div className="onboarding-work">
      <header className="onboarding-header">
        <Link to="/" className="app-wordmark" aria-label="Fidel home"><FidelTeacherMark className="app-header-mark" /><span>Fidel<span className="app-wordmark-dot">.</span></span></Link>
        {!completed && <span>Step {step + 1} of {steps.length}</span>}
      </header>
      <div className="onboarding-content">
        {completed ? <section className="onboarding-complete">
          <h1>A new conversation starts here.</h1>
          <p>{tourPending ? "Your plan is ready. Take a short tour to find your way around Fidel." : "Your learning plan is ready."}</p>
          <dl><div><dt>Learning</dt><dd>{language?.name ?? "Your language"}</dd></div><div><dt>Your level</dt><dd>{level?.title ?? "Your level"}</dd></div><div><dt>Daily goal</dt><dd>{data.dailyGoal} words</dd></div></dl>
          <div className="onboarding-finish-actions"><button type="button" className="app-primary" disabled={isSaving} onClick={onStart}>{tourPending ? "Take the tour" : "Start learning"}<ArrowRight size={18} aria-hidden="true" /></button><button type="button" className="app-secondary" disabled={isSaving} onClick={onBack}>Change my answers</button></div>
          {error && <p className="app-error" role="alert">{error}</p>}
          {notificationControl}
          {!installed && <div className="onboarding-install"><p>Want Fidel on your home screen?</p><InstallFidel /></div>}
        </section> : <>
          <progress className="onboarding-progress" value={step + 1} max={steps.length} aria-label="Setup progress" />
          <header className="onboarding-title"><h1>{steps[step].title}</h1><p>{steps[step].description}</p></header>
          <fieldset className={`onboarding-options onboarding-options--${step}`} disabled={isSaving}><legend className="sr-only">{steps[step].title}</legend>
            {step === 0 && languages.map((item) => <Choice key={item.id} selected={data.language === item.id} title={item.name + (item.id !== "om" ? " · " + item.nativeName : "")} description={item.description} image={characterFor(item.id, "student").image} onClick={() => onLanguage(item.id)} />)}
            {step === 1 && levels.map((item) => <Choice key={item.id} selected={data.level === item.id} title={item.title} description={item.description} onClick={() => onLevel(item.id)} />)}
            {step === 2 && <><p className="onboarding-select-note">Choose all that feel right.</p>{motivations.map((item) => <Choice key={item.id} selected={data.motivations.includes(item.id)} title={item.title} description={item.description} onClick={() => onMotivation(item.id)} />)}</>}
            {step === 3 && dailyGoals.map((item) => <Choice key={item.id} selected={data.dailyGoal === item.id} title={item.title} description={item.description} onClick={() => onGoal(item.id)} />)}
            {step === 4 && <AppearancePicker value={data.appearance} onChange={onAppearance} />}
          </fieldset>
          {error && <p className="app-error" role="alert">{error}</p>}
          <div className="onboarding-actions"><button type="button" className="app-secondary" onClick={onBack} disabled={isSaving}><ArrowLeft size={17} aria-hidden="true" />Back</button><button type="button" className="app-primary" onClick={onContinue} disabled={!canContinue || isSaving}>{isSaving && <LoaderCircle size={17} className="app-spinner" aria-hidden="true" />}{step === steps.length - 1 ? "Finish setup" : "Continue"}<ArrowRight size={17} aria-hidden="true" /></button></div>
          <p className="onboarding-note">You can change these choices in Settings.</p>
        </>}
      </div>
    </div>
  </main>;
}

function Choice({ selected, title, description, image, onClick }: { selected: boolean; title: string; description: string; image?: string; onClick: () => void }) {
 return <button type="button" className="app-choice" aria-pressed={selected} onClick={onClick}>{image && <img className="app-choice-character" src={image} alt="" width="40" height="52" />}<span><strong>{title}</strong><span>{description}</span></span><span className="choice-check" aria-hidden="true">{selected && <Check size={16} />}</span></button>;
}
