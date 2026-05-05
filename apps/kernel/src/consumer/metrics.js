import crypto from "node:crypto";

export const kernelMetrics = {
  kernelTurnMs: 0,
  causalAppendMs: 0,
  replayMs: 0,
  divergenceTotal: 0,
  deterministicHash: ""
};

export function updateKernelMetrics(event, totalMs) {
  kernelMetrics.kernelTurnMs = Number(totalMs || 0);
  kernelMetrics.causalAppendMs = Number(totalMs || 0) * 0.25;
  kernelMetrics.replayMs = Number(totalMs || 0) * 0.4;
  const basis = `${event?.eventId || ""}|${event?.idempotencyKey || ""}|${event?.causalBranchId || ""}|${event?.type || ""}`;
  kernelMetrics.deterministicHash = crypto.createHash("sha1").update(basis).digest("hex");
}

