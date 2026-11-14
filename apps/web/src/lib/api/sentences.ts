import { z } from "zod";
import { apiFetch, authenticatedRequest, type ApiToken } from "@/lib/api";

const tileSchema = z.object({ id: z.string(), text: z.string(), word_id: z.string().uuid() });
const exerciseSchema = z.object({
  id: z.string().uuid(), language_code: z.enum(["am", "om", "ti"]),
  meaning: z.string().nullable(), meaning_amharic: z.string().nullable(), tiles: z.array(tileSchema),
  missing_words: z.array(z.string()), audio_available: z.boolean(),
  audio_url: z.string().nullable(), locked: z.boolean(), completed: z.boolean(),
});
const listSchema = z.object({ language_code: z.enum(["am", "om", "ti"]), exercises: z.array(exerciseSchema) });
const answerSchema = z.object({
  is_correct: z.boolean(), sentence: z.string().nullable(), meaning: z.string().nullable(), meaning_amharic: z.string().nullable(),
  audio_url: z.string().nullable(), hint: z.string().nullable(), attempt_id: z.string().uuid(),
});

export type SentenceExercise = z.infer<typeof exerciseSchema>;
export type SentenceAnswerResult = z.infer<typeof answerSchema>;

export function getSentenceExercises(token: ApiToken, languageCode: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ language_code: languageCode });
  return apiFetch(`/api/v1/sentences?${params}`, listSchema, { ...authenticatedRequest(token), signal });
}

export function submitSentenceAnswer(token: ApiToken, exerciseId: string, selectedOrder: string[]) {
  return apiFetch(`/api/v1/sentences/${encodeURIComponent(exerciseId)}/answers`, answerSchema, {
    ...authenticatedRequest(token), method: "POST", body: JSON.stringify({ selected_order: selectedOrder }),
  });
}
