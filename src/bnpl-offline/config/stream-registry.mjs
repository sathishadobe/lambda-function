/**
 * Map Kinesis stream name → logical processor + environment.
 * Replace keys with your **exact** stream names from AWS (last segment of the stream ARN).
 *
 * Five logical processors × (staging + production) = up to 10 Kinesis triggers.
 * `processor` must match a key in ../processors/index.mjs
 */

import { streamNameFromArn } from "../lib/kinesis.mjs";

/** @typedef {'staging' | 'production'} Environment */

/**
 * @type {Record<string, { environment: Environment, processor: string }>}
 */
export const STREAM_ROUTE_BY_NAME = {
  // --- Staging (5 streams) — replace with real stream names from AWS
  "REPLACE_ME_STAGE_updateItemsOffline": { environment: "staging", processor: "updateItemsOffline" },
  "REPLACE_ME_STAGE_CancelBookings": { environment: "staging", processor: "CancelBookings" },
  "REPLACE_ME_STAGE_CancelBookedCarBookings": {
    environment: "staging",
    processor: "CancelBookedCarBookings"
  },
  "REPLACE_ME_STAGE_PaymentUpdate": { environment: "staging", processor: "PaymentUpdate" },
  "REPLACE_ME_STAGE_BookedCarInvoiced": { environment: "staging", processor: "BookedCarInvoiced" },

  // --- Production (5 streams)
  "REPLACE_ME_PROD_updateItemsOffline": { environment: "production", processor: "updateItemsOffline" },
  "REPLACE_ME_PROD_CancelBookings": { environment: "production", processor: "CancelBookings" },
  "REPLACE_ME_PROD_CancelBookedCarBookings": {
    environment: "production",
    processor: "CancelBookedCarBookings"
  },
  "REPLACE_ME_PROD_PaymentUpdate": { environment: "production", processor: "PaymentUpdate" },
  "REPLACE_ME_PROD_BookedCarInvoiced": { environment: "production", processor: "Bookq edCarInvoiced" }
};

/** Optional: ARN → route cache (same batch usually shares one ARN) */
const arnRouteCache = new Map();

/**
 * @param {string} eventSourceArn
 * @returns {{ environment: Environment, processor: string, streamName: string }}
 */
export function resolveRoute(eventSourceArn) {
  const cached = arnRouteCache.get(eventSourceArn);
  if (cached) {
    return cached;
  }

  const streamName = streamNameFromArn(eventSourceArn);
  if (!streamName) {
    throw new Error(`Could not parse stream name from ARN: ${eventSourceArn}`);
  }

  const route = STREAM_ROUTE_BY_NAME[streamName];
  if (!route) {
    throw new Error(
      `No route for stream "${streamName}". Add it to config/stream-registry.mjs`
    );
  }

  const resolved = { ...route, streamName };
  arnRouteCache.set(eventSourceArn, resolved);
  return resolved;
}
