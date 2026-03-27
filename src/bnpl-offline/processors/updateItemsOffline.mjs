/**
 * Use `getCommerceClient(ctx.environment)` from ../lib/commerce-client.mjs for OAuth 1.0a REST calls.
 *
 * @param {import('./types.mjs').ProcessorContext} ctx
 */
export async function process(ctx) {
  console.log(
    JSON.stringify({
      processor: "updateItemsOffline",
      environment: ctx.environment,
      streamName: ctx.streamName,
      sequenceNumber: ctx.sequenceNumber
    })
  );
  // const { getCommerceClient } = await import("../lib/commerce-client.mjs");
  // const client = getCommerceClient(ctx.environment);
  // const res = await client.post("enquirynum/update", { ... });
}
