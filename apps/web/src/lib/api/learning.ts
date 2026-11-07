import { z } from "zod";

import { authenticatedRequest, type ApiToken, apiFetch } from "@/lib/api";

const learningLessonSchema = z.object({
  id: z.string(), title: z.string(), subtitle: z.string(),
  order: z.number().int(), word_count: z.number().int().nonnegative(),
});
const learningLevelSchema = z.object({
  id: z.string(), title: z.string(), subtitle: z.string(),
  order: z.number().int(), total_words: z.number().int().nonnegative(),
  lessons: z.array(learningLessonSchema),
});
export const learningPathSchema = z.object({
  language_code: z.string(), total_words: z.number().int().nonnegative(),
  levels: z.array(learningLevelSchema),
});
const lessonWordSchema = z.object({
  id: z.string().uuid(), language_code: z.string(), text: z.string(),
  transliteration: z.string().nullable().optional(),
  meaning: z.string().nullable().optional(),
  translations: z.array(z.object({
    language_code: z.string(), meaning: z.string(),
    context_note: z.string().nullable().optional(),
  })).default([]),
  audio: z.object({
    available: z.boolean().optional(), url: z.string().nullable().optional(),
  }).nullable().optional(),
});
export const lessonWordsSchema = z.object({
  lesson: z.object({
    id: z.string(), language_code: z.string(), category: z.string(),
    difficulty: z.string().nullable(), word_count: z.number().int().nonnegative(),
  }),
  words: z.array(lessonWordSchema),
  pagination: z.object({
    limit: z.number().int(), offset: z.number().int(),
    total: z.number().int().nonnegative(), has_more: z.boolean(),
  }),
});
const savedAnswerSchema = z.object({ question_id: z.string(), is_correct: z.boolean() });
export const lessonAttemptSchema = z.object({
  id: z.string().uuid(), lesson_key: z.string(), difficulty: z.string(),
  category_key: z.string(), category_label: z.string().nullable(),
  difficulty_label: z.string().nullable(),
  status: z.enum(["in_progress", "completed"]),
  stage: z.enum(["vocabulary", "practice"]),
  question_index: z.number().int().nonnegative(),
  question_count: z.number().int().nonnegative(),
  correct_count: z.number().int().nonnegative(),
  started_at: z.string(), completed_at: z.string().nullable(), updated_at: z.string(),
  answers: z.array(savedAnswerSchema),
});
export const progressSummarySchema = z.object({
  lessons_completed: z.number().int().nonnegative(),
  questions_answered: z.number().int().nonnegative(),
  correct_answers: z.number().int().nonnegative(),
  completed_lesson_keys: z.array(z.string()),
  practiced_word_ids_by_lesson: z.record(z.string(), z.array(z.string())).default({}),
  in_progress: z.array(lessonAttemptSchema),
});

export type LearningPathResponse = z.infer<typeof learningPathSchema>;
export type LessonWordsResponse = z.infer<typeof lessonWordsSchema>;
export type LessonAttempt = z.infer<typeof lessonAttemptSchema>;
export type ProgressSummary = z.infer<typeof progressSummarySchema>;

type StartLessonInput = {
  difficulty: string; category_key: string; category_label?: string | null;
  difficulty_label?: string | null; question_count: number;
};

export function getLearningPath(languageCode: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ language_code: languageCode });
  return apiFetch(`/api/v1/learning/path?${params}`, learningPathSchema, { signal });
}
export async function getLessonWords(lessonKey: string, languageCode: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ language_code: languageCode, limit: "50", offset: "0" });
  const path = `/api/v1/learning/lessons/${encodeURIComponent(lessonKey)}/words`;
  const result = await apiFetch(`${path}?${params}`, lessonWordsSchema, { signal });
  let page = result;
  while (page.pagination.has_more) {
    const offset = page.pagination.offset + page.words.length;
    if (offset <= page.pagination.offset) throw new Error("Unable to load the remaining lesson words.");
    params.set("offset", String(offset));
    page = await apiFetch(`${path}?${params}`, lessonWordsSchema, { signal });
    result.words.push(...page.words);
  }
  return { ...result, pagination: { ...page.pagination, offset: 0, limit: result.words.length } };
}
export function getProgress(token: ApiToken, signal?: AbortSignal) {
  return apiFetch("/api/v1/progress", progressSummarySchema, {
    ...authenticatedRequest(token), signal,
  });
}
export function getLessonAttempt(token: ApiToken, lessonKey: string, signal?: AbortSignal) {
  return apiFetch(
    `/api/v1/progress/lessons/${encodeURIComponent(lessonKey)}`,
    lessonAttemptSchema.nullable(), { ...authenticatedRequest(token), signal },
  );
}
export function startLesson(token: ApiToken, lessonKey: string, input: StartLessonInput) {
  return apiFetch(
    `/api/v1/progress/lessons/${encodeURIComponent(lessonKey)}/start`, lessonAttemptSchema,
    { method: "POST", ...authenticatedRequest(token), body: JSON.stringify(input) },
  );
}
export function checkpointLesson(
  token: ApiToken, attemptId: string, stage: "vocabulary" | "practice", questionIndex: number,
) {
  return apiFetch(`/api/v1/progress/attempts/${attemptId}`, lessonAttemptSchema, {
    method: "PATCH", ...authenticatedRequest(token),
    body: JSON.stringify({ stage, question_index: questionIndex }),
  });
}
export function saveLessonAnswer(
  token: ApiToken, attemptId: string,
  input: { question_id: string; word_id: string; selected_word_id: string; question_index: number; question_type?: "multiple_choice" | "matching" },
) {
  return apiFetch(`/api/v1/progress/attempts/${attemptId}/answers`, lessonAttemptSchema, {
    method: "PUT", ...authenticatedRequest(token), body: JSON.stringify(input),
  });
}
export function completeLesson(token: ApiToken, attemptId: string) {
  return apiFetch(`/api/v1/progress/attempts/${attemptId}/complete`, lessonAttemptSchema, {
    method: "POST", ...authenticatedRequest(token),
  });
}
