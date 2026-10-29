import { z } from "zod";

import { apiFetch } from "@/lib/api";

export const learningLanguageSchema = z.enum(["om", "am"]);
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
export const interfaceLanguageSchema = z.enum(["en", "om", "am"]);
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
  daily_goal_minutes: dailyGoalSchema,
  interface_language: interfaceLanguageSchema,
  reminders_enabled: z.boolean(),
  reminder_time: z.string(),
  sound_enabled: z.boolean(),
  appearance: appearanceSchema,
  timezone: z.string(),
  onboarding_completed: z.boolean(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export type UserPreferences = z.infer<typeof userPreferencesSchema>;
export type UserPreferencesUpdate = Partial<
  Omit<UserPreferences, "created_at" | "updated_at">
>;

function headers(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export function getPreferences(
  token: string,
  signal?: AbortSignal,
): Promise<UserPreferences> {
  return apiFetch("/api/v1/preferences", userPreferencesSchema, {
    headers: headers(token),
    signal,
  });
}

export function updatePreferences(
  token: string,
  update: UserPreferencesUpdate,
): Promise<UserPreferences> {
  return apiFetch("/api/v1/preferences", userPreferencesSchema, {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify(update),
  });
}
