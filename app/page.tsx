import { buildDashboardPayloadFromDb } from "@/lib/dashboard-from-db";
import { DashboardClient } from "./ui/dashboard-client";

export default async function HomePage() {
  let initial = null;
  let bootError: string | null = null;
  try {
    initial = await buildDashboardPayloadFromDb();
  } catch (e) {
    initial = null;
    bootError =
      e instanceof Error
        ? e.message
        : "Failed to load tasks. Set DATABASE_URL and run Prisma against Supabase.";
  }

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "1.5rem" }}>
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 600 }}>
          Project management dashboard
        </h1>
        <p style={{ margin: "0.35rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
          Tasks stored in Supabase (PostgreSQL). POST JSON to{" "}
          <code style={{ color: "var(--text)" }}>/api/sync-excel</code> to upsert rows.
        </p>
      </header>
      <DashboardClient initialData={initial} loadError={initial ? null : bootError} />
    </main>
  );
}
