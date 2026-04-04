function normKey(k: string): string {
  return k.toLowerCase().replace(/\s+/g, " ").trim();
}

function getField(row: Record<string, unknown>, candidates: string[]): unknown {
  const map = new Map<string, unknown>();
  for (const [k, v] of Object.entries(row)) {
    map.set(normKey(k), v);
  }
  for (const c of candidates) {
    const v = map.get(normKey(c));
    if (v != null && String(v).trim() !== "") return v;
  }
  return undefined;
}

function parseDueDate(v: unknown): Date | null {
  if (v == null || v === "") return null;
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
  const s = String(v).trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export type NormalizedTask = {
  taskId: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  dueDate: Date | null;
};

export function normalizeSyncRow(raw: unknown): NormalizedTask | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;

  const taskIdRaw = getField(row, [
    "taskId",
    "Task ID",
    "TaskID",
    "task_id",
    "ID",
  ]);
  if (taskIdRaw == null) return null;
  const taskId = String(taskIdRaw).trim();
  if (!taskId) return null;

  const descriptionRaw = getField(row, [
    "description",
    "Description",
    "Task Description",
    "Task_Description",
  ]);
  const statusRaw = getField(row, ["status", "Status"]);
  const priorityRaw = getField(row, ["priority", "Priority"]);
  const dueRaw = getField(row, ["Due Date", "dueDate", "due_date", "DueDate"]);

  return {
    taskId,
    description: descriptionRaw != null ? String(descriptionRaw) : null,
    status: statusRaw != null ? String(statusRaw) : null,
    priority: priorityRaw != null ? String(priorityRaw) : null,
    dueDate: parseDueDate(dueRaw),
  };
}
