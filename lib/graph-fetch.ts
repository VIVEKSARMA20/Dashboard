import { ClientSecretCredential } from "@azure/identity";
import { getGraphEnv } from "./env";

let credential: ClientSecretCredential | null = null;

function getCredential(): ClientSecretCredential {
  if (!credential) {
    const { tenantId, clientId, clientSecret } = getGraphEnv();
    credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
  }
  return credential;
}

export async function getGraphAccessToken(): Promise<string> {
  const c = getCredential();
  const token = await c.getToken("https://graph.microsoft.com/.default");
  if (!token) throw new Error("Failed to acquire Microsoft Graph access token.");
  return token.token;
}

async function graphFetch(path: string, init?: RequestInit): Promise<Response> {
  const accessToken = await getGraphAccessToken();
  const url = path.startsWith("http")
    ? path
    : `https://graph.microsoft.com/v1.0${path.startsWith("/") ? "" : "/"}${path}`;
  return fetch(url, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function graphGetJson<T>(path: string): Promise<T> {
  const res = await graphFetch(path);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Graph error ${res.status}: ${text.slice(0, 500)}`);
  }
  return JSON.parse(text) as T;
}

export async function graphGetArrayBuffer(path: string): Promise<ArrayBuffer> {
  const res = await graphFetch(path);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Graph error ${res.status}: ${text.slice(0, 500)}`);
  }
  return res.arrayBuffer();
}
