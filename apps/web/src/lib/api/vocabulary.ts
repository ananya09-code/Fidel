import { z } from "zod";

import { authenticatedRequest, type ApiToken, apiFetch } from "@/lib/api";
import type { LearningLanguage } from "@/lib/languages";

export const learningStateSchema = z.enum(["learning", "learned", "needs_review"]);
export const vocabularyStateSchema = z.object({
  word_id: z.string().uuid(),
  is_favorite: z.boolean(),
  learning_state: learningStateSchema,
  times_seen: z.number().int().nonnegative(),
  times_correct: z.number().int().nonnegative(),
});
const vocabularyStateListSchema = z.object({ data: z.array(vocabularyStateSchema) });

export type LearningState = z.infer<typeof learningStateSchema>;
export type VocabularyState = z.infer<typeof vocabularyStateSchema>;
export type VocabularyStateUpdate = {
  is_favorite?: boolean;
  learning_state?: LearningState;
};

export function getVocabularyState(token: ApiToken, languageCode: LearningLanguage, signal?: AbortSignal) {
  return apiFetch(`/api/v1/vocabulary?language_code=${languageCode}`, vocabularyStateListSchema, {
    ...authenticatedRequest(token), signal,
  });
}

export function updateVocabularyState(
  token: ApiToken,
  wordId: string,
  update: VocabularyStateUpdate,
) {
  return apiFetch(`/api/v1/vocabulary/${wordId}`, vocabularyStateSchema, {
    method: "PUT", ...authenticatedRequest(token), body: JSON.stringify(update),
  });
}
