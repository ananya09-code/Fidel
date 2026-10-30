import { useState } from "react";
import { useAuth } from "@clerk/tanstack-react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageState } from "@/components/common-ui/PageState";

import type { FlashcardWord } from "@/components/learn-ui/lesson/Flashcard";
import { FlashcardSession } from "@/components/learn-ui/lesson/FlashcardSession";
import { LessonQuiz } from "@/components/learn-ui/lesson/LessonQuiz";
import {
  learningProgressKeys,
  useLessonProgress,
} from "@/hooks/use-learning-progress";
import {
  checkpointLesson,
  completeLesson,
  getLessonWords,
  saveLessonAnswer,
  startLesson,
  type LessonAttempt,
} from "@/lib/api/learning";

export const Route = createFileRoute("/_app/Learn/$lessonId")({
  validateSearch: (search: Record<string, unknown>) => ({
    language_code: typeof search.language_code === "string" ? search.language_code : "om",
  }),
  component: LessonPage,
});

function LessonPage() {
  const { lessonId } = Route.useParams();
  const { language_code } = Route.useSearch();
  const { getToken, userId } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const savedProgress = useLessonProgress(lessonId);
  const [localAttempt, setLocalAttempt] = useState<LessonAttempt | null>(null);

  const lesson = useQuery({
    queryKey: ["lesson-words", lessonId, language_code],
    queryFn: ({ signal }) => getLessonWords(lessonId, language_code, signal),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const attempt = localAttempt ?? savedProgress.data ?? null;

  async function token(): Promise<string> {
    const value = await getToken();
    if (!value) throw new Error("Your session expired. Please sign in again.");
    return value;
  }

  function cacheAttempt(value: LessonAttempt) {
    setLocalAttempt(value);
    queryClient.setQueryData(
      learningProgressKeys.lesson(userId, lessonId),
      value.status === "in_progress" ? value : null,
    );
  }

  async function start(questionCount: number) {
    if (!lesson.data) return;
    const value = await startLesson(await token(), lessonId, {
      difficulty: lesson.data.lesson.difficulty ?? "beginner",
      category_key: lesson.data.lesson.category,
      category_label: lesson.data.lesson.category,
      difficulty_label: lesson.data.lesson.difficulty,
      question_count: questionCount,
    });
    cacheAttempt(value);
  }

  async function checkpoint(stage: "vocabulary" | "practice", index: number) {
    if (!attempt) throw new Error("Start the lesson before saving progress.");
    const value = await checkpointLesson(await token(), attempt.id, stage, index);
    cacheAttempt(value);
  }

  async function saveAnswer(answer: {
    questionId: string;
    wordId: string;
    selectedWordId: string;
    questionIndex: number;
  }) {
    if (!attempt) throw new Error("Start the lesson before answering questions.");
    const value = await saveLessonAnswer(await token(), attempt.id, {
      question_id: answer.questionId,
      word_id: answer.wordId,
      selected_word_id: answer.selectedWordId,
      question_index: answer.questionIndex,
    });
    cacheAttempt(value);
  }

  async function finish() {
    if (!attempt) throw new Error("No lesson attempt is active.");
    const value = await completeLesson(await token(), attempt.id);
    cacheAttempt(value);
    await queryClient.invalidateQueries({
      queryKey: learningProgressKeys.all(userId),
    });
  }

  function goBack() {
    void navigate({ to: "/Learn" });
  }

  if (lesson.isPending || savedProgress.isPending) {
    return <PageState kind="loading" title="Preparing your lesson" />;
  }

  if (lesson.isError || savedProgress.isError) {
    const error = lesson.error ?? savedProgress.error;
    return <PageState kind="error" title="Couldn't load your lesson" description={error instanceof Error ? error.message : "Something went wrong while loading the lesson."} actionLabel="Try again" onAction={() => { void lesson.refetch(); void savedProgress.refetch(); }} />;
  }

  if (!lesson.data || lesson.data.words.length === 0) {
    return <PageState kind="empty" title="No words available yet" description="This lesson doesn't have any approved vocabulary words yet." actionLabel="Back to learning" onAction={goBack} />;
  }

  const words: FlashcardWord[] = lesson.data.words.map((item) => {
    const english = item.translations.find((translation) => translation.language_code === "en");
    const amharic = item.translations.find((translation) => translation.language_code === "am");
    return {
      id: item.id,
      word: item.text,
      transliteration: item.transliteration,
      meaning: item.meaning ?? english?.meaning ?? item.translations[0]?.meaning ?? "Meaning not available yet",
      amharic: amharic?.meaning ?? null,
      example: english?.context_note ?? null,
      audioUrl: item.audio?.available ? item.audio.url ?? null : null,
    };
  });
  const questionCount = attempt?.question_count ?? Math.min(10, words.length);
  const sessionWords = words.slice(0, questionCount);

  if (attempt?.stage === "practice") {
    return (
      <LessonQuiz
        words={sessionWords}
        category={lesson.data.lesson.category}
        initialQuestionIndex={attempt.question_index}
        initialAnswers={Object.fromEntries(
          attempt.answers.map((answer) => [answer.question_id, answer.is_correct]),
        )}
        onBack={goBack}
        onAnswer={saveAnswer}
        onFinish={finish}
      />
    );
  }

  return (
    <main className="mx-auto w-full min-w-0 max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <FlashcardSession
        key={`${lessonId}-${language_code}-${attempt?.id ?? "new"}`}
        category={lesson.data.lesson.category}
        words={words}
        initialWordLimit={questionCount}
        resumeActive={Boolean(attempt)}
        resumeFromIndex={attempt?.question_index ?? 0}
        onBack={goBack}
        onStart={start}
        onProgress={(index) => checkpoint("vocabulary", index)}
        onComplete={async () => checkpoint("practice", 0)}
      />
    </main>
  );
}
