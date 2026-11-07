import { z } from "zod";

import { authenticatedRequest, type ApiToken, apiFetch, apiFetchVoid } from "@/lib/api";

export const userProfileSchema = z.object({
  id: z.string(),
  clerk_user_id: z.string(),
  username: z.string().nullable(),
  email: z.string().nullable(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  display_name: z.string().nullable(),
  image_url: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

export function syncProfile(token: ApiToken): Promise<UserProfile> {
  return apiFetch("/api/v1/auth/profile", userProfileSchema, {
    method: "POST",
    ...authenticatedRequest(token),
  });
}

export function getProfile(token: ApiToken): Promise<UserProfile> {
  return apiFetch("/api/v1/auth/profile", userProfileSchema, {
    ...authenticatedRequest(token),
  });
}

export function deleteProfile(token: ApiToken): Promise<void> {
  return apiFetchVoid("/api/v1/auth/profile", {
    method: "DELETE",
    ...authenticatedRequest(token),
  });
}
