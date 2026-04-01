/**
 * DMS: booked cars by mobile / dealer / order (GET).
 * Uses getDmsAccessToken from ./dms-token.mjs — import this from any processor.
 */

import { getDmsAccessToken, parseJsonSafe } from "./dms-token.mjs";
import { getDmsConfig } from "./env-context.mjs";

/**
 * GET booked cars (query: mobile, dealerMapCode, dealerLocCode, orderNumber).
 *
 * @param {import('./env-context.mjs').Environment} environment
 * @param {{ mobile: string, dealerMapCode: string, dealerLocCode: string, orderNumber: string }} params
 * @returns {Promise<unknown>}
 */
export async function getBookedCars(environment, params, attempt = 0) {
  const missing = ["mobile", "dealerMapCode", "dealerLocCode", "orderNumber"].filter(
    (k) => !params[k]
  );
  if (missing.length) {
    throw new Error(`getBookedCars: missing ${missing.join(", ")}`);
  }

  const { mobile, dealerMapCode, dealerLocCode, orderNumber } = params;

  const cfg = getDmsConfig(environment);
  if (!cfg.bookedCarsApiUrl || !cfg.xApiKey) {
    throw new Error(
      "DMS booked cars config incomplete: set DMS_BOOKED_CARS_API_URL, DMS_X_API_KEY"
    );
  }

  const token = await getDmsAccessToken(environment);
  const url = new URL(cfg.bookedCarsApiUrl);
  url.searchParams.set("mobile", String(mobile));
  url.searchParams.set("dealerMapCode", String(dealerMapCode));
  url.searchParams.set("dealerLocCode", String(dealerLocCode));
  url.searchParams.set("orderNumber", String(orderNumber));

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": cfg.xApiKey,
      Authorization: authorizationHeader(token)
    }
  });

  const data = await parseJsonSafe(response);
  if ((response.status === 401 || response.status === 403) && attempt === 0) {
    await getDmsAccessToken(environment, { forceRefresh: true });
    return getBookedCars(environment, params, 1);
  }

  if (!response.ok) {
    throw new Error(`DMS booked cars failed: HTTP ${response.status} ${JSON.stringify(data)}`);
  }

  return data;
}

function authorizationHeader(token) {
  const t = String(token).trim();
  if (/^Bearer\s/i.test(t)) {
    return t;
  }
  return `Bearer ${t}`;
}
