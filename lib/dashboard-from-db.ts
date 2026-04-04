import type { ProjectTask } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type DashboardPayload = {
  meta: {
    lastSuccessfulRefreshUtc: string;
    source: "supabase";
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

function isCompleted(status: string | null | undefined): boolean {
  return String(status ?? "").trim().toLowerCase() === "completed";
}

function auditOverdue(
  due: Date | null,
  status: string | null | undefined,
  asOf: Date,
): { daysOverdue: number | null; flag: number } {
  const startOfToday = new Date(asOf);
  startOfToday.setHours(0, 0, 0, 0);
  if (!due || isCompleted(status)) return { daysOverdue: null, flag: 0 };
  const d = new Date(due);
  d.setHours(0, 0, 0, 0);
  if (d >= startOfToday) return { daysOverdue: null, flag: 0 };
  const days = Math.floor((startOfToday.getTime() - d.getTime()) / 86400000);
  return { daysOverdue: days, flag: 1 };
}

function rowToDisplay(task: ProjectTask, asOf: Date): Record<string, unknown> {
  const { daysOverdue, flag } = auditOverdue(task.dueDate, task.status, asOf);
  return {
    Task_ID: task.taskId,
    Task_Description: task.description ?? "",
    Status: task.status ?? "",
    Priority: task.priority ?? "",
    Due_Date: task.dueDate ? task.dueDate.toISOString() : "",
    Days_Overdue: daysOverdue,
    Audit_Overdue_Not_Completed: flag,
    updatedAt: task.updatedAt.toISOString(),
  };
}

export async function buildDashboardPayloadFromDb(): Promise<DashboardPayload> {
  const asOf = new Date();
  const rows = await prisma.projectTask.findMany({
    orderBy: [{ dueDate: "asc" }, { taskId: "asc" }],
  });

  const totalTasks = rows.length;
  const blockedTasks = rows.filter(
    (r) => String(r.status ?? "").toLowerCase() === "blocked",
  ).length;
  const completedTasks = rows.filter((r) => isCompleted(r.status)).length;
  const overallAvgCompletionPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 10000) / 100 : 0;

  const lastSync = rows.reduce<Date | null>((acc, r) => {
    const u = r.updatedAt;
    if (!acc || u > acc) return u;
    return acc;
  }, null);

  const tasks = rows.map((r) => rowToDisplay(r, asOf));

  return {
    meta: {
      lastSuccessfulRefreshUtc: (lastSync ?? asOf).toISOString(),
      source: "supabase",
      projectsDetected: 0,
      sheetNamesUsed: [],
      projects: [],
    },
    kpis: {
      totalTasks,
      blockedTasks,
      completedTasks,
      overallAvgCompletionPercent,
    },
    tasks,
  };
}
