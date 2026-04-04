"use client";

import type { CSSProperties } from "react";
import { useMemo, useState, useTransition } from "react";
import { refreshDashboardAction } from "../actions";

type TaskRow = Record<string, unknown>;

type ApiPayload = {
  meta: {
    lastSuccessfulRefreshUtc: string;
    source: string;
    projectsDetected: number;
    sheetNamesUsed: string[];
    projects: string[];
  };
  kpis: {
    totalTasks: number;
    blockedTasks: number;
    completedTasks: number;
    overallAvgCompletionPercent: number;
  };
  tasks: TaskRow[];
};

const STATUS_STYLES: Record<string, { bg: string; fg: string }> = {
  completed: { bg: "var(--status-completed)", fg: "#0f1419" },
  "in progress": { bg: "var(--status-progress)", fg: "#0f1419" },
  blocked: { bg: "var(--status-blocked)", fg: "#f8f8f8" },
  "not started": { bg: "var(--status-notstarted)", fg: "#0f1419" },
};

const PRIORITY_STYLES: Record<string, { bg: string; fg: string }> = {
  high: { bg: "var(--priority-high)", fg: "#0f1419" },
  medium: { bg: "var(--priority-medium)", fg: "#0f1419" },
  low: { bg: "var(--priority-low)", fg: "#0f1419" },
};

function pill(label: string, map: Record<string, { bg: string; fg: string }>, key: string) {
  const k = key.toLowerCase();
  const s = map[k] ?? { bg: "var(--surface)", fg: "var(--text)" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 6,
        fontSize: "0.75rem",
        fontWeight: 600,
        background: s.bg,
        color: s.fg,
      }}
    >
      {label}
    </span>
  );
}

export function DashboardClient({
  initialData,
  loadError,
}: {
  initialData: ApiPayload | null;
  loadError: string | null;
}) {
  const [data, setData] = useState<ApiPayload | null>(initialData);
  const [error, setError] = useState<string | null>(loadError);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string>("");

  const refresh = () => {
    startTransition(async () => {
      setError(null);
      try {
        const next = await refreshDashboardAction();
        setData(next);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Refresh failed");
      }
    });
  };

  const filtered = useMemo(() => {
    if (!data?.tasks) return [];
    return data.tasks.filter((t) => {
      const s = String(t.Status ?? "");
      if (status && s.toLowerCase() !== status.toLowerCase()) return false;
      return true;
    });
  }, [data, status]);

  return (
    <div>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <button
          type="button"
          onClick={refresh}
          disabled={pending}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
            cursor: pending ? "wait" : "pointer",
          }}
        >
          {pending ? "Refreshing…" : "Refresh from database"}
        </button>
      </div>

      {error && (
        <p style={{ color: "var(--status-blocked)", marginBottom: "1rem" }} role="alert">
          {error}
        </p>
      )}

      {data && (
        <>
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "0.75rem",
              marginBottom: "1.25rem",
            }}
          >
            <Kpi
              label="Last activity (UTC)"
              value={new Date(data.meta.lastSuccessfulRefreshUtc).toLocaleString()}
            />
            <Kpi label="Total tasks" value={String(data.kpis.totalTasks)} />
            <Kpi label="Overall completion %" value={String(data.kpis.overallAvgCompletionPercent)} />
            <Kpi label="Blocked" value={String(data.kpis.blockedTasks)} />
            <Kpi label="Completed" value={String(data.kpis.completedTasks)} />
          </section>

          <section style={{ marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1rem", margin: "0 0 0.5rem" }}>Filters</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={selectStyle}>
                <option value="">All statuses</option>
                {["Not Started", "In Progress", "Blocked", "Completed"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: "1rem", margin: "0 0 0.5rem" }}>
              Tasks ({filtered.length} rows)
            </h2>
            <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ background: "var(--surface)", textAlign: "left" }}>
                    {[
                      "Task_ID",
                      "Task_Description",
                      "Status",
                      "Priority",
                      "Due_Date",
                      "Days_Overdue",
                      "Audit_Overdue_Not_Completed",
                    ].map((h) => (
                      <th key={h} style={{ padding: "0.5rem", borderBottom: "1px solid var(--border)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => {
                    const overdue = Number(row.Audit_Overdue_Not_Completed) === 1;
                    return (
                      <tr
                        key={`${String(row.Task_ID ?? "")}-${i}`}
                        style={{
                          background: overdue ? "rgba(200, 92, 92, 0.12)" : undefined,
                        }}
                      >
                        <td style={td}>{String(row.Task_ID ?? "")}</td>
                        <td style={td}>{String(row.Task_Description ?? "")}</td>
                        <td style={td}>{pill(String(row.Status ?? ""), STATUS_STYLES, String(row.Status ?? "").toLowerCase())}</td>
                        <td style={td}>{pill(String(row.Priority ?? ""), PRIORITY_STYLES, String(row.Priority ?? ""))}</td>
                        <td style={td}>{formatMaybeDate(row.Due_Date)}</td>
                        <td style={td}>{row.Days_Overdue == null ? "" : String(row.Days_Overdue)}</td>
                        <td style={td}>{String(row.Audit_Overdue_Not_Completed ?? "")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {!data && !error && (
        <p style={{ color: "var(--muted)" }}>Loading…</p>
      )}
    </div>
  );
}

const td: CSSProperties = {
  padding: "0.45rem 0.5rem",
  borderBottom: "1px solid var(--border)",
  verticalAlign: "top",
};

const selectStyle: CSSProperties = {
  padding: "0.35rem 0.5rem",
  borderRadius: 6,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text)",
  minWidth: 160,
};

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: "0.75rem",
        borderRadius: 8,
        border: "1px solid var(--border)",
        background: "var(--surface)",
      }}
    >
      <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function formatMaybeDate(v: unknown): string {
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  if (typeof v === "string" && v) return v.slice(0, 10);
  return "";
}
