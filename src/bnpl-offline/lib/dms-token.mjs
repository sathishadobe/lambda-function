/**
 * DMS OAuth / client-credentials token (POST gettoken).
 * Env: DMS_TOKEN_URL, DMS_CLIENT_ID, DMS_CLIENT_SECRET — staging: *_STAGING (see getDmsConfig).
 */

import { getDmsConfig } from "./env-context.mjs";

/** @type {Map<string, { token: string, expiresAt: number }>} */
const tokenCache = new Map();

/**
 * @param {import('./env-context.mjs').Environment} environment
 * @param {{ forceRefresh?: boolean }} [options]
 */
export async function getDmsAccessToken(environment, options) {
  const forceRefresh = options?.forceRefresh === true;
  const now = Date.now();
  const cached = tokenCache.get(environment);
  if (!forceRefresh && cached && cached.expiresAt > now + 5000) {
    return cached.token;
  }

  const cfg = getDmsConfig(environment);
  if (!cfg.tokenUrl || !cfg.clientId || !cfg.clientSecret) {
    throw new Error(
      "DMS token config incomplete: set DMS_TOKEN_URL, DMS_CLIENT_ID, DMS_CLIENT_SECRET"
    );
  }

  const response = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: cfg.clientId,
      clientSecret: cfg.clientSecret
    })
  });

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(`DMS token request failed: HTTP ${response.status} ${JSON.stringify(data)}`);
  }

  const token = extractAccessToken(data);
  if (!token) {
    throw new Error(`DMS token response missing token field: ${JSON.stringify(data)}`);
  }

  const expiresInSec = Number(data.expires_in ?? data.expiresIn ?? 3600);
  tokenCache.set(environment, {
    token,
    expiresAt: now + Math.max(60, expiresInSec) * 1000 - 60_000
  });

  return token;
}

export function extractAccessToken(data) {
  if (!data || typeof data !== "object") {
    return "";
  }
  return (
    data.access_token ??
    data.accessToken ??
    data.token ??
    data.data?.access_token ??
    data.data?.token ??
    ""
  );
}

export async function parseJsonSafe(response) {
  const text = await response.text();
  if (!text) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch {
    return { _raw: text };
  }
}
