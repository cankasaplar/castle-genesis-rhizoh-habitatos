/**
 * Replay Seal v1 — frame zinciri hash (GPU readback fingerprint ile CPU assembly birleşimi için iskelet).
 */

const FNV_OFFSET = 2166136261 >>> 0;
const FNV_PRIME = 16777619 >>> 0;

function fnv1aMix(h0, str) {
  let h = h0 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, FNV_PRIME) >>> 0;
  }
  return h >>> 0;
}

function anchorFingerprint(anchor) {
  if (!anchor) return "null";
  const parts = [
    anchor.contractId ?? "",
    String(anchor.schemaVersion ?? ""),
    anchor.inputSnapshotHash ?? "",
    anchor.executionTopology ?? "",
    anchor.decisionPath ?? ""
  ];
  let h = FNV_OFFSET;
  for (const p of parts) h = fnv1aMix(h, p + "\n");
  return (h >>> 0).toString(16).padStart(8, "0");
}

/**
 * @param {{ chainHash?: string | null, frameIndex?: number }} state
 * @param {ReturnType<typeof sliceReplaySealAnchor>} anchor
 * @param {{ gpuDispatchFingerprint?: string | null }} [opts]
 */
export function appendReplaySealFrame(state, anchor, opts = {}) {
  const prev = state?.chainHash ?? null;
  const fi = (state?.frameIndex ?? -1) + 1;
  const afp = anchorFingerprint(anchor);
  const gpuFp = opts.gpuDispatchFingerprint ?? "";
  const payload = `${prev ?? "genesis"}|${fi}|${afp}|${gpuFp}`;
  let h = FNV_OFFSET;
  h = fnv1aMix(h, payload);
  const chainHash = (h >>> 0).toString(16).padStart(8, "0");
  return Object.freeze({
    frameIndex: fi,
    chainHash,
    lastAnchorFingerprint: afp,
    gpuDispatchFingerprint: gpuFp || null
  });
}

export function createReplaySealGenesis() {
  return Object.freeze({ frameIndex: -1, chainHash: null, lastAnchorFingerprint: null, gpuDispatchFingerprint: null });
}

/**
 * Basit tutarlılık: zincir uzunluğu ve monoton frameIndex (forensic ön kontrol).
 */
export function verifyReplaySealChainIntegrity(sealState) {
  if (!sealState) return { ok: false, reason: "missing_state" };
  if (sealState.frameIndex < 0) return { ok: false, reason: "no_frames" };
  if (!sealState.chainHash || typeof sealState.chainHash !== "string") return { ok: false, reason: "no_chain_hash" };
  return { ok: true };
}
