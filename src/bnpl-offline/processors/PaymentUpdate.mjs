/**
 * @param {import('./types.mjs').ProcessorContext} ctx
 */
export async function process(ctx) {
  console.log(
    JSON.stringify({
      processor: "PaymentUpdate",
      environment: ctx.environment,
      streamName: ctx.streamName,
      sequenceNumber: ctx.sequenceNumber
    })
  );
}
