import { z } from "zod";

import { apiFetch, apiFetchVoid } from "@/lib/api";

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

function authorization(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export function syncProfile(token: string): Promise<UserProfile> {
  return apiFetch("/api/v1/auth/profile", userProfileSchema, {
    method: "POST",
    headers: authorization(token),
  });
}

export function getProfile(token: string): Promise<UserProfile> {
  return apiFetch("/api/v1/auth/profile", userProfileSchema, {
    headers: authorization(token),
  });
}

export function deleteProfile(token: string): Promise<void> {
  return apiFetchVoid("/api/v1/auth/profile", {
    method: "DELETE",
    headers: authorization(token),
  });
}
