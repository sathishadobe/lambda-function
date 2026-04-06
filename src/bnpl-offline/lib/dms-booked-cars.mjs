/**
 * DMS: booked cars by mobile / dealer / order (GET).
 * Uses getDmsAccessToken from ./dms-token.mjs — import this from any processor.
 */

import { getDmsAccessToken, parseJsonSafe } from "./dms-token.mjs";
import { getDmsConfig } from "./env-context.mjs";

/**
 * Parsed JSON body from DMS booked cars API (`error` / `errors` / `data`).
 *
 * @typedef {object} BookedCarsApiErrorEntry
 * @property {string} [errorCode]
 * @property {string} [errorMessage]
 */

/**
 * Result of {@link evaluateBookedCarsResponse}.
 *
 * @typedef {object} BookedCarsEvaluation
 * @property {boolean} ok `true` only when `error === false` and `data` is a non-empty array
 * @property {boolean} apiReportsError `error === true`
 * @property {BookedCarsApiErrorEntry[] | null} errors
 * @property {unknown[] | null} data Non-null when `data` was a non-empty array
 * @property {number} dataLength
 */

/**
 * GET booked cars (query: mobile, dealerMapCode, dealerLocCode, orderNumber).
 *
 * @param {import('./env-context.mjs').Environment} environment
 * @param {{ mobile: string, dealerMapCode: string, dealerLocCode: string, orderNumber: string }} params
 * @param {number} [attempt]
 * @returns {Promise<unknown>}
 */
async function getBookedCars(environment, params, attempt = 0) {
  const missing = ["dealerMapCode", "dealerLocCode"].filter((k) => {
    const v = params[k];
    return v === undefined || v === null || String(v).trim() === "";
  });
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
  for (const [key, val] of [
    ["mobile", mobile],
    ["dealerMapCode", dealerMapCode],
    ["dealerLocCode", dealerLocCode],
    ["orderNumber", orderNumber]
  ]) {
    if (val === undefined || val === null) {
      continue;
    }
    const s = String(val).trim();
    if (s !== "") {
      url.searchParams.set(key, s);
    }
  }

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

/**
 * Interpret HTTP 200 JSON from booked cars API (success vs business errors vs empty list).
 *
 * @param {unknown} body Parsed response body (same shape you get from {@link getBookedCars}).
 * @returns {BookedCarsEvaluation}
 */
function evaluateBookedCarsResponse(body) {
  if (!body || typeof body !== "object") {
    return {
      ok: false,
      apiReportsError: false,
      errors: null,
      data: null,
      dataLength: 0
    };
  }

  const o = /** @type {Record<string, unknown>} */ (body);
  const apiReportsError = o.error === true;
  const rawErrors = o.errors;
  const errors =
    Array.isArray(rawErrors) && rawErrors.length > 0
      ? /** @type {BookedCarsApiErrorEntry[]} */ (rawErrors)
      : null;

  const rawData = o.data;
  const data = Array.isArray(rawData) ? rawData : null;
  const dataLength = data?.length ?? 0;

  const ok = o.error === false && dataLength > 0;

  return {
    ok,
    apiReportsError,
    errors: apiReportsError ? errors : null,
    data: dataLength > 0 ? data : null,
    dataLength
  };
}

/**
 * @param {unknown} body
 * @returns {boolean} `true` when `error === false` and `data.length > 0`
 */
function isBookedCarsSuccessWithData(body) {
  return evaluateBookedCarsResponse(body).ok;
}

/** @param {unknown} v */
function trimStr(v) {
  if (v === undefined || v === null) {
    return "";
  }
  return String(v).trim();
}

/**
 * Map PH_ENQ / Kinesis row → `getBookedCars` query params (UPPERCASE keys preferred).
 * Requires dealer map + loc; optional mobile / order from common column names.
 *
 * @param {Record<string, unknown>} row
 * @returns {{ mobile: string, dealerMapCode: string, dealerLocCode: string, orderNumber: string } | null}
 */
function bookedCarsParamsFromRow(row) {
  const dealerMapCode = trimStr(
    row.DEALER_MAP_CD ?? row.DEALER_MAP_CODE ?? row.dealerMapCode
  );
  const dealerLocCode = trimStr(row.LOC_CD ?? row.dealerLocCode);
  const orderNumber = trimStr(
    row.ORDER_NUM ??
      row.ORDER_NUMBER ??
      row.CAR_ORDER_NUM ??
      row.CUST_ORD_NUM ??
      row.WEB_ORDER_NUM ??
      row.orderNumber
  );
  const mobile = trimStr(row.CUST_PHONE ?? row.MOBILE ?? row.mobile);
  if (!dealerMapCode || !dealerLocCode) {
    return null;
  }
  return { mobile, dealerMapCode, dealerLocCode, orderNumber };
}

/**
 * `true` when DMS booked-cars GET returns `error === false` and non-empty `data`
 * ({@link evaluateBookedCarsResponse} `ok`).
 *
 * @param {import('./env-context.mjs').Environment} environment
 * @param {Record<string, unknown>} row
 */
async function isRowEligibleByBookedCars(environment, row) {
  const params = bookedCarsParamsFromRow(row);
  if (!params) {
    return false;
  }
  const body = await getBookedCars(environment, params);
  return evaluateBookedCarsResponse(body).ok;
}

export {
  getBookedCars,
  evaluateBookedCarsResponse,
  isBookedCarsSuccessWithData,
  bookedCarsParamsFromRow,
  isRowEligibleByBookedCars
};
