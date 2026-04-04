function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

export function getGraphEnv() {
  return {
    tenantId: required("AZURE_TENANT_ID"),
    clientId: required("AZURE_CLIENT_ID"),
    clientSecret: required("AZURE_CLIENT_SECRET"),
  };
}

/** SharePoint hostname only, e.g. contoso.sharepoint.com */
export function getSharePointHostname(): string {
  return required("SHAREPOINT_HOSTNAME");
}

/**
 * Server-relative site path, e.g. /sites/ProjectOffice
 * (no hostname; leading slash optional)
 */
export function getSharePointSitePath(): string {
  const p = required("SHAREPOINT_SITE_PATH").trim();
  return p.startsWith("/") ? p : `/${p}`;
}

/**
 * Path to the .xlsx file inside the site's default document library,
 * relative to drive root. Example: Shared Documents/PMO/MasterTracker.xlsx
 */
export function getExcelFilePath(): string {
  return required("EXCEL_FILE_PATH");
}

/** Optional: comma-separated sheet names to skip (e.g. Summary,Lookup,Sheet1) */
export function getExcludedSheetNames(): Set<string> {
  const raw = process.env.EXCEL_EXCLUDE_SHEETS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** If set, GET /api/data must send header x-api-key: <value> */
export function getOptionalApiKey(): string | undefined {
  const k = process.env.DASHBOARD_API_KEY?.trim();
  return k || undefined;
}
