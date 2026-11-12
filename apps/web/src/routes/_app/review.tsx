import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/tanstack-react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import type { FlashcardWord } from "@/components/learn-ui/lesson/Flashcard";
import { PageState } from "@/components/common-ui/PageState";
import { LessonQuiz } from "@/components/learn-ui/lesson/LessonQuiz";
import { ReviewHeader, ReviewOverview } from "@/components/learn-ui/review/ReviewOverview";
import { MemoryCheck } from "@/components/learn-ui/review/MemoryCheck";
import { usePreferences } from "@/hooks/use-preferences";
import {
  completeReview,
  getReviews,
  saveReviewAnswer,
  startReview,
  type ReviewSession,
} from "@/lib/api/reviews";

export const Route = createFileRoute("/_app/review")({
  validateSearch: (search: Record<string, unknown>): { start: boolean; mode?: "spaced" } => ({
    start: search.start === true || search.start === "true",
    mode: search.mode === "spaced" ? "spaced" : undefined,
  }),
  component: ReviewPage,
});

function ReviewPage() {
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();
  const { start, mode } = Route.useSearch();
  const preferences = usePreferences();
  const navigate = useNavigate();
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const autoStartAttempted = useRef(false);
  const overview = useQuery({
    queryKey: ["auth", "reviews", userId ?? "signed-out"],
    queryFn: async ({ signal }) => {
      return getReviews(getToken, signal);
    },
    enabled: Boolean(userId), staleTime: 30_000, retry: false,
  });

  const begin = useCallback(async (selectedMode: "manual" | "spaced" = "manual") => {
    setActionError(null);
    setIsStarting(true);
    try {
      setSession(await startReview(getToken, selectedMode, preferences.data?.learning_language ?? "om"));
      void queryClient.invalidateQueries({ queryKey: ["auth", "spaced-reviews", userId] });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to start review.");
    } finally {
      setIsStarting(false);
    }
  }, [getToken, preferences.data, queryClient, userId]);

  useEffect(() => {
    if (!start) autoStartAttempted.current = false;
    if (
      start &&
      preferences.isSuccess &&
      !autoStartAttempted.current &&
      !overview.isPending &&
      overview.data
    ) {
      autoStartAttempted.current = true;
      void begin(mode ?? "manual");
    }
  }, [begin, overview.data, overview.isPending, start, preferences.isSuccess, mode]);

  if (overview.isPending) {
    return <div className="fidel-review"><ReviewHeader /><PageState kind="loading" title="Loading your review words" /></div>;
  }
  if (overview.isError || !overview.data) {
    return <div className="fidel-review"><ReviewHeader /><PageState kind="error" title="Couldn't load reviews" description={overview.error?.message ?? "No review data was returned."} actionLabel="Try again" onAction={() => void overview.refetch()} /></div>;
  }

  const active = session;
  if (!active) {
    return <ReviewOverview data={overview.data} memoryCheck={<MemoryCheck />} onStart={() => void begin()} isStarting={isStarting} error={actionError} />;
  }

  const words: FlashcardWord[] = active.words.map((word) => ({
    id: word.id, word: word.text, meaning: word.meaning,
    amharic: word.amharic, audioUrl: word.audio_url,
  }));
  const answers = Object.fromEntries(active.answers.map((answer) => [answer.word_id, answer.is_correct]));
  const unansweredIndex = active.words.findIndex((word) => !(word.id in answers));
  const firstUnanswered = unansweredIndex >= 0 ? unansweredIndex : Math.max(active.words.length - 1, 0);

  return (
    <LessonQuiz
      words={words}
      variant="quiz"
      languageCode={preferences.data?.learning_language === "am" || preferences.data?.learning_language === "ti" ? preferences.data.learning_language : "om"}
      choiceWords={active.choice_words.map((word) => ({ id: word.id, word: word.text, meaning: word.meaning, amharic: word.amharic, audioUrl: word.audio_url }))}
      category="Vocabulary quiz"
      initialQuestionIndex={firstUnanswered}
      initialAnswers={answers}
      onBack={() => { setSession(null); void overview.refetch(); void navigate({ to: "/review", search: { start: false } }); }}
      onAnswer={async ({ wordId, selectedWordId }) => {
        const saved = await saveReviewAnswer(getToken, active.id, wordId, selectedWordId);
        setSession(saved);
        void queryClient.invalidateQueries({ queryKey: ["auth", "dashboard", userId] });
        void queryClient.invalidateQueries({ queryKey: ["auth", "vocabulary-state", userId] });
      }}
      onFinish={async () => {
        const completed = await completeReview(getToken, active.id);
        setSession(completed);
        void queryClient.invalidateQueries({ queryKey: ["auth", "dashboard", userId] });
        await overview.refetch();
        void queryClient.invalidateQueries({ queryKey: ["auth", "spaced-reviews", userId] });
        void queryClient.invalidateQueries({ queryKey: ["auth", "vocabulary-state", userId] });
      }}
    />
  );
}
