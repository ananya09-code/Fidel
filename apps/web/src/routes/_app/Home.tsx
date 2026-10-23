
import { createFileRoute } from "@tanstack/react-router";

import { Hero } from "@/components/homepage-ui/Hero";
import { LearningProgress } from "@/components/homepage-ui/LearningProgress";
import { ExploreTopics } from "@/components/homepage-ui/ExploreTopics";
import { WordOfTheDay } from "@/components/homepage-ui/WordOfTheDay";
import { DailyGoalCard } from "@/components/homepage-ui/DailyGoalCard";
import { ContinueLessonCard } from "@/components/homepage-ui/ContinueLessonCard";

export const Route = createFileRoute("/_app/Home")({
  component: HomePage,
});

function HomePage() {
  return (
    <main className="mx-auto w-full max-w-[1440px] space-y-10 px-4 py-6 sm:px-6 lg:space-y-14 lg:px-10 lg:py-10">
      {/* Welcome section */}
      <Hero />

      {/* Main learning experience */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DailyGoalCard
          goalMinutes={5}
          completedMinutes={2}
          streak={4}
          wordsLearned={12}
        />

        <ContinueLessonCard
          unitNumber={1}
          lessonNumber={1}
          completedCards={2}
          totalCards={5}
          onContinue={() => {
            // TODO: Connect to the lesson route.
          }}
        />
      </section>

      {/* Personal learning statistics */}
      <LearningProgress />

      {/* Discover new learning categories */}
      <ExploreTopics />

      {/* Daily vocabulary */}
      <WordOfTheDay />
    </main>
  );
}
