// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { normalizeSyncRow, type NormalizedTask } from "@/lib/sync-excel-parse";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function badRequest(message: string) {
  return NextResponse.json({ error: "Bad Request", detail: message }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const secret = process.env.API_SECRET_KEY?.trim();
  if (!secret) {
    console.error("[api/sync-excel] API_SECRET_KEY is not set");
    return NextResponse.json(
      { error: "Server misconfiguration", detail: "API_SECRET_KEY missing" },
      { status: 500 },
    );
  }

  const key = req.headers.get("x-api-key");
  if (key !== secret) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Body must be JSON");
  }

  if (!Array.isArray(body)) {
    return badRequest("Expected a JSON array of task objects");
  }

  const skipped: { index: number; reason: string }[] = [];

  const normalized = body.reduce<NormalizedTask[]>((acc, row, index) => {
    const n = normalizeSyncRow(row);
    if (!n) {
      skipped.push({ index, reason: "Missing Task ID or invalid row" });
      return acc;
    }
    acc.push(n);
    return acc;
  }, []);

  if (normalized.length === 0) {
    return NextResponse.json({
      ok: true,
      upserted: 0,
      skipped: skipped.length,
      skippedRows: skipped,
      message: "No valid rows to upsert",
    });
  }

  try {
    const results = await prisma.$transaction(
      normalized.filter(Boolean).map((task: any) =>
        prisma.projectTask.upsert({
          where: { taskId: task.taskId },
          create: {
            taskId: task.taskId,
            description: task.description,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate,
          },
          update: {
            description: task.description,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate,
          },
        }),
      ),
    );

    return NextResponse.json({
      ok: true,
      upserted: results.length,
      skipped: skipped.length,
      skippedRows: skipped,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    console.error("[api/sync-excel]", message);
    return NextResponse.json(
      { error: "Sync failed", detail: message },
      { status: 502 },
    );
  }
}
