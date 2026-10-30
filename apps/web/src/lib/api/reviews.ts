import { z } from "zod";

import { apiFetch } from "@/lib/api";

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

function headers(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}
export function getReviews(token: string, signal?: AbortSignal) {
  return apiFetch("/api/v1/reviews", reviewOverviewSchema, { headers: headers(token), signal });
}
export function startReview(token: string) {
  return apiFetch("/api/v1/reviews/start", reviewSessionSchema, {
    method: "POST", headers: headers(token),
  });
}
export function saveReviewAnswer(
  token: string, sessionId: string, wordId: string, selectedWordId: string,
) {
  return apiFetch(`/api/v1/reviews/${sessionId}/answers`, reviewSessionSchema, {
    method: "PUT", headers: headers(token),
    body: JSON.stringify({ word_id: wordId, selected_word_id: selectedWordId }),
  });
}
export function completeReview(token: string, sessionId: string) {
  return apiFetch(`/api/v1/reviews/${sessionId}/complete`, reviewSessionSchema, {
    method: "POST", headers: headers(token),
  });
}
