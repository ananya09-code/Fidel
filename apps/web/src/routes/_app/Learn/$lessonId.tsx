import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, LoaderCircle } from "lucide-react";

import { FlashcardSession } from "@/components/learn-ui/lesson/FlashcardSession";
import type { FlashcardWord } from "@/components/learn-ui/lesson/Flashcard";

export const Route = createFileRoute("/_app/Learn/$lessonId")({
  validateSearch: (search: Record<string, unknown>) => ({
    language_code:
      typeof search.language_code === "string"
        ? search.language_code
        : "om",
  }),
  component: LessonPage,
});

type ApiLessonWord = {
  id: string;
  language_code: string;
  text: string;
  transliteration?: string | null;
  meaning?: string | null;
  translations?: {
    language_code: string;
    meaning: string;
    context_note?: string | null;
  }[];
  audio?: {
    available?: boolean;
    url?: string | null;
  } | null;
};

type LessonResponse = {
  lesson: {
    id: string;
    language_code: string;
    category: string;
    difficulty: string | null;
    word_count: number;
  };
  words: ApiLessonWord[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    has_more: boolean;
  };
};

function LessonPage() {
  const { lessonId } = Route.useParams();
  const { language_code } = Route.useSearch();
  const navigate = useNavigate();

  const apiUrl = import.meta.env.VITE_API_URL;

  const {
    data,
    isPending,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["lesson-words", lessonId, language_code],

    queryFn: async (): Promise<LessonResponse> => {
      if (!apiUrl) {
        throw new Error("VITE_API_URL is not configured.");
      }

      const response = await fetch(
        `${apiUrl}/api/v1/learning/lessons/${encodeURIComponent(
          lessonId,
        )}/words?language_code=${encodeURIComponent(
          language_code,
        )}&limit=50&offset=0`,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load lesson words (${response.status}).`,
        );
      }

      return response.json();
    },
  });

  function goBack() {
    void navigate({ to: "/_app/Learn" });
  }

  if (isPending) {
    return (
      <main className="flex min-h-80 items-center justify-center gap-3">
        <LoaderCircle className="h-5 w-5 animate-spin text-[var(--sea-ink)]" />
        <p className="text-sm text-[var(--sea-ink)]/65">
          Preparing your lesson...
        </p>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-10">
        <button
          type="button"
          onClick={goBack}
          className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--sea-ink)]/70"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to learning
        </button>

        <div className="rounded-3xl border border-red-200 bg-white/80 p-6">
          <h1 className="text-xl font-bold text-[var(--sea-ink)]">
            Couldn't load your lesson
          </h1>

          <p className="mt-2 text-sm text-red-600">
            {error instanceof Error
              ? error.message
              : "Something went wrong while loading the words."}
          </p>

          <button
            type="button"
            disabled={isFetching}
            onClick={() => void refetch()}
            className="mt-5 min-h-11 rounded-xl bg-[var(--sea-ink)] px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isFetching ? "Retrying..." : "Try again"}
          </button>
        </div>
      </main>
    );
  }

  if (!data || data.words.length === 0) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-10">
        <button
          type="button"
          onClick={goBack}
          className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--sea-ink)]/70"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to learning
        </button>

        <div className="rounded-3xl border border-[var(--sea-ink)]/10 bg-white/80 p-8 text-center">
          <h1 className="text-xl font-bold text-[var(--sea-ink)]">
            No words available yet
          </h1>

          <p className="mt-2 text-sm text-[var(--sea-ink)]/60">
            This lesson doesn't have any approved vocabulary words yet.
          </p>
        </div>
      </main>
    );
  }

  const words: FlashcardWord[] = data.words.map((item) => {
    const translations = item.translations ?? [];

    const meaning =
      item.meaning ??
      translations.find((translation) => translation.language_code === "en")
        ?.meaning ??
      translations[0]?.meaning ??
      "Meaning not available yet";

    const englishTranslation = translations.find(
      (translation) => translation.language_code === "en",
    );

    return {
      id: item.id,
      word: item.text,
      transliteration: item.transliteration,
      meaning,
      example: englishTranslation?.context_note ?? null,
      audioUrl: item.audio?.available ? item.audio.url ?? null : null,
    };
  });

  return (
    <main className="mx-auto w-full min-w-0 max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <FlashcardSession
        key={`${lessonId}-${language_code}`}
        category={data.lesson.category}
        words={words}
        initialWordLimit={Math.min(10, words.length)}
        onBack={goBack}
        onComplete={(completedWords) => {
          // Connect this callback to your practice flow.
          // completedWords contains the words selected for this session.
          console.log("Ready to practise:", completedWords);
        }}
      />
    </main>
  );
}
