import type { PostHog } from "posthog-js";

let client: PostHog | undefined;
let initialization: Promise<PostHog | undefined> | undefined;
let identity: string | null = null;
const sent = new Set<string>();

export function analyticsAllowed(path: string) {
  return !/^\/(?:admin(?:[./]|$)|sign-in(?:\/|$)|sign-up(?:\/|$)|sso-callback(?:\/|$))/.test(path);
}

export function initializeAnalytics() {
  if (typeof window === "undefined" || !import.meta.env.PROD || !import.meta.env.VITE_POSTHOG_PROJECT_TOKEN) return Promise.resolve(undefined);
  initialization ??= import("posthog-js").then(({ default: posthog }) => {
    posthog.init(import.meta.env.VITE_POSTHOG_PROJECT_TOKEN, {
      api_host: import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com",
      person_profiles: "identified_only",
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      capture_exceptions: false,
      disable_surveys: true,
      advanced_disable_feature_flags: true,
      save_campaign_params: false,
      save_referrer: false,
      respect_dnt: true,
      before_send: (event) => {
        if (!event || !analyticsAllowed(window.location.pathname)) return null;
        function cleanUrls(properties: Record<string, unknown>) {
          for (const [key, value] of Object.entries(properties)) {
            if (/url|referrer/i.test(key) && typeof value === "string") {
              try { const url = new URL(value); properties[key] = url.origin + url.pathname; }
              catch { delete properties[key]; }
            } else if (value && typeof value === "object" && !Array.isArray(value)) {
              cleanUrls(value as Record<string, unknown>);
            }
          }
        }
        cleanUrls(event.properties);
        return event;
      },
    });
    client = posthog;
    return client;
  }).catch(() => undefined);
  return initialization;
}

export function syncAnalyticsIdentity(userId: string | null) {
  if (!client) return;
  if (identity === userId) {
    if (userId && analyticsAllowed(window.location.pathname)) client.identify(userId);
    return;
  }
  if (identity) { client.reset(); sent.clear(); }
  identity = userId;
  if (userId && analyticsAllowed(window.location.pathname)) client.identify(userId);
}

export function trackPage(path: string) {
  if (client && analyticsAllowed(path)) client.capture("$pageview", { $current_url: window.location.origin + path });
}

/** Only explicit, nonpersonal properties belong here. Analytics never blocks a save. */
export function trackLearning(event: string, properties: Record<string, string | number | boolean>, onceKey?: string) {
  try {
    if (!client || !identity || !analyticsAllowed(window.location.pathname)) return;
    const key = onceKey && identity + ":" + event + ":" + onceKey;
    if (key && sent.has(key)) return;
    client.capture(event, properties);
    if (key) sent.add(key);
  } catch { /* Optional telemetry must not affect learning. */ }
}
