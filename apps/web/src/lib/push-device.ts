import { removePushSubscription } from "@/lib/api/notifications";
import type { ApiToken } from "@/lib/api";

/** Stop this browser receiving a former account's reminders on sign-out. */
export async function disablePushOnThisDevice(token: ApiToken): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  const json = subscription.toJSON();
  await subscription.unsubscribe();
  if (json.endpoint && json.keys?.p256dh && json.keys.auth) {
    await removePushSubscription(token, {
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    });
  }
}
