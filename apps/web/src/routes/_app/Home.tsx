import { createFileRoute } from "@tanstack/react-router";

import { HomeDashboard } from "@/components/homepage-ui/HomeDashboard";
import { PageState } from "@/components/common-ui/PageState";
import { ExploreTopics } from "@/components/homepage-ui/ExploreTopics";
import { WordOfTheDay } from "@/components/homepage-ui/WordOfTheDay";
import { useDashboard } from "@/hooks/use-dashboard";
import { usePreferences } from "@/hooks/use-preferences";
import { useDailyWord } from "@/hooks/use-words";
import { MemoryCheck } from "@/components/learn-ui/review/MemoryCheck";

export const Route = createFileRoute("/_app/Home")({ component: HomePage });

function HomePage() {
  const dashboard = useDashboard();
  const preferences = usePreferences();
  const languageCode = preferences.data?.learning_language ?? "om";
  const dailyWord = useDailyWord(languageCode);

  if (dashboard.isPending || preferences.isPending) {
    return <div className="fidel-home"><h1 className="text-2xl font-medium">Your learning, today.</h1><PageState kind="loading" title="Loading your dashboard" /></div>;
  }
  if (dashboard.isError || preferences.isError || !dashboard.data) {
    const error = dashboard.error ?? preferences.error;
    return <div className="fidel-home"><header className="home-title"><h1>Your learning, today.</h1></header><PageState kind="error" title="Couldn't load your dashboard" description={error?.message ?? "No dashboard data was returned."} actionLabel="Try again" onAction={() => { void dashboard.refetch(); void preferences.refetch(); }} /></div>;
  }

  return (
    <HomeDashboard data={dashboard.data} languageCode={languageCode} memoryCheck={<MemoryCheck />} topics={<ExploreTopics />} dailyWord={
      dailyWord.isPending ? (
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
      )
    } />
  );
}
