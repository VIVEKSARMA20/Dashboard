import * as XLSX from "xlsx";

export type TaskRow = Record<string, string | number | Date | null | undefined>;

const HEADER_ALIASES: Record<string, string> = {
  "task id": "Task_ID",
  "taskid": "Task_ID",
  id: "Task_ID",
  "task description": "Task_Description",
  description: "Task_Description",
  assignee: "Assignee",
  owner: "Assignee",
  priority: "Priority",
  status: "Status",
  "start date": "Start_Date",
  start: "Start_Date",
  "due date": "Due_Date",
  deadline: "Due_Date",
  due: "Due_Date",
  "completion percentage": "Completion_Percentage",
  "% complete": "Completion_Percentage",
  complete: "Completion_Percentage",
  "comments/blockers": "Comments_Blockers",
  comments: "Comments_Blockers",
  blockers: "Comments_Blockers",
};

function normalizeHeader(h: unknown): string {
  const s = String(h ?? "")
    .replace(/\u00a0/g, " ")
    .trim()
    .toLowerCase();
  return HEADER_ALIASES[s] ?? String(h ?? "").replace(/\u00a0/g, " ").trim();
}

function cleanCell(v: unknown): string | number | Date | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v;
  if (typeof v === "number" && !Number.isFinite(v)) return null;
  if (typeof v === "string") {
    const t = v.replace(/\u00a0/g, " ").trim();
    return t === "" ? null : t;
  }
  return v as number;
}

function parseDate(v: string | number | Date | null): Date | null {
  if (v === null) return null;
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (!d) return null;
    return new Date(Date.UTC(d.y, d.m - 1, d.d));
  }
  const s = String(v).trim();
  if (!s) return null;
  const parsed = new Date(s);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeStatus(s: string | null): string | null {
  if (!s) return null;
  const x = s.trim();
  const lower = x.toLowerCase();
  const map: Record<string, string> = {
    "not started": "Not Started",
    "in progress": "In Progress",
    blocked: "Blocked",
    completed: "Completed",
  };
  return map[lower] ?? x;
}

export function mergeWorkbookSheets(
  buffer: ArrayBuffer,
  options: { excludeSheets: Set<string> },
): { rows: TaskRow[]; sheetNamesUsed: string[] } {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true, raw: false });
  const rows: TaskRow[] = [];
  const sheetNamesUsed: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    if (options.excludeSheets.has(sheetName.trim().toLowerCase())) continue;

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: null,
      raw: false,
    });
    if (json.length === 0) continue;

    const first = json[0];
    const rawKeys = Object.keys(first);
    const canonicalKeys = rawKeys.map((k) => normalizeHeader(k));
    const KNOWN = new Set([
      "Task_ID",
      "Task_Description",
      "Assignee",
      "Priority",
      "Status",
      "Start_Date",
      "Due_Date",
      "Completion_Percentage",
      "Comments_Blockers",
    ]);
    const hasRealHeader = canonicalKeys.some((k) => KNOWN.has(k));

    if (!hasRealHeader && rawKeys.length > 0) {
      continue;
    }

    sheetNamesUsed.push(sheetName);

    for (const record of json) {
      const out: TaskRow = { Project_Name: sheetName };
      rawKeys.forEach((rawKey, i) => {
        const canon = canonicalKeys[i] || rawKey;
        let val = cleanCell((record as Record<string, unknown>)[rawKey]);
        if (canon === "Start_Date" || canon === "Due_Date") {
          val = parseDate(val as string | number | Date | null);
        }
        if (canon === "Status") val = normalizeStatus(val as string | null);
        if (canon === "Completion_Percentage" && typeof val === "string") {
          const n = parseFloat(val.replace("%", "").trim());
          val = Number.isFinite(n) ? n : val;
        }
        out[canon] = val;
      });
      rows.push(out);
    }
  }

  return { rows, sheetNamesUsed };
}

export function enrichAuditFields(rows: TaskRow[], asOf: Date): TaskRow[] {
  const startOfToday = new Date(asOf);
  startOfToday.setHours(0, 0, 0, 0);

  return rows.map((r) => {
    const due = r.Due_Date instanceof Date ? r.Due_Date : null;
    const status = String(r.Status ?? "").toLowerCase();
    const completed = status === "completed";

    let daysOverdue: number | null = null;
    if (due && !completed) {
      const d = new Date(due);
      d.setHours(0, 0, 0, 0);
      if (d < startOfToday) {
        daysOverdue = Math.floor((startOfToday.getTime() - d.getTime()) / 86400000);
      }
    }

    const auditOverdueFlag = due && !completed && due < startOfToday ? 1 : 0;

    return {
      ...r,
      Days_Overdue: daysOverdue,
      Audit_Overdue_Not_Completed: auditOverdueFlag,
    };
  });
}
