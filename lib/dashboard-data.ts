import { enrichAuditFields, mergeWorkbookSheets } from "@/lib/excel-merge";
import { downloadExcelFromSharePoint } from "@/lib/sharepoint-file";
import { getExcludedSheetNames } from "@/lib/env";

export type DashboardPayload = {
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
  tasks: Record<string, unknown>[];
};

export async function buildDashboardPayload(): Promise<DashboardPayload> {
  const asOf = new Date();
  const buffer = await downloadExcelFromSharePoint();
  const { rows, sheetNamesUsed } = mergeWorkbookSheets(buffer, {
    excludeSheets: getExcludedSheetNames(),
  });

  const enriched = enrichAuditFields(rows, asOf);

  const totalTasks = enriched.length;
  const blocked = enriched.filter(
    (r) => String(r.Status ?? "").toLowerCase() === "blocked",
  ).length;
  const completed = enriched.filter(
    (r) => String(r.Status ?? "").toLowerCase() === "completed",
  ).length;
  const avgCompletion =
    totalTasks > 0
      ? enriched.reduce((acc, r) => {
          const v = r.Completion_Percentage;
          const n = typeof v === "number" ? v : parseFloat(String(v ?? 0));
          return acc + (Number.isFinite(n) ? n : 0);
        }, 0) / totalTasks
      : 0;

  const projects = [
    ...new Set(enriched.map((r) => String(r.Project_Name ?? ""))),
  ].filter(Boolean);

  const serialized = JSON.parse(JSON.stringify(enriched)) as Record<string, unknown>[];

  return {
    meta: {
      lastSuccessfulRefreshUtc: asOf.toISOString(),
      source: "sharepoint",
      projectsDetected: projects.length,
      sheetNamesUsed,
      projects,
    },
    kpis: {
      totalTasks,
      blockedTasks: blocked,
      completedTasks: completed,
      overallAvgCompletionPercent: Math.round(avgCompletion * 100) / 100,
    },
    tasks: serialized,
  };
}
