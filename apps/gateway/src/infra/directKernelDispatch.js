import { consume } from "../../../kernel/src/consumer/KernelConsumer.js";
import { appendTraceSpan, upsertTraceStatus } from "./traceRegistry.js";

export async function directKernelDispatch(event) {
  const t0 = Date.now();
  const out = await consume(event);
  await appendTraceSpan({
    traceId: event?.meta?.traceId,
    spanId: `spn:kernel:${event?.eventId || "unknown"}`,
    parentSpanId: event?.meta?.spanId,
    sessionId: event?.sessionId,
    eventId: event?.eventId,
    causalNodeId: out?.eventId || event?.eventId,
    service: "kernel",
    phase: "consume",
    latencyMs: Date.now() - t0
  });
  await upsertTraceStatus(event?.meta?.traceId, "ok");
  return out;
}
