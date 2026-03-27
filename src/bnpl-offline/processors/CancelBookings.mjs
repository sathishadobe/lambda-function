import { getCommerceClient } from "../lib/commerce-client.mjs";
import {
  buildOfflineBookingCancelBody,
  getOfflineBookingCancelRestPath
} from "../lib/cancel-booking-body.mjs";

/**
 * Offline booking cancellation → Adobe Commerce REST (OAuth 1.0a).
 * Configure Lambda env COMMERCE_OFFLINE_BOOKING_CANCEL_PATH to the V1 relative path
 * from your spec (e.g. offline/booking/cancel). Staging: …_PATH_staging.
 *
 * @param {import('./types.mjs').ProcessorContext} ctx
 */
export async function process(ctx) {
  const path = getOfflineBookingCancelRestPath(ctx.environment);
  if (!path) {
    throw new Error(
      "Set COMMERCE_OFFLINE_BOOKING_CANCEL_PATH (and optional _staging) to the Commerce REST path under rest/V1/"
    );
  }

  const raw =
    ctx.payload && typeof ctx.payload === "object"
      ? ctx.payload
      : ctx.payload && typeof ctx.payload === "string"
        ? parseJsonSafe(ctx.payload)
        : null;

  if (!raw || typeof raw !== "object") {
    throw new Error("CancelBookings: Kinesis payload must be a JSON object with cancellation fields");
  }

  const body = buildOfflineBookingCancelBody(raw);
  const client = getCommerceClient(ctx.environment);

  console.log(
    JSON.stringify({
      processor: "CancelBookings",
      environment: ctx.environment,
      streamName: ctx.streamName,
      sequenceNumber: ctx.sequenceNumber,
      path,
      bodyKeys: Object.keys(body)
    })
  );

  const res = await client.post(path, body);
  const responseText = await res.text();

  if (!res.ok) {
    throw new Error(`Commerce offline booking cancel failed: HTTP ${res.status} ${responseText}`);
  }

  console.log("CancelBookings commerce response:", truncate(responseText, 2000));
}

function parseJsonSafe(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function truncate(s, max) {
  if (s.length <= max) {
    return s;
  }
  return `${s.slice(0, max)}…`;
}
