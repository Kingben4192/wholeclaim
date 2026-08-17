const GUMROAD = "https://hammondson6.gumroad.com/l/woisbe";

const SOURCES = ["direct", "poll", "qr"];
const OPTIONS = ["yes_before", "only_after"];

async function record(event) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SERVICE_ROLE_KEY;
  if (!url || !key) return;

  try {
    await fetch(url.replace(/\/+$/, "") + "/rest/v1/poll_events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: "Bearer " + key,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(event),
    });
  } catch (_) {
    // Never let instrumentation break the purchase path.
  }
}

export default async function handler(req, res) {
  const source = SOURCES.includes(req.query.s) ? req.query.s : "direct";
  const option =
    source === "poll" && OPTIONS.includes(req.query.o) ? req.query.o : null;

  await record({
    event_type: "gumroad_click",
    source: source,
    poll_option: option,
  });

  const dest = new URL(GUMROAD);
  dest.searchParams.set("src", option ? source + "_" + option : source);

  res.setHeader("Cache-Control", "no-store");
  res.redirect(302, dest.toString());
}
