import webpush from "web-push";

export function isWebPushConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT,
  );
}

let configured = false;

function ensureConfigured() {
  if (configured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  configured = true;
}

export type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

// Returns true if the subscription is dead (410/404) and should be deleted.
export async function sendPush(
  sub: PushSubscriptionRow,
  payload: { title: string; body: string; url?: string },
): Promise<{ delivered: boolean; expired: boolean }> {
  ensureConfigured();

  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify(payload),
    );
    return { delivered: true, expired: false };
  } catch (err) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    const expired = statusCode === 404 || statusCode === 410;
    if (!expired) {
      console.error("Push send failed:", err);
    }
    return { delivered: false, expired };
  }
}
