const TYPES = ["page_view", "vote", "offer_view"];
const SOURCES = ["direct", "poll", "qr"];
const OPTIONS = ["yes_before", "only_after"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (_) {
      return res.status(204).end();
    }
  }
  if (!body || typeof body !== "object") return res.status(204).end();

  const event_type = TYPES.includes(body.event_type) ? body.event_type : null;
  const source = SOURCES.includes(body.source) ? body.source : null;
  const poll_option =
    source === "poll" && OPTIONS.includes(body.poll_option)
      ? body.poll_option
      : null;

  if (!event_type || !source) return res.status(204).end();
  if (source === "poll" && event_type !== "page_view" && !poll_option) {
    return res.status(204).end();
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SERVICE_ROLE_KEY;

  if (url && key) {
    try {
      await fetch(url.replace(/\/+$/, "") + "/rest/v1/poll_events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: key,
          Authorization: "Bearer " + key,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ event_type, source, poll_option }),
      });
    } catch (_) {
      // Instrumentation must never surface an error to the visitor.
    }
  }

  res.setHeader("Cache-Control", "no-store");
  return res.status(204).end();
}
