import { useEffect, useState } from "react";
import { useAuth } from "@clerk/tanstack-react-start";
import { getPushConfig, getPushSubscriptions, savePushSubscription, type DeviceSubscription } from "@/lib/api/notifications";
import { disablePushOnThisDevice } from "@/lib/push-device";

function decodeKey(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const bytes = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  return Uint8Array.from(bytes, (character) => character.charCodeAt(0));
}

function payload(subscription: PushSubscription): DeviceSubscription {
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) throw new Error("This browser did not provide valid push keys.");
  return { endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } };
}

export function PushDeviceControls() {
  const { getToken, userId } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [available, setAvailable] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    const supported = typeof window !== "undefined" && window.isSecureContext && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    void Promise.resolve().then(() => { if (live) setAvailable(supported); });
    if (!supported || !userId) return;
    void (async () => {
      try {
        const [config, saved, registration] = await Promise.all([
          getPushConfig(getToken), getPushSubscriptions(getToken), navigator.serviceWorker.getRegistration("/"),
        ]);
        const current = await registration?.pushManager.getSubscription();
        if (live) { setConfigured(Boolean(config.public_key)); setEnabled(Boolean(current && saved.endpoints.includes(current.endpoint))); }
      } catch (cause) { if (live) setError(cause instanceof Error ? cause.message : "Couldn't check notifications."); }
    })();
    return () => { live = false; };
  }, [getToken, userId]);

  async function toggle() {
    setBusy(true); setError(null);
    try {
      const registration = await navigator.serviceWorker.register("/push-sw.js", { scope: "/" });
      if (enabled) {
        await disablePushOnThisDevice(getToken);
        setEnabled(false);
      } else {
        const config = await getPushConfig(getToken);
        if (!config.public_key) throw new Error("Notifications are not available yet.");
        if (Notification.permission === "denied") throw new Error("Notifications are blocked in your browser settings.");
        const permission = await Notification.requestPermission();
        if (permission !== "granted") throw new Error("Allow notifications in your browser to use this feature.");
        const existing = await registration.pushManager.getSubscription();
        if (existing) await existing.unsubscribe();
        const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeKey(config.public_key) });
        try { await savePushSubscription(getToken, payload(subscription)); }
        catch (cause) { await subscription.unsubscribe(); throw cause; }
        setEnabled(true);
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Couldn't update notifications."); }
    finally { setBusy(false); }
  }

  return <section className="settings-section"><div className="settings-section-title"><h2>Notifications</h2><p>A nudge when it helps.</p></div><div className="settings-panel"><div className="settings-row"><span>This device<span>{!available ? "Push needs a supported browser. On iPhone, open Fidel from your Home Screen." : !configured ? "Notifications are not configured on the server yet." : enabled ? "Fidel can remind you on this device." : "Choose which reminders you want above, then enable them here."}</span></span><button type="button" className="app-secondary" disabled={!available || !configured || busy} onClick={() => void toggle()}>{busy ? "Updating…" : enabled ? "Turn off" : "Enable notifications"}</button></div>{error && <p className="app-error" role="alert">{error}</p>}</div></section>;
}
