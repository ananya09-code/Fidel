import { z } from "zod";
import { apiFetch, authenticatedRequest, type ApiToken } from "@/lib/api";

const categorySchema = z.enum(["bug", "idea", "content", "other"]);
const savedSchema = z.object({ id: z.string().uuid(), created_at: z.iso.datetime({ offset: true }) });
const itemSchema = savedSchema.extend({
  category: categorySchema,
  message: z.string(),
  page_path: z.string(),
  contact_allowed: z.boolean(),
  display_name: z.string().nullable(),
  email: z.string().nullable(),
});
const pageSchema = z.object({
  items: z.array(itemSchema),
  page: z.number(),
  page_size: z.number(),
  total: z.number(),
});

export type FeedbackCategory = z.infer<typeof categorySchema>;
export type FeedbackSubmission = {
  category: FeedbackCategory;
  message: string;
  page_path: string;
  contact_allowed: boolean;
};
export type FeedbackItem = z.infer<typeof itemSchema>;

export function submitFeedback(token: ApiToken, body: FeedbackSubmission) {
  return apiFetch("/api/v1/feedback", savedSchema, {
    ...authenticatedRequest(token),
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function listAdminFeedback(adminKey: string, page: number) {
  return apiFetch(`/api/v1/feedback/admin?page=${page}&page_size=20`, pageSchema, {
    headers: { "X-Admin-Key": adminKey },
  });
}
