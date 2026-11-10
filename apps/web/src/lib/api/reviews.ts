import { z } from "zod";

import { authenticatedRequest, type ApiToken, apiFetch } from "@/lib/api";

const reviewWordSchema = z.object({
  id: z.string().uuid(), text: z.string(), meaning: z.string(),
  amharic: z.string().nullable(), category: z.string(), audio_url: z.string().nullable(),
});
const reviewAnswerSchema = z.object({ word_id: z.string().uuid(), is_correct: z.boolean() });
export const reviewSessionSchema = z.object({
  id: z.string().uuid(), status: z.enum(["in_progress", "completed"]),
  total_count: z.number().int().positive(), correct_count: z.number().int().nonnegative(),
  started_at: z.string(), completed_at: z.string().nullable(),
  words: z.array(reviewWordSchema), answers: z.array(reviewAnswerSchema),
  choice_words: z.array(reviewWordSchema).default([]),
});
export const reviewOverviewSchema = z.object({
  queue: z.array(reviewWordSchema),
  active_session: reviewSessionSchema.nullable(),
  history: z.array(z.object({
    id: z.string().uuid(), total_count: z.number().int().positive(),
    correct_count: z.number().int().nonnegative(), completed_at: z.string(),
  })),
});
export type ReviewSession = z.infer<typeof reviewSessionSchema>;
export type ReviewOverview = z.infer<typeof reviewOverviewSchema>;

export const spacedReviewSchema = z.object({
  due_count: z.number().int().nonnegative(), scheduled_count: z.number().int().nonnegative(),
  next_review_at: z.string().nullable(), active_session: reviewSessionSchema.nullable(),
  interval_days: z.array(z.number().int().positive()),
});
export type SpacedReviewOverview = z.infer<typeof spacedReviewSchema>;
export function getSpacedReviews(token: ApiToken, languageCode: "om" | "am" | "ti", signal?: AbortSignal) {
  return apiFetch(`/api/v1/reviews/spaced?language_code=${languageCode}`, spacedReviewSchema, { ...authenticatedRequest(token), signal });
}

export function getReviews(token: ApiToken, signal?: AbortSignal) {
  return apiFetch("/api/v1/reviews", reviewOverviewSchema, { ...authenticatedRequest(token), signal });
}
export function startReview(token: ApiToken, mode: "manual" | "spaced" = "manual", languageCode: "om" | "am" | "ti" = "om") {
  return apiFetch(`/api/v1/reviews/start?mode=${mode}&language_code=${languageCode}`, reviewSessionSchema, {
    method: "POST", ...authenticatedRequest(token),
  });
}
export function saveReviewAnswer(
  token: ApiToken, sessionId: string, wordId: string, selectedWordId: string,
) {
  return apiFetch(`/api/v1/reviews/${sessionId}/answers`, reviewSessionSchema, {
    method: "PUT", ...authenticatedRequest(token),
    body: JSON.stringify({ word_id: wordId, selected_word_id: selectedWordId }),
  });
}
export function completeReview(token: ApiToken, sessionId: string) {
  return apiFetch(`/api/v1/reviews/${sessionId}/complete`, reviewSessionSchema, {
    method: "POST", ...authenticatedRequest(token),
  });
}
