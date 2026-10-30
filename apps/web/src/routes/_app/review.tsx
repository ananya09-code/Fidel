import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import type { FlashcardWord } from "@/components/learn-ui/lesson/Flashcard";
import { PageState } from "@/components/common-ui/PageState";
import { LessonQuiz } from "@/components/learn-ui/lesson/LessonQuiz";
import { ReviewOverview } from "@/components/learn-ui/review/ReviewOverview";
import {
  completeReview,
  getReviews,
  saveReviewAnswer,
  startReview,
  type ReviewSession,
} from "@/lib/api/reviews";

export const Route = createFileRoute("/_app/review")({
  validateSearch: (search: Record<string, unknown>) => ({
    start: search.start === true || search.start === "true",
  }),
  component: ReviewPage,
});

function ReviewPage() {
  const { getToken, userId } = useAuth();
  const { start } = Route.useSearch();
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const autoStartAttempted = useRef(false);
  const overview = useQuery({
    queryKey: ["auth", "reviews", userId ?? "signed-out"],
    queryFn: async ({ signal }) => {
      const token = await getToken();
      if (!token) throw new Error("Your session expired. Please sign in again.");
      return getReviews(token, signal);
    },
    enabled: Boolean(userId), staleTime: 30_000, retry: false,
  });

  const token = useCallback(async () => {
    const value = await getToken();
    if (!value) throw new Error("Your session expired. Please sign in again.");
    return value;
  }, [getToken]);

  const begin = useCallback(async () => {
    setActionError(null);
    if (overview.data?.active_session) {
      setSession(overview.data.active_session);
      return;
    }
    setIsStarting(true);
    try {
      setSession(await startReview(await token()));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to start review.");
    } finally {
      setIsStarting(false);
    }
  }, [overview.data, token]);

  useEffect(() => {
    if (
      start &&
      !autoStartAttempted.current &&
      !overview.isPending &&
      overview.data
    ) {
      autoStartAttempted.current = true;
      void begin();
    }
  }, [begin, overview.data, overview.isPending, start]);

  if (overview.isPending) {
    return <PageState kind="loading" title="Loading your review words" />;
  }
  if (overview.isError || !overview.data) {
    return <PageState kind="error" title="Couldn't load reviews" description={overview.error?.message ?? "No review data was returned."} actionLabel="Try again" onAction={() => void overview.refetch()} />;
  }

  const active = session;
  if (!active) {
    return <ReviewOverview data={overview.data} onStart={() => void begin()} isStarting={isStarting} error={actionError} />;
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
      category="Vocabulary review"
      initialQuestionIndex={firstUnanswered}
      initialAnswers={answers}
      onBack={() => setSession(null)}
      onAnswer={async ({ wordId, selectedWordId }) => {
        const saved = await saveReviewAnswer(await token(), active.id, wordId, selectedWordId);
        setSession(saved);
      }}
      onFinish={async () => {
        const completed = await completeReview(await token(), active.id);
        setSession(completed);
        await overview.refetch();
      }}
    />
  );
}
