import { resolveRoute } from "./config/stream-registry.mjs";
import { decodeKinesisRecord, parsePayload } from "./lib/kinesis.mjs";
import { runProcessor } from "./processors/index.mjs";

/**
 * Kinesis batch: each record routes by stream ARN → its own processor + environment.
 * All records run in parallel (Promise.allSettled) so every processor runs even if another fails.
 * If any record fails → throw (whole invocation fails). If all succeed → return empty batchItemFailures.
 *
 * @param {import('aws-lambda').KinesisStreamEvent} event
 * @returns {Promise<{ batchItemFailures: { itemIdentifier: string }[] }>}
 */
async function handleKinesis(event) {
  const settled = await Promise.allSettled(
    event.Records.map((record) => processRecord(record))
  );

  /** @type {{ seq: string; reason: unknown }[]} */
  const failures = [];

  settled.forEach((result, index) => {
    if (result.status === "fulfilled") {
      return;
    }
    const seq = event.Records[index]?.kinesis?.sequenceNumber ?? "";
    failures.push({ seq, reason: result.reason });
    console.error("Record failed:", seq || index, result.reason);
  });

  if (failures.length > 0) {
    const detail = failures
      .map((f) => `[${f.seq || "?"}] ${formatReason(f.reason)}`)
      .join("; ");
    throw new Error(
      `Kinesis batch: ${failures.length}/${settled.length} record(s) failed — ${detail}`
    );
  }

  return { batchItemFailures: [] };
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

/** @param {unknown} reason */
function formatReason(reason) {
  if (reason instanceof Error) {
    return reason.message;
  }
  return String(reason);
}

export { handleKinesis };
