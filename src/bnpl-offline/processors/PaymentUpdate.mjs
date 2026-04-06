import { getCommerceClient } from "../lib/commerce-client.mjs";
import { clip, orderIdFromRow } from "../lib/booking-commerce-helpers.mjs";
import { isRowEligibleByBookedCars } from "../lib/dms-booked-cars.mjs";

/**
 * Kinesis payload: `{ RECORDS: object[] }` (UPPERCASE fields).
 * Eligibility: DMS booked-cars API returns success with non-empty `data` for the row
 * (dealer map + loc + order/mobile — see `bookedCarsParamsFromRow` in dms-booked-cars.mjs).
 * POST rest/V1/booking/:orderId/payment
 *
 * @param {import('./types.mjs').ProcessorContext} ctx
 */
async function process(ctx) {
  const payload = ctx.payload;
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error('PaymentUpdate: payload must be an object with RECORDS array');
  }

  const records = /** @type {{ RECORDS?: unknown }} */ (payload).RECORDS;
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error("PaymentUpdate: RECORDS must be a non-empty array");
  }

  const rows = records.filter((r) => r !== null && typeof r === "object");
  if (rows.length === 0) {
    throw new Error("PaymentUpdate: no object rows in RECORDS");
  }

  const typed = /** @type {Record<string, unknown>[]} */ (rows);
  const candidates = [];

  for (const row of typed) {
    if (await isRowEligibleByBookedCars(ctx.environment, row)) {
      candidates.push(row);
    }
  }

  if (candidates.length === 0) {
    console.log(
      JSON.stringify({
        processor: "PaymentUpdate",
        outcome: "skipped",
        reason: "no rows with DMS booked-cars data",
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
    if (!orderId) {
      failures.push("Commerce payment: missing WEB_ORDER_NUM / WEB_ENQ_NUM on row");
      continue;
    }
    const res = await client.post(`booking/${encodeURIComponent(orderId)}/payment`, {});
    const text = await res.text();
    if (!res.ok) {
      failures.push(`${orderId}: HTTP ${res.status} ${clip(text, 400)}`);
    }
  }

  if (failures.length > 0) {
    throw new Error(
      `PaymentUpdate: ${failures.length}/${candidates.length} failed — ${failures.join(" | ")}`
    );
  }

  console.log(
    JSON.stringify({
      processor: "PaymentUpdate",
      outcome: "success",
      count: candidates.length,
      streamName: ctx.streamName,
      sequenceNumber: ctx.sequenceNumber
    })
  );
}

export { process };
