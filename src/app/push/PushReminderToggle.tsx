"use client";

import { useCallback, useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { Bell, BellOff } from "lucide-react";
import { subscribeToPush, unsubscribeFromPush } from "./actions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

type Status = "checking" | "off" | "on";

// Push-support detection moved to useSyncExternalStore, not a useEffect +
// setStatus("unsupported") (2026-07-25, CI lint fix): navigator/window
// aren't available during Next's server render, so this can only be
// checked safely after mount — useSyncExternalStore resolves the real
// value as part of the hydration commit itself, with no lint violation
// and no flash of the enabled-looking button before it disappears (the
// old version rendered the button on the server by default, since the
// unsupported check only ever ran in an effect that never fires
// server-side). The actual subscription-status check below is real async
// work and stays in a useEffect — its setState call is already inside a
// .then()/.catch() chain, which this lint rule has never flagged.
function subscribe() {
  return () => {};
}

function getServerSnapshot() {
  return false;
}

export function PushReminderToggle() {
  const getSnapshot = useCallback(() => "serviceWorker" in navigator && "PushManager" in window, []);
  const isSupported = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const [status, setStatus] = useState<Status>("checking");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupported) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setStatus(sub ? "on" : "off"))
      .catch(() => setStatus("off"));
  }, [isSupported]);

  function enable() {
    setError(null);
    startTransition(async () => {
      try {
        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicKey) throw new Error("Push isn't configured yet.");

        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setError("Notifications were blocked — enable them in your browser settings.");
          return;
        }

        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        await subscribeToPush(sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } });
        setStatus("on");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not enable reminders.");
      }
    });
  }

  function disable() {
    setError(null);
    startTransition(async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await unsubscribeFromPush(sub.endpoint);
          await sub.unsubscribe();
        }
        setStatus("off");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not disable reminders.");
      }
    });
  }

  if (!isSupported) return null;

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending || status === "checking"}
        onClick={status === "on" ? disable : enable}
        className="flex items-center gap-1.5 text-xs font-semibold text-ledger disabled:opacity-50"
      >
        {status === "on" ? <Bell size={13} /> : <BellOff size={13} />}
        {status === "on" ? "Reminders on" : "Enable deadline reminders"}
      </button>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
