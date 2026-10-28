export type LearningLesson = {
  id: string;
  title: string;
  subtitle: string;
  order: number;
  word_count: number;
};

export type LearningLevel = {
  id: string;
  title: string;
  subtitle: string;
  order: number;
  total_words: number;
  lessons: LearningLesson[];
};

export type LearningPathResponse = {
  language_code: string;
  total_words: number;
  levels: LearningLevel[];
};

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8000"
).replace(/\/+$/, "");

export async function getLearningPath(
  languageCode: string,
  signal?: AbortSignal,
): Promise<LearningPathResponse> {
  const params = new URLSearchParams({
    language_code: languageCode,
  });

  const response = await fetch(
    `${API_BASE_URL}/api/api/v1/learning/path?${params}`,
    {
      headers: {
        Accept: "application/json",
      },
      signal,
    },
  );

  if (!response.ok) {
    const body = await response.json().catch(() => null);

    throw new Error(
      body?.detail || `Failed to load learning path (${response.status}).`,
    );
  }

  return response.json() as Promise<LearningPathResponse>;
}
