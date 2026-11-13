import { z } from "zod";
import { apiFetch, apiFetchVoid, authenticatedRequest, type ApiToken } from "@/lib/api";

const configSchema = z.object({ public_key: z.string().nullable() });
const listSchema = z.object({ endpoints: z.array(z.string()) });

export type DeviceSubscription = { endpoint: string; keys: { p256dh: string; auth: string } };

export const getPushConfig = (token: ApiToken) => apiFetch("/api/v1/notifications/config", configSchema, authenticatedRequest(token));
export const getPushSubscriptions = (token: ApiToken) => apiFetch("/api/v1/notifications/subscriptions", listSchema, authenticatedRequest(token));
export const savePushSubscription = (token: ApiToken, body: DeviceSubscription) => apiFetchVoid("/api/v1/notifications/subscriptions", { ...authenticatedRequest(token), method: "POST", body: JSON.stringify(body) });
export const removePushSubscription = (token: ApiToken, body: DeviceSubscription) => apiFetchVoid("/api/v1/notifications/subscriptions", { ...authenticatedRequest(token), method: "DELETE", body: JSON.stringify(body) });
