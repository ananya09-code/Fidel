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
  useLearningProgress,
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
  const progress = useLearningProgress();
  const [localAttempt, setLocalAttempt] = useState<LessonAttempt | null>(null);
  const [sessionWordIds, setSessionWordIds] = useState<string[] | null>(null);

  const lesson = useQuery({
    queryKey: ["lesson-words", lessonId, language_code],
    queryFn: ({ signal }) => getLessonWords(lessonId, language_code, signal),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const attempt = localAttempt ?? savedProgress.data ?? null;

  function cacheAttempt(value: LessonAttempt) {
    setLocalAttempt(value);
    queryClient.setQueryData(
      learningProgressKeys.lesson(userId, lessonId),
      value.status === "in_progress" ? value : null,
    );
  }

  async function start(questionCount: number) {
    if (!lesson.data) return;
    const value = await startLesson(getToken, lessonId, {
      difficulty: lesson.data.lesson.difficulty ?? "beginner",
      category_key: lesson.data.lesson.category,
      category_label: lesson.data.lesson.category,
      difficulty_label: lesson.data.lesson.difficulty,
      question_count: questionCount,
    });
    setSessionWordIds(words.slice(0, value.question_count).map((word) => word.id));
    cacheAttempt(value);
  }

  async function checkpoint(stage: "vocabulary" | "practice", index: number) {
    if (!attempt) throw new Error("Start the lesson before saving progress.");
    const value = await checkpointLesson(getToken, attempt.id, stage, index);
    cacheAttempt(value);
  }

  async function saveAnswer(answer: {
    questionId: string;
    wordId: string;
    selectedWordId: string;
    questionIndex: number;
    questionType?: "multiple_choice" | "matching";
  }) {
    if (!attempt) throw new Error("Start the lesson before answering questions.");
    const value = await saveLessonAnswer(getToken, attempt.id, {
      question_id: answer.questionId,
      word_id: answer.wordId,
      selected_word_id: answer.selectedWordId,
      question_index: answer.questionIndex,
      question_type: answer.questionType ?? "multiple_choice",
    });
    cacheAttempt(value);
    void queryClient.invalidateQueries({ queryKey: ["auth", "dashboard", userId] });
    void queryClient.invalidateQueries({ queryKey: ["auth", "spaced-reviews", userId] });
    void queryClient.invalidateQueries({ queryKey: ["auth", "vocabulary-state", userId] });
  }

  async function finish() {
    if (!attempt) throw new Error("No lesson attempt is active.");
    setSessionWordIds(sessionWords.map((word) => word.id));
    const value = await completeLesson(getToken, attempt.id);
    cacheAttempt(value);
    await queryClient.invalidateQueries({
      queryKey: learningProgressKeys.all(userId),
    });
    await queryClient.invalidateQueries({ queryKey: ["auth", "dashboard", userId] });
    await queryClient.invalidateQueries({ queryKey: ["auth", "spaced-reviews", userId] });
  }

  function goBack() {
    void navigate({ to: "/Learn" });
  }

  if (lesson.isPending || savedProgress.isPending || progress.isPending) {
    return <PageState kind="loading" title="Preparing your lesson" />;
  }

  if (lesson.isError || savedProgress.isError || progress.isError) {
    const error = lesson.error ?? savedProgress.error ?? progress.error;
    return <PageState kind="error" title="Couldn't load your lesson" description={error instanceof Error ? error.message : "Something went wrong while loading the lesson."} actionLabel="Try again" onAction={() => { void lesson.refetch(); void savedProgress.refetch(); void progress.refetch(); }} />;
  }

  if (!lesson.data || lesson.data.words.length === 0) {
    return <PageState kind="empty" title="No words available yet" description="This lesson doesn't have any approved vocabulary words yet." actionLabel="Back to learning" onAction={goBack} />;
  }

  const practicedIds = new Set(progress.data?.practiced_word_ids_by_lesson[lessonId] ?? []);
  const currentIds = new Set(attempt?.answers.map((answer) => answer.question_id) ?? []);
  const remainingWords = lesson.data.words.filter((word) => !practicedIds.has(word.id) || currentIds.has(word.id));
  // A fully finished lesson can still be replayed. Active sessions retain their words.
  const availableWords = sessionWordIds
    ? sessionWordIds.flatMap((id) => lesson.data.words.filter((word) => word.id === id))
    : progress.data?.completed_lesson_keys.includes(lessonId) || remainingWords.length === 0
      ? lesson.data.words
      : remainingWords;
  const words: FlashcardWord[] = availableWords.map((item) => {
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
        key={attempt.id}
        words={sessionWords}
        languageCode={language_code === "am" || language_code === "ti" ? language_code : "om"}
        category={lesson.data.lesson.category}
        initialQuestionIndex={attempt.question_index}
        initialAnswers={Object.fromEntries(
          attempt.answers.map((answer) => [answer.question_id, answer.is_correct]),
        )}
        onBack={goBack}
        remainingWordCount={lesson.data.words.filter((word) => !practicedIds.has(word.id)).length}
        onContinue={() => {
          setLocalAttempt(null);
          setSessionWordIds(null);
        }}
        onAnswer={saveAnswer}
        onFinish={finish}
      />
    );
  }

  return (
    <div className="w-full min-w-0">
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
    </div>
  );
}
