/**
 * Maps Kinesis / offline payload → Commerce REST body for offline booking cancellation.
 * Field names align with maruti-aio normalizeOrderDataForCancel + formatCancelOrderData
 * (DMS-oriented) and booking quote fields where useful.
 *
 * Override or extend mapping when Confluence contract differs.
 */

/**
 * @param {Record<string, unknown>} raw
 * @returns {Record<string, unknown>}
 */
export function buildOfflineBookingCancelBody(raw) {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const ext =
    raw.extension_attributes && typeof raw.extension_attributes === "object"
      ? raw.extension_attributes
      : {};
  const quote = raw.quote && typeof raw.quote === "object" ? raw.quote : {};

  const body = {
    locCode: firstOf(raw, ext, ["locCode", "loc_code"]),
    parentGroup: firstOf(raw, ext, ["parentGroup", "parent_group"]),
    enquiryNumber: firstOf(raw, ext, ["enquiryNumber", "enquiry_num"]),
    dealerMapCode: firstOf(raw, ext, ["dealerMapCode", "dealer_map_code"]),
    cancelFlag: firstOf(raw, ext, ["cancelFlag", "order_cancel_flag"]),
    cancelledDate: firstOf(raw, ext, ["cancelledDate", "cancelled_date"]),
    ordCancelReason: stringOrEmpty(firstOf(raw, ext, ["ordCancelReason", "ord_cancel_reason"])),
    entityId: firstOf(raw, quote, ["entityId", "entity_id"]),
    orderNumber: firstOf(raw, quote, ["orderNumber", "order_number"]),
    incrementId: firstOf(raw, {}, ["incrementId", "increment_id"])
  };

  return omitUndefined(body);
}

function firstOf(raw, ext, keys) {
  for (const k of keys) {
    if (raw[k] !== undefined && raw[k] !== null) {
      return raw[k];
    }
    if (ext[k] !== undefined && ext[k] !== null) {
      return ext[k];
    }
  }
  return undefined;
}

function stringOrEmpty(v) {
  if (v === undefined || v === null) {
    return "";
  }
  return String(v);
}

function omitUndefined(obj) {
  /** @type {Record<string, unknown>} */
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      out[k] = v;
    }
  }
  return out;
}

/**
 * REST path under …/rest/V1/ (e.g. offline/booking/cancel).
 * Set in Lambda: COMMERCE_OFFLINE_BOOKING_CANCEL_PATH (+ optional _staging).
 *
 * @param {'staging' | 'production'} environment
 */
export function getOfflineBookingCancelRestPath(environment) {
  if (environment === "staging") {
    return (
      process.env.COMMERCE_OFFLINE_BOOKING_CANCEL_PATH_staging ??
      process.env.COMMERCE_OFFLINE_BOOKING_CANCEL_PATH ??
      ""
    );
  }
  return process.env.COMMERCE_OFFLINE_BOOKING_CANCEL_PATH ?? "";
}
