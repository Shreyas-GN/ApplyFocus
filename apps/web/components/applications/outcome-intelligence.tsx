"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";

interface InsightItem {
  text: string;
  kind: "positive" | "neutral" | "attention";
  sampleSize: number;
}

interface CategoryRow {
  category: string;
  count: number;
  interviews: number;
}

interface InsightsData {
  total: number;
  byStatus: Record<string, number>;
  responseRate: number | null;
  interviewConversionRate: number | null;
  offerRate: number | null;
  followUpsDue: number;
  awaitingResponse: number;
  topCategories: CategoryRow[];
  insights: InsightItem[];
  sampleCount: number;
}

const kindStyles: Record<InsightItem["kind"], string> = {
  positive: "border-ui-success/30 bg-ui-success-soft/70 text-ui-success",
  neutral: "border-ui-border bg-ui-linen/60 text-ui-body",
  attention: "border-ui-warning/30 bg-ui-warning-soft/40 text-ui-ink",
};

export function OutcomeIntelligencePanel() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<InsightsData>("/applications/insights")
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load insights");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      aria-labelledby="outcome-heading"
      className="rounded-2xl border border-ui-border bg-ui-surface p-6"
    >
      <div className="mb-4 border-b border-ui-border pb-3.5">
        <span className="font-mono text-xs font-medium uppercase tracking-[0.06em] text-ui-muted">
          Outcome Intelligence
        </span>
        <h2
          id="outcome-heading"
          className="mt-1 text-xl tracking-[-0.015em] text-ui-ink"
        >
          Application Insights
        </h2>
      </div>

      {loading ? (
        <div className="h-32 animate-pulse rounded-xl bg-ui-linen" />
      ) : error ? (
        <p className="text-sm text-ui-error">{error}</p>
      ) : !data || data.total === 0 ? (
        <p className="text-sm text-ui-muted">
          Track your first application to start seeing outcome patterns here.
        </p>
      ) : (
        <div className="space-y-5">
          {/* Stats strip */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Tracked" value={data.total} />
            <Stat label="Applied" value={data.sampleCount} />
            <Stat
              label="Interview rate"
              value={
                data.interviewConversionRate !== null
                  ? `${data.interviewConversionRate}%`
                  : "—"
              }
              note={data.sampleCount >= 3 ? undefined : "< 3 applications"}
            />
            <Stat
              label="Offer rate"
              value={
                data.offerRate !== null ? `${data.offerRate}%` : "—"
              }
              note={data.sampleCount >= 3 ? undefined : "< 3 applications"}
            />
          </div>

          {/* Follow-up alert */}
          {data.followUpsDue > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-ui-warning/30 bg-ui-warning-soft/40 px-3.5 py-2.5 text-sm text-ui-ink">
              <span className="font-semibold">
                {data.followUpsDue} follow-up{data.followUpsDue === 1 ? "" : "s"} due soon
              </span>
              <span className="text-ui-muted">— check your tracker</span>
            </div>
          )}

          {/* Insights */}
          {data.insights.length > 0 && (
            <ul className="space-y-2">
              {data.insights.map((ins, i) => (
                <li
                  key={i}
                  className={`rounded-xl border px-3.5 py-2.5 text-sm ${kindStyles[ins.kind]}`}
                >
                  {ins.text}
                  {ins.sampleSize < 5 && (
                    <span className="ml-1 text-xs opacity-60">
                      (n={ins.sampleSize})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Top categories */}
          {data.topCategories.length > 0 && (
            <div>
              <p className="mb-2 font-mono text-xs font-medium uppercase tracking-[0.06em] text-ui-muted">
                By Role Category
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ui-border text-left text-ui-muted">
                    <th className="pb-1.5 font-medium">Category</th>
                    <th className="pb-1.5 font-medium text-right">Applied</th>
                    <th className="pb-1.5 font-medium text-right">Interviews</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ui-border">
                  {data.topCategories.map((row) => (
                    <tr key={row.category}>
                      <td className="py-1.5 text-ui-body">{row.category}</td>
                      <td className="py-1.5 text-right text-ui-ink">{row.count}</td>
                      <td className="py-1.5 text-right">
                        <span
                          className={
                            row.interviews > 0
                              ? "font-semibold text-ui-success"
                              : "text-ui-muted"
                          }
                        >
                          {row.interviews}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data.sampleCount < 3 && (
            <p className="text-xs text-ui-muted">
              Track at least 3 applications to unlock pattern-based insights.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number;
  note?: string;
}) {
  return (
    <div className="rounded-xl border border-ui-border bg-ui-linen/35 p-3">
      <p className="font-mono text-xs uppercase tracking-wider text-ui-muted">
        {label}
      </p>
      <p className="mt-0.5 text-xl font-semibold text-ui-ink">{value}</p>
      {note && <p className="mt-0.5 text-xs text-ui-muted">{note}</p>}
    </div>
  );
}
