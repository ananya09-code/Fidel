import { z } from "zod";

import { apiFetch } from "@/lib/api";

const currentLessonSchema = z.object({
  lesson_key: z.string(), title: z.string(), stage: z.string(),
  question_index: z.number().int().nonnegative(), question_count: z.number().int().nonnegative(),
});
export const dashboardSchema = z.object({
  daily_word_goal: z.number().int().positive(),
  words_learned_today: z.number().int().nonnegative(),
  goal_minutes: z.number().int().nonnegative(),
  study_minutes_today: z.number().int().nonnegative(),
  streak_days: z.number().int().nonnegative(),
  learned_words: z.number().int().nonnegative(),
  needs_review_words: z.number().int().nonnegative(),
  lessons_completed: z.number().int().nonnegative(),
  reviews_completed: z.number().int().nonnegative(),
  correct_answers: z.number().int().nonnegative(),
  current_lesson: currentLessonSchema.nullable(),
  weekly_activity: z.array(z.object({
    date: z.string(), minutes: z.number().int().nonnegative(), events: z.number().int().nonnegative(),
  })),
  recent_activity: z.array(z.object({
    kind: z.enum(["lesson", "review"]), title: z.string(), occurred_at: z.string(),
    correct_count: z.number().int().nonnegative(), total_count: z.number().int().nonnegative(),
  })),
});
export type DashboardSummary = z.infer<typeof dashboardSchema>;

export function getDashboard(token: string, signal?: AbortSignal) {
  return apiFetch("/api/v1/dashboard", dashboardSchema, {
    headers: { Authorization: `Bearer ${token}` }, signal,
  });
}
