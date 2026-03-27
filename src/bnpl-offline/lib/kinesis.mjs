/**
 * Kinesis event helpers: ARN parsing, payload decode, event detection.
 */

const KINESIS_EVENT_SOURCE = "aws:kinesis";

/** @param {unknown} event */
export function isKinesisEvent(event) {
  return (
    typeof event === "object" &&
    event !== null &&
    Array.isArray(event.Records) &&
    event.Records.length > 0 &&
    event.Records[0]?.eventSource === KINESIS_EVENT_SOURCE
  );
}

/**
 * Stream name from eventSourceARN:
 * arn:aws:kinesis:region:account:stream/my-stream-name
 */
export function streamNameFromArn(eventSourceArn) {
  if (!eventSourceArn || typeof eventSourceArn !== "string") {
    return null;
  }
  const parts = eventSourceArn.split("/");
  return parts.length >= 2 ? parts[parts.length - 1] : null;
}

/**
 * @param {import('aws-lambda').KinesisStreamRecord} record
 * @returns {{ data: Buffer, partitionKey: string, sequenceNumber: string }}
 */
export function decodeKinesisRecord(record) {
  const k = record.kinesis;
  const raw = k?.data;
  if (!raw) {
    throw new Error("Missing kinesis.data");
  }
  const data = Buffer.from(raw, "base64");
  return {
    data,
    partitionKey: k.partitionKey ?? "",
    sequenceNumber: k.sequenceNumber ?? ""
  };
}

/** Try JSON; fall back to UTF-8 string */
export function parsePayload(data) {
  const text = data.toString("utf8");
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
