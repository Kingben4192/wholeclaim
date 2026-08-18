// =============================================================================
// Ticket 3, Stage 1 — source ingestion.
//
// Pulls recent headlines from RSS. Zero dependencies: RSS and Atom are simple
// enough to parse directly, and this runs in a serverless function where every
// added package is weight on a cold start. Nothing here interprets or judges a
// story — it returns headline, summary, link and date, which is all stage 2
// needs.
//
// SOURCE LIST IS PROVISIONAL. Scope decision 1 ("which outlets?") is still
// open, and it matters more than it looks: the feed list determines the slant
// of what gets proposed long before any filter or prompt sees it. The default
// below is a starting proposal, deliberately spread across general, tech/policy
// and business rather than concentrated in one editorial stance. Replace it
// once the decision is made.
// =============================================================================

export const DEFAULT_FEEDS = [
  // General / wire — broad national coverage, different ownership
  { id: "npr", label: "NPR", url: "https://feeds.npr.org/1001/rss.xml" },
  { id: "bbc-us", label: "BBC US & Canada", url: "https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml" },
  { id: "cbs", label: "CBS News", url: "https://www.cbsnews.com/latest/rss/main" },

  // Tech / policy / privacy — where stories like Flock Safety actually surface
  { id: "arstechnica", label: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/index" },
  { id: "eff", label: "EFF Deeplinks", url: "https://www.eff.org/rss/updates.xml" },

  // Economy / consumer — grocery, energy, prices
  { id: "marketwatch", label: "MarketWatch", url: "https://feeds.content.dowjones.io/public/rss/mw_topstories" },

  // Sports & entertainment — the site's largest live category after trending
  // and social, and previously unserved by any feed here.
  { id: "espn", label: "ESPN", url: "https://www.espn.com/espn/rss/news" },
];

const MAX_ITEMS_PER_FEED = 15;
const DEFAULT_WINDOW_HOURS = 36;

function decode(s) {
  return (
    String(s || "")
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      // Numeric entities first. Several feeds (MarketWatch among them) emit
      // curly quotes as &#x2019; rather than a named entity; without this the
      // raw code leaks into headline text and then into a drafted question.
      .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, " ")
      // &amp; last, so "&amp;#x2019;" cannot round-trip into a live entity.
      .replace(/&amp;/g, "&")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decode(m[1]) : "";
}

// Atom puts the URL in an attribute rather than element text.
function atomLink(block) {
  const m = block.match(/<link[^>]*href=["']([^"']+)["']/i);
  return m ? m[1] : "";
}

function parseFeed(xml, feed) {
  const blocks = xml.match(/<(item|entry)\b[\s\S]*?<\/\1>/gi) || [];
  return blocks.slice(0, MAX_ITEMS_PER_FEED).map((b) => {
    const link = tag(b, "link") || atomLink(b);
    const dateStr =
      tag(b, "pubDate") || tag(b, "published") || tag(b, "updated") || tag(b, "dc:date");
    const parsed = dateStr ? new Date(dateStr) : null;
    return {
      sourceId: feed.id,
      sourceLabel: feed.label,
      title: tag(b, "title"),
      summary: (tag(b, "description") || tag(b, "summary") || tag(b, "content")).slice(0, 600),
      url: link,
      publishedAt: parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : null,
    };
  });
}

/**
 * Fetch one feed. Never throws — a dead feed must not take down the morning
 * run. Returns { items, error } so the caller can report partial failure
 * honestly rather than silently proceeding on four sources instead of six.
 */
export async function fetchFeed(feed, { timeoutMs = 10000 } = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(feed.url, {
      signal: ctl.signal,
      headers: { "user-agent": "whatdopeoplethink-topstory/1.0 (+https://whatdopeoplethink.vercel.app)" },
    });
    if (!res.ok) return { items: [], error: `HTTP ${res.status}` };
    const xml = await res.text();
    return { items: parseFeed(xml, feed), error: null };
  } catch (e) {
    return { items: [], error: e.name === "AbortError" ? "timeout" : e.message };
  } finally {
    clearTimeout(t);
  }
}

// Same story from three outlets should reach stage 2 once, not three times.
function dedupeKey(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 8)
    .join(" ");
}

/**
 * Fetch every feed in parallel and return recent, deduplicated headlines.
 *
 * @returns {{ items:Array, sources:Array<{id,label,count,error}> }}
 *   `sources` is always returned so a caller can surface "4 of 6 feeds
 *   responded" instead of quietly presenting a thinner day as a normal one.
 */
export async function fetchRecentHeadlines({
  feeds = DEFAULT_FEEDS,
  windowHours = DEFAULT_WINDOW_HOURS,
  now = new Date(),
} = {}) {
  const results = await Promise.all(feeds.map((f) => fetchFeed(f)));

  const cutoff = new Date(now.getTime() - windowHours * 3600 * 1000);
  const seen = new Set();
  const items = [];
  const sources = [];

  results.forEach((r, i) => {
    const feed = feeds[i];
    let kept = 0;
    for (const it of r.items) {
      if (!it.title || !it.url) continue;
      // Undated items are kept: some feeds omit dates, and dropping them would
      // silently lose whole sources.
      if (it.publishedAt && new Date(it.publishedAt) < cutoff) continue;
      const k = dedupeKey(it.title);
      if (!k || seen.has(k)) continue;
      seen.add(k);
      items.push(it);
      kept++;
    }
    sources.push({ id: feed.id, label: feed.label, count: kept, error: r.error });
  });

  items.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
  return { items, sources };
}
