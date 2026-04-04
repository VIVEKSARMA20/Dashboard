import { graphGetArrayBuffer, graphGetJson } from "./graph-fetch";
import {
  getExcelFilePath,
  getSharePointHostname,
  getSharePointSitePath,
} from "./env";

function encodeDriveItemPath(path: string): string {
  return path
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

/**
 * Resolves the SharePoint site and downloads the Excel file as ArrayBuffer.
 * App-only (client credentials) — requires Azure AD app + admin consent.
 */
export async function downloadExcelFromSharePoint(): Promise<ArrayBuffer> {
  const hostname = getSharePointHostname();
  const sitePath = getSharePointSitePath();
  const filePath = getExcelFilePath().replace(/^\/+/, "");

  const siteIdentifier = `${hostname}:${sitePath}`;
  const site = await graphGetJson<{ id: string }>(
    `/sites/${encodeURIComponent(siteIdentifier)}`,
  );
  if (!site?.id) {
    throw new Error(
      "Could not resolve SharePoint site. Verify SHAREPOINT_HOSTNAME and SHAREPOINT_SITE_PATH.",
    );
  }

  const encodedPath = encodeDriveItemPath(filePath);
  const contentPath = `/sites/${site.id}/drive/root:/${encodedPath}:/content`;

  return graphGetArrayBuffer(contentPath);
}
