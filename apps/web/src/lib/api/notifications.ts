import { z } from "zod";
import { apiFetch, apiFetchVoid, authenticatedRequest, type ApiToken } from "@/lib/api";

const configSchema = z.object({ public_key: z.string().nullable() });
const listSchema = z.object({ endpoints: z.array(z.string()) });
const inboxSchema = z.object({ items: z.array(z.object({
  kind: z.enum(["goal", "quiz", "streak"]),
  local_date: z.iso.date(),
})) });

export type DeviceSubscription = { endpoint: string; keys: { p256dh: string; auth: string } };
export type NotificationInboxItem = z.infer<typeof inboxSchema>["items"][number];

export const getPushConfig = (token: ApiToken) => apiFetch("/api/v1/notifications/config", configSchema, authenticatedRequest(token));
export const getPushSubscriptions = (token: ApiToken) => apiFetch("/api/v1/notifications/subscriptions", listSchema, authenticatedRequest(token));
export const getNotificationInbox = (token: ApiToken, signal?: AbortSignal) => apiFetch("/api/v1/notifications/inbox", inboxSchema, { ...authenticatedRequest(token), signal });
export const savePushSubscription = (token: ApiToken, body: DeviceSubscription) => apiFetchVoid("/api/v1/notifications/subscriptions", { ...authenticatedRequest(token), method: "POST", body: JSON.stringify(body) });
export const removePushSubscription = (token: ApiToken, body: DeviceSubscription) => apiFetchVoid("/api/v1/notifications/subscriptions", { ...authenticatedRequest(token), method: "DELETE", body: JSON.stringify(body) });
