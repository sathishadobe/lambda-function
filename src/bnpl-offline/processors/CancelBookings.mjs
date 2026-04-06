import { getCommerceClient } from "../lib/commerce-client.mjs";
import {
  bookingOrderIdPrefix,
  clip,
  isBookingCandidate,
  orderIdFromRow
} from "../lib/booking-commerce-helpers.mjs";

/**
 * Kinesis payload: `{ RECORDS: object[] }`. Row fields UPPERCASE.
 * Order id: trimmed WEB_ORDER_NUM or WEB_ENQ_NUM (first non-empty).
 * Filter: order id contains BOOKING_ORDER_ID_PREFIX, non-empty ENQ_REF_NUM, ENQ_STATUS === "C".
 * POST rest/V1/booking/:orderId/cancel
 *
 * @param {import('./types.mjs').ProcessorContext} ctx
 */
async function process(ctx) {
  const payload = ctx.payload;
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error('CancelBookings: payload must be an object with RECORDS array');
  }

  const records = /** @type {{ RECORDS?: unknown }} */ (payload).RECORDS;
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error("CancelBookings: RECORDS must be a non-empty array");
  }

  const rows = records.filter((r) => r !== null && typeof r === "object");
  if (rows.length === 0) {
    throw new Error("CancelBookings: no object rows in RECORDS");
  }

  const prefix = bookingOrderIdPrefix(ctx.environment);
  if (!prefix) {
    throw new Error(
      "CancelBookings: set BOOKING_ORDER_ID_PREFIX (staging: BOOKING_ORDER_ID_PREFIX_STAGING in Lambda)"
    );
  }

  const typed = /** @type {Record<string, unknown>[]} */ (rows);
  const candidates = typed.filter((row) => isBookingCandidate(row, prefix));
  if (candidates.length === 0) {
    console.log(
      JSON.stringify({
        processor: "CancelBookings",
        outcome: "skipped",
        streamName: ctx.streamName,
        sequenceNumber: ctx.sequenceNumber,
        rowCount: rows.length
      })
    );
    return;
  }

  const client = getCommerceClient(ctx.environment);
  const failures = [];

  for (const row of candidates) {
    const orderId = orderIdFromRow(row);
    const res = await client.post(`booking/${encodeURIComponent(orderId)}/cancel`, {});
    const text = await res.text();
    if (!res.ok) {
      failures.push(`${orderId}: HTTP ${res.status} ${clip(text, 400)}`);
    }
  }

  if (failures.length > 0) {
    throw new Error(
      `CancelBookings: ${failures.length}/${candidates.length} failed — ${failures.join(" | ")}`
    );
  }

  console.log(
    JSON.stringify({
      processor: "CancelBookings",
      outcome: "success",
      count: candidates.length,
      streamName: ctx.streamName,
      sequenceNumber: ctx.sequenceNumber
    })
  );
}

export { process };
