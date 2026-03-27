import { resolveRoute } from "./config/stream-registry.mjs";
import { decodeKinesisRecord, parsePayload } from "./lib/kinesis.mjs";
import { runProcessor } from "./processors/index.mjs";

/**
 * Process Kinesis batch: route by stream ARN → processor + environment.
 * Uses Promise.allSettled for parallel records; reports partial batch failures.
 *
 * @param {import('aws-lambda').KinesisStreamEvent} event
 */
export async function handleKinesis(event) {
  const settled = await Promise.allSettled(
    event.Records.map((record) => processRecord(record))
  );

  /** @type {{ itemIdentifier: string }[]} */
  const batchItemFailures = [];

  settled.forEach((result, index) => {
    if (result.status === "fulfilled") {
      return;
    }
    const seq = event.Records[index]?.kinesis?.sequenceNumber;
    console.error("Record failed:", seq, result.reason);
    if (seq) {
      batchItemFailures.push({ itemIdentifier: seq });
    }
  });

  return { batchItemFailures };
}

/**
 * @param {import('aws-lambda').KinesisStreamRecord} record
 */
async function processRecord(record) {
  const arn = record.eventSourceARN;
  if (!arn) {
    throw new Error("Missing eventSourceARN on Kinesis record");
  }

  const route = resolveRoute(arn);
  const { data, partitionKey, sequenceNumber } = decodeKinesisRecord(record);
  const payload = parsePayload(data);

  await runProcessor(route.processor, {
    payload,
    environment: route.environment,
    streamName: route.streamName,
    partitionKey,
    sequenceNumber
  });
}
