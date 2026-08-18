// =============================================================================
// /admin -- the private owner dashboard. Server component: all data
// fetching happens here, server-side, using the service-role client
// (lib/adminQueries.js). Nothing here ships the service role key to the
// browser -- this file never runs client-side.
//
// Every section below either renders real data or an explicit error state.
// There is no fallback/placeholder number anywhere in this file -- if a
// query fails, say so, don't substitute 0 or a fake figure.
// =============================================================================

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, isValidSession } from "@/lib/adminAuth";
import {
  getScorecard,
  getPollsByTotalVotes,
  getPollsByRecentActivity,
  getAllPollResults,
  getCategoryTotals,
  getActivityByDay,
  getRejectionStats,
  getPipelineStatus,
} from "@/lib/adminQueries";

const CATEGORY_LABELS = {
  politics: "Politics",
  health: "Health",
  trending: "Trending",
  social: "Social Media",
  home: "Home & Money",
  sports: "Sports & Entertainment",
};

function ErrorBox({ message }) {
  return (
    <div style={{ border: "1.5px solid #D9481E", background: "#FBEDE7", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#8A2E0F" }}>
      Couldn't load this: {message}
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    LIVE: { bg: "#E6F4EE", fg: "#1F8A6F" },
    DRAFT: { bg: "#F0EEE6", fg: "#6B7280" },
    EXPIRED: { bg: "#FBEDE7", fg: "#8A2E0F" },
    ARCHIVED: { bg: "#F0EEE6", fg: "#9CA3AF" },
  };
  const c = colors[status] || colors.DRAFT;
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: 10,
        background: c.bg,
        color: c.fg,
      }}
    >
      {status}
    </span>
  );
}

export default async function AdminDashboardPage() {
  // Defense-in-depth: middleware.js already redirects unauthenticated
  // requests to /admin/login before this page's data-fetching code ever
  // runs, but this check means that guarantee doesn't depend solely on
  // middleware.js staying correct forever.
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!(await isValidSession(session))) {
    redirect("/admin/login");
  }

  const [scorecard, mostAnswered, mostRecent, allResults, categoryTotals, activityByDay, rejections, pipelineStatus] =
    await Promise.all([
      getScorecard(),
      getPollsByTotalVotes(5),
      getPollsByRecentActivity(5),
      getAllPollResults(),
      getCategoryTotals(),
      getActivityByDay(14),
      getRejectionStats(),
      getPipelineStatus(),
    ]);

  const pollById = {};
  if (allResults.data) allResults.data.forEach((p) => (pollById[p.id] = p));

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, margin: 0 }}>
          What Do People Think? — Owner
        </h1>
        <form action="/api/admin/logout" method="post">
          <button
            type="submit"
            style={{ background: "none", border: "1px solid #E4E1D8", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}
          >
            Log out
          </button>
        </form>
      </div>

      {/* 1-4: Scorecard */}
      <section style={{ marginBottom: 36 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          <ScorecardCell label="Total votes" result={scorecard.totalVotes} />
          <ScorecardCell label="Today" result={scorecard.votesToday} />
          <ScorecardCell label="Last 7 days" result={scorecard.votesLast7d} />
          <ScorecardCell label="Live polls" result={scorecard.activePolls} />
        </div>
      </section>

      {/* 5: Most answered */}
      <Section title="Most answered">
        {mostAnswered.error ? (
          <ErrorBox message={mostAnswered.error} />
        ) : (
          <RankedList
            items={mostAnswered.data}
            keyField="poll_id"
            valueField="total_votes"
            valueLabel="votes"
            pollById={pollById}
          />
        )}
      </Section>

      {/* 6: Recent activity */}
      <Section title="Most active in the last 24 hours">
        {mostRecent.error ? (
          <ErrorBox message={mostRecent.error} />
        ) : mostRecent.data.length === 0 ? (
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>No votes in the last 24 hours.</p>
        ) : (
          <RankedList
            items={mostRecent.data}
            keyField="poll_id"
            valueField="recent_votes"
            valueLabel="votes (24h)"
            pollById={pollById}
          />
        )}
      </Section>

      {/* 8: Category totals */}
      <Section title="Category totals">
        {categoryTotals.error ? (
          <ErrorBox message={categoryTotals.error} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {Object.entries(categoryTotals.data)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, total]) => (
                <div key={cat} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "6px 0", borderBottom: "1px solid #F0EEE6" }}>
                  <span>{CATEGORY_LABELS[cat] || cat}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{total}</span>
                </div>
              ))}
          </div>
        )}
      </Section>

      {/* 9: Activity by day */}
      <Section title="Votes by day (last 14 days)">
        {activityByDay.error ? (
          <ErrorBox message={activityByDay.error} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {Object.entries(activityByDay.data)
              .sort((a, b) => (a[0] < b[0] ? 1 : -1))
              .map(([day, count]) => (
                <div key={day} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
                  <span style={{ color: "#6B7280" }}>{day}</span>
                  <span>{count}</span>
                </div>
              ))}
            {Object.keys(activityByDay.data).length === 0 && (
              <p style={{ fontSize: 13, color: "#9CA3AF" }}>No votes in this window.</p>
            )}
          </div>
        )}
      </Section>

      {/* 10: Rejections */}
      <Section title="Duplicate-vote / rejected attempts">
        {rejections.error ? (
          <ErrorBox message={rejections.error} />
        ) : Object.keys(rejections.data).length === 0 ? (
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>No rejected attempts logged yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {Object.entries(rejections.data)
              .sort((a, b) => b[1] - a[1])
              .map(([reason, count]) => (
                <div key={reason} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{reason}</span>
                  <span style={{ fontWeight: 700 }}>{count}</span>
                </div>
              ))}
          </div>
        )}
      </Section>

      {/* Pipeline status: content freshness for the Trending Poll Pipeline */}
      <Section title="Needs a look (Trending Poll Pipeline)">
        {pipelineStatus.error ? (
          <ErrorBox message={pipelineStatus.error} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <PipelineGroup
              label="Alive but expired — still published, silently rejecting votes"
              items={pipelineStatus.data.alreadyExpiredButStillPublished}
              emptyText="None. Good."
              urgent
            />
            <PipelineGroup
              label="Expiring within 7 days"
              items={pipelineStatus.data.expiringSoon}
              emptyText="Nothing expiring soon."
            />
            <PipelineGroup
              label="Drafts awaiting review"
              items={pipelineStatus.data.drafts}
              emptyText="No drafts staged."
            />
          </div>
        )}
      </Section>

      {/* 7: Full per-poll breakdown */}
      <Section title="All polls">
        {allResults.error ? (
          <ErrorBox message={allResults.error} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {allResults.data.map((poll) => (
              <div key={poll.id} style={{ border: "1px solid #E4E1D8", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#6B7280", fontFamily: "'JetBrains Mono', monospace", marginBottom: 3 }}>
                      {CATEGORY_LABELS[poll.category] || poll.category} · {poll.id}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{poll.question}</div>
                  </div>
                  <StatusBadge status={poll.liveStatus} />
                </div>
                <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 8 }}>{poll.total} total votes</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {poll.choices.map((c, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span>{c.label}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {c.pct}% ({c.count})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B7280", marginBottom: 12 }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function ScorecardCell({ label, result }) {
  return (
    <div style={{ border: "1.5px solid #E4E1D8", borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>{label}</div>
      {result.error ? (
        <div style={{ fontSize: 12, color: "#D9481E" }}>error</div>
      ) : (
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 700 }}>
          {result.data ?? 0}
        </div>
      )}
    </div>
  );
}

function PipelineGroup({ label, items, emptyText, urgent }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: urgent && items.length > 0 ? "#D9481E" : "#6B7280", marginBottom: 6 }}>
        {label} {items.length > 0 && `(${items.length})`}
      </div>
      {items.length === 0 ? (
        <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>{emptyText}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {items.map((p) => (
            <div key={p.id} style={{ fontSize: 13, display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span>{p.question}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#9CA3AF", flexShrink: 0 }}>
                {p.id}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RankedList({ items, keyField, valueField, valueLabel, pollById }) {
  if (!items || items.length === 0) {
    return <p style={{ fontSize: 13, color: "#9CA3AF" }}>No data yet.</p>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((item, i) => {
        const poll = pollById[item[keyField]];
        return (
          <div key={item[keyField]} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "6px 0", borderBottom: "1px solid #F0EEE6" }}>
            <span>
              {i + 1}. {poll ? poll.question : item[keyField]}
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, flexShrink: 0, marginLeft: 12 }}>
              {item[valueField]} {valueLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
}
