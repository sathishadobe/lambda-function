/**
 * Shared helpers for Commerce booking flows driven by `{ RECORDS: [...] }` Kinesis payloads (UPPERCASE fields).
 */

/** @param {unknown} v */
function trimStr(v) {
  if (v === undefined || v === null) {
    return "";
  }
  return String(v).trim();
}

/** @param {Record<string, unknown>} row */
function orderIdFromRow(row) {
  return trimStr(row.WEB_ORDER_NUM);
}

/**
 * Same filter as cancel flow: order id contains prefix, ENQ_REF_NUM set, ENQ_STATUS === "C".
 * @param {Record<string, unknown>} row
 * @param {string} prefix
 */
function isBookingCandidate(row, prefix) {
  const orderId = orderIdFromRow(row);
  return (
    orderId.includes(prefix) &&
    Boolean(trimStr(row.ENQ_REF_NUM)) &&
    trimStr(row.ENQ_STATUS) === "C"
  );
}

/** @param {'staging' | 'production'} environment */
function bookingOrderIdPrefix(environment) {
  const p =
    environment === "staging"
      ? (process.env.BOOKING_ORDER_ID_PREFIX_STAGING ?? process.env.BOOKING_ORDER_ID_PREFIX)
      : process.env.BOOKING_ORDER_ID_PREFIX;
  return trimStr(p);
}

/** @param {string} s @param {number} n */
function clip(s, n) {
  return s.length <= n ? s : `${s.slice(0, n)}…`;
}

export { trimStr, orderIdFromRow, isBookingCandidate, bookingOrderIdPrefix, clip };
