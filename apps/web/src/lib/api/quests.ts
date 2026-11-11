import { z } from "zod";
import { apiFetch, authenticatedRequest, type ApiToken } from "@/lib/api";

const termSchema = z.object({
  key: z.string(),
  text: z.string(),
  english: z.string(),
  amharic: z.string(),
  alternatives: z.array(z.string()),
});
const stepSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  accepts: z.array(z.string()),
  kind: z.enum(["name", "word"]),
});
const answerSchema = z.object({
  step_id: z.string(),
  value: z.string(),
  text: z.string(),
});
export const questStateSchema = z.object({
  version: z.number().int().positive(),
  step_index: z.number().int().nonnegative(),
  answers: z.array(answerSchema),
  completed: z.boolean(),
});
export const questItemSchema = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  title: z.string(),
  description: z.string(),
  character: z.enum(["guide", "host"]),
  prerequisite: z.string().nullable(),
  required: z.array(termSchema),
  steps: z.array(stepSchema),
  state: questStateSchema.nullable(),
  locked: z.boolean(),
  reasons: z.array(z.string()),
  missing_words: z.array(z.string()),
  unavailable_words: z.array(z.string()),
});
export const questBankWordSchema = z.object({
  id: z.string().uuid(),
  text: z.string(),
  meaning: z.string(),
  amharic: z.string().nullable(),
  category: z.string(),
  audio_url: z.string().nullable(),
});
export const questOverviewSchema = z.object({
  language_code: z.enum(["om", "am", "ti"]),
  quests: z.array(questItemSchema),
  bank: z.array(questBankWordSchema),
});
export const questReplySchema = z.object({
  accepted: z.boolean(),
  feedback: z.string().nullable().optional(),
  state: questStateSchema,
});
export type QuestOverview = z.infer<typeof questOverviewSchema>;
export type QuestItem = z.infer<typeof questItemSchema>;
export type QuestState = z.infer<typeof questStateSchema>;
export type QuestBankWord = z.infer<typeof questBankWordSchema>;
export type QuestReplyResult = z.infer<typeof questReplySchema>;
export type QuestReply = {
  expected_step: number;
  version: number;
  word_id?: string;
  name?: string;
};
export function getQuests(
  token: ApiToken,
  language: "om" | "am" | "ti",
  signal?: AbortSignal,
) {
  return apiFetch(
    `/api/v1/quests?language_code=${language}`,
    questOverviewSchema,
    { ...authenticatedRequest(token), signal },
  );
}
export function startQuest(
  token: ApiToken,
  language: "om" | "am" | "ti",
  key: string,
) {
  return apiFetch(
    `/api/v1/quests/${language}/${encodeURIComponent(key)}/start`,
    questStateSchema,
    { ...authenticatedRequest(token), method: "POST" },
  );
}
export function replyToQuest(
  token: ApiToken,
  language: "om" | "am" | "ti",
  key: string,
  reply: QuestReply,
) {
  return apiFetch(
    `/api/v1/quests/${language}/${encodeURIComponent(key)}/reply`,
    questReplySchema,
    {
      ...authenticatedRequest(token),
      method: "PUT",
      body: JSON.stringify(reply),
    },
  );
}
