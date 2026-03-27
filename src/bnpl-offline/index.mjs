import { isKinesisEvent } from "./lib/kinesis.mjs";
import { handleKinesis } from "./kinesis-handler.mjs";

/**
 * - Kinesis: routes by stream ARN → processor (see config/stream-registry.mjs).
 * - Other invokes: health / manual test only (primary path is Kinesis).
 */
export const handler = async (event) => {
  if (isKinesisEvent(event)) {
    return handleKinesis(event);
  }

  if (event && typeof event === "object" && event.action === "ping") {
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, message: "bnpl-offline handler up" })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message:
        "Invoke with a Kinesis event, or { \"action\": \"ping\" } for health. Commerce REST: use getCommerceClient(environment) from lib/commerce-client.mjs in processors."
    })
  };
};
