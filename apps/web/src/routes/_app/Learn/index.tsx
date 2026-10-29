import { createFileRoute } from "@tanstack/react-router";

import { LearnOverview } from "@/components/learn-ui/LearnOverview";
import { LearningPath } from "@/components/learn-ui/LearningPath";
import { LearnProgress } from "@/components/learn-ui/LearnProgress";
import { useLearningProgress } from "@/hooks/use-learning-progress";

export const Route = createFileRoute("/_app/Learn/")({
  component: LearnPage,
});

function LearnPage() {
  const progress = useLearningProgress();

  return (
    <main className="w-full min-w-0">
      <div className="mx-auto w-full max-w-[1400px] space-y-8 px-4 py-6 sm:space-y-10 sm:px-7 sm:py-8 lg:space-y-12 lg:px-10 lg:py-10 xl:px-12">
        <LearnOverview />

        <LearningPath />

        <LearnProgress
          correctAnswers={progress.data?.correct_answers ?? 0}
          lessonsCompleted={progress.data?.lessons_completed ?? 0}
        />
      </div>
    </main>
  );
}
