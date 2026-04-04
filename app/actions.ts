"use server";

import { buildDashboardPayloadFromDb } from "@/lib/dashboard-from-db";

export async function refreshDashboardAction() {
  return buildDashboardPayloadFromDb();
}
