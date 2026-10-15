import { createFileRoute } from "@tanstack/react-router";

import { Hero } from "@/components/homepage-ui/Hero";
import { LearningProgress } from "@/components/homepage-ui/LearningProgress";
import { ExploreTopics } from "@/components/homepage-ui/ExploreTopics";
import { WordOfTheDay } from "@/components/homepage-ui/WordOfTheDay";
export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <main className="mx-auto w-full max-w-[1440px] space-y-10 px-4 py-6 sm:px-6 lg:space-y-14 lg:px-10 lg:py-10">
      {/* Keep the Hero we already created */}
      <Hero />

      {/* Main learning experience */}

      {/* Personal learning statistics */}
      <LearningProgress />

      {/* Discover new learning categories */}
      <ExploreTopics />

      {/* Daily vocabulary */}
      <WordOfTheDay />
    </main>
  );
}
