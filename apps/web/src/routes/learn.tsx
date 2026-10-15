import { createFileRoute } from "@tanstack/react-router";

import { LearningPath } from "@/components/learn-ui/LearningPath";
import { LearnProgress } from "@/components/learn-ui/LearnProgress";
import { LearnOverview } from "@/components/learn-ui/LearnOverview";

export const Route = createFileRoute("/learn")({
  component: LearnPage,
});

function LearnPage() {
  return (
    <main className="w-full min-w-0">
      <div className="mx-auto w-full max-w-[1400px] space-y-10 px-5 py-6 sm:px-7 sm:py-8 lg:space-y-12 lg:px-10 lg:py-10 xl:px-12">
        <LearnOverview />

        <LearningPath />

        <LearnProgress />
      </div>
    </main>
  );
}
