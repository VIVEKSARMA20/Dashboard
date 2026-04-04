import { NextRequest, NextResponse } from "next/server";
import { buildDashboardPayloadFromDb } from "@/lib/dashboard-from-db";
import { getOptionalApiKey } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest) {
  const apiKey = getOptionalApiKey();
  if (apiKey) {
    const sent = req.headers.get("x-api-key");
    if (sent !== apiKey) return unauthorized();
  }

  try {
    const payload = await buildDashboardPayloadFromDb();
    return NextResponse.json(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[api/data]", message);
    return NextResponse.json(
      {
        error: "Refresh failed",
        detail: message,
      },
      { status: 502 },
    );
  }
}
