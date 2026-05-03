import { verifyRhizohReplayTraceV1 } from "./rhizohReplayVerifierV1.js";

export const RHIZOH_AUDIT_EXPORT_VERSION = "v1";

export function exportRhizohAuditBundleV1({ traceId, events, context = {} }) {
  const verification = verifyRhizohReplayTraceV1(events);
  return Object.freeze({
    exportVersion: RHIZOH_AUDIT_EXPORT_VERSION,
    generatedAtMs: Date.now(),
    traceId: traceId ?? null,
    context: Object.freeze({
      runtimeVersion: context.runtimeVersion ?? null,
      environment: context.environment ?? "unknown",
      tenantId: context.tenantId ?? null
    }),
    summary: Object.freeze({
      eventCount: verification.frameCount,
      replayOk: verification.ok,
      divergenceCount: verification.divergenceCount,
      finalSnapshotHash: verification.reduced.finalSnapshotHash
    }),
    replayVerification: verification,
    compactEvents: Object.freeze(
      (events ?? []).map((e) =>
        Object.freeze({
          frameId: e.frameId ?? null,
          eventId: e.eventId ?? null,
          atMs: e.atMs ?? null,
          type: e.type ?? null,
          traceId: e.traceId ?? null,
          taskId: e.taskId ?? null,
          agentId: e.agentId ?? null,
          snapshotHash: e.snapshotHash ?? null
        })
      )
    )
  });
}

