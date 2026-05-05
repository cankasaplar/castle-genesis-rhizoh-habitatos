import { FLAGS } from "../config/flags.js";
import { sendToDLQ } from "./dlq.js";
import { directKernelDispatch } from "./directKernelDispatch.js";
import { reserveIdempotency } from "./idempotency.js";
import { metrics, observeGatewayEnqueueLatency } from "./metrics.js";
import { queue } from "./queue/selectQueue.js";
import { createInfraEventEnvelope } from "./envelope.js";
import { appendTraceSpan, upsertTraceStatus } from "./traceRegistry.js";

export async function processEvent(event) {
  if (!event || typeof event !== "object") return;
  const envelope = createInfraEventEnvelope(event);
  const t0 = Date.now();
  await appendTraceSpan({
    traceId: envelope?.meta?.traceId,
    spanId: envelope?.meta?.spanId,
    parentSpanId: envelope?.meta?.parentSpanId,
    sessionId: envelope.sessionId,
    eventId: envelope.eventId,
    service: "gateway",
    phase: "enqueue_start",
    latencyMs: 0
  });
  const reserved = await reserveIdempotency(envelope.idempotencyKey);
  if (!reserved) {
    metrics.duplicateRejects += 1;
    await upsertTraceStatus(envelope?.meta?.traceId, "duplicate");
    return;
  }

  try {
    await queue.enqueue(envelope);
    observeGatewayEnqueueLatency(Date.now() - t0);
    metrics.eventsProcessed += 1;
    metrics.queueLag = Math.max(0, Date.now() - Number(envelope.timestamp || Date.now()));
    if (typeof queue.depth === "function") {
      metrics.queueDepth = await queue.depth().catch(() => metrics.queueDepth);
    }

    if (FLAGS.USE_DUAL_RUN) {
      await directKernelDispatch(envelope);
    }
    await appendTraceSpan({
      traceId: envelope?.meta?.traceId,
      spanId: `spn:gateway:enqueue:${envelope.eventId}`,
      parentSpanId: envelope?.meta?.spanId,
      sessionId: envelope.sessionId,
      eventId: envelope.eventId,
      service: "gateway",
      phase: "enqueue_done",
      latencyMs: metrics.enqueueLatencyMs
    });
    await upsertTraceStatus(envelope?.meta?.traceId, "ok");
  } catch (err) {
    metrics.errors += 1;
    await sendToDLQ(envelope, err instanceof Error ? err.message : "process_event_failed");
    await appendTraceSpan({
      traceId: envelope?.meta?.traceId,
      spanId: `spn:gateway:error:${envelope.eventId}`,
      parentSpanId: envelope?.meta?.spanId,
      sessionId: envelope.sessionId,
      eventId: envelope.eventId,
      service: "gateway",
      phase: "enqueue_error",
      latencyMs: Date.now() - t0
    });
    await upsertTraceStatus(envelope?.meta?.traceId, "error");
    throw err;
  }
}
