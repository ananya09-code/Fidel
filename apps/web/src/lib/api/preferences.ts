import { z } from "zod";
import { learningLanguageCodes } from "@/lib/languages";

import { authenticatedRequest, type ApiToken, apiFetch } from "@/lib/api";

export const learningLanguageSchema = z.enum(learningLanguageCodes);
export const proficiencyLevelSchema = z.enum([
  "beginner",
  "some",
  "conversational",
  "improving",
]);
export const motivationSchema = z.enum([
  "family",
  "conversation",
  "culture",
  "work",
  "travel",
  "literacy",
  "personal",
]);
export const interfaceLanguageSchema = z.enum(["en", ...learningLanguageCodes]);
export const appearanceSchema = z.enum(["light", "dark", "system"]);
export const dailyGoalSchema = z.union([
  z.literal(5),
  z.literal(10),
  z.literal(15),
  z.literal(20),
]);

export const userPreferencesSchema = z.object({
  learning_language: learningLanguageSchema,
  proficiency_level: proficiencyLevelSchema.nullable(),
  motivations: z.array(motivationSchema),
  daily_goal_words: dailyGoalSchema,
  interface_language: interfaceLanguageSchema,
  reminders_enabled: z.boolean(),
  reminder_time: z.string(),
  sound_enabled: z.boolean(),
  sound_volume: z.number().int().min(0).max(100),
  haptics_enabled: z.boolean(),
  appearance: appearanceSchema,
  timezone: z.string(),
  onboarding_completed: z.boolean(),
  tour_completed_version: z.number().int().nonnegative(),
  last_seen_update: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export type UserPreferences = z.infer<typeof userPreferencesSchema>;
export type UserPreferencesUpdate = Partial<
  Omit<UserPreferences, "created_at" | "updated_at">
>;

export function getPreferences(
  token: ApiToken,
  signal?: AbortSignal,
): Promise<UserPreferences> {
  return apiFetch("/api/v1/preferences", userPreferencesSchema, {
    ...authenticatedRequest(token),
    signal,
  });
}

export function updatePreferences(
  token: ApiToken,
  update: UserPreferencesUpdate,
): Promise<UserPreferences> {
  return apiFetch("/api/v1/preferences", userPreferencesSchema, {
    method: "PATCH",
    ...authenticatedRequest(token),
    body: JSON.stringify(update),
  });
}
