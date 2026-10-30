import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { ContinueLessonCard } from "@/components/homepage-ui/ContinueLessonCard";
import { PageState } from "@/components/common-ui/PageState";
import { DailyGoalCard } from "@/components/homepage-ui/DailyGoalCard";
import { ExploreTopics } from "@/components/homepage-ui/ExploreTopics";
import { Hero } from "@/components/homepage-ui/Hero";
import { LearningProgress } from "@/components/homepage-ui/LearningProgress";
import { WordOfTheDay } from "@/components/homepage-ui/WordOfTheDay";
import { useDashboard } from "@/hooks/use-dashboard";
import { usePreferences } from "@/hooks/use-preferences";
import { useDailyWord } from "@/hooks/use-words";

export const Route = createFileRoute("/_app/Home")({ component: HomePage });

function HomePage() {
  const dashboard = useDashboard();
  const preferences = usePreferences();
  const navigate = useNavigate();
  const languageCode = preferences.data?.learning_language ?? "om";
  const dailyWord = useDailyWord(languageCode);

  if (dashboard.isPending || preferences.isPending) {
    return <PageState kind="loading" title="Loading your dashboard" />;
  }
  if (dashboard.isError || preferences.isError || !dashboard.data) {
    const error = dashboard.error ?? preferences.error;
    return <PageState kind="error" title="Couldn't load your dashboard" description={error?.message ?? "No dashboard data was returned."} actionLabel="Try again" onAction={() => { void dashboard.refetch(); void preferences.refetch(); }} />;
  }

  const data = dashboard.data;
  const current = data.current_lesson;
  return (
    <main className="mx-auto w-full max-w-[1440px] space-y-10 px-4 py-6 sm:px-6 lg:space-y-14 lg:px-10 lg:py-10">
      <Hero />
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DailyGoalCard
          goalWords={data.daily_word_goal}
          completedWords={data.words_learned_today}
          streak={data.streak_days}
          wordsLearned={data.learned_words}
        />
        {current ? (
          <ContinueLessonCard
            completedCards={current.question_index}
            totalCards={current.question_count}
            title={current.title}
            description={current.stage === "practice" ? "Continue your practice questions." : "Continue learning where you stopped."}
            onContinue={() => void navigate({
              to: "/Learn/$lessonId",
              params: { lessonId: current.lesson_key },
              search: { language_code: languageCode },
            })}
          />
        ) : (
          <section className="flex flex-col justify-center rounded-[28px] border border-[var(--sea-ink)]/10 bg-white/55 p-8">
            <h2 className="text-2xl font-semibold text-[var(--sea-ink)]">Choose your next lesson</h2>
            <p className="mt-2 text-sm text-[var(--sea-ink)]/55">Your next available lesson is waiting on the learning path.</p>
            <button type="button" onClick={() => void navigate({ to: "/Learn" })} className="mt-6 w-fit rounded-xl bg-[var(--sea-ink)] px-5 py-3 text-sm font-semibold text-white">View learning path</button>
          </section>
        )}
      </section>
      <LearningProgress
        wordsLearned={data.learned_words}
        lessonsCompleted={data.lessons_completed}
        streakDays={data.streak_days}
      />
      <ExploreTopics />
      {dailyWord.isPending ? (
        <PageState kind="loading" title="Loading the word of the day" compact />
      ) : dailyWord.isError ? (
        <PageState kind="error" title="Couldn't load the word of the day" description={dailyWord.error.message} actionLabel="Try again" onAction={() => void dailyWord.refetch()} compact />
      ) : dailyWord.data ? (
        <WordOfTheDay
          word={dailyWord.data.text}
          pronunciation={dailyWord.data.transliteration ?? undefined}
          meaning={dailyWord.data.translations.find((item) => item.language_code === "en")?.meaning ?? dailyWord.data.meaning ?? "Translation unavailable"}
          amharicMeaning={dailyWord.data.translations.find((item) => item.language_code === "am")?.meaning}
          audioSrc={dailyWord.data.audio.url ?? undefined}
          language={languageCode === "am" ? "Amharic" : "Afaan Oromoo"}
        />
      ) : (
        <PageState kind="empty" title="No daily word available" description="Approved vocabulary will appear here when it is ready." compact />
      )}
    </main>
  );
}
