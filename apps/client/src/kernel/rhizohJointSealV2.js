/**
 * GAP 2 — Birleşik mühür: frame + GPU + CPU katmanlarını tek closureRoot zincirinde toplar.
 */

const FNV_OFFSET = 2166136261 >>> 0;
const FNV_PRIME = 16777619 >>> 0;

function fnv1aBytes(h0, bytes) {
  let h = h0 >>> 0;
  if (!bytes?.byteLength) return h;
  const u = new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let i = 0; i < u.length; i++) {
    h ^= u[i];
    h = Math.imul(h, FNV_PRIME) >>> 0;
  }
  return h >>> 0;
}

function fnv1aStr(h0, str) {
  let h = h0 >>> 0;
  const s = String(str ?? "");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, FNV_PRIME) >>> 0;
  }
  return h >>> 0;
}

/** GPU readback veya ham bayt için katman parmak izi. */
export function sealLayerFingerprintFromBytes(bytes) {
  return fnv1aBytes(FNV_OFFSET, bytes).toString(16).padStart(8, "0");
}

/** CPU canonical quad (magic + üç u32) için parmak izi. */
export function sealLayerFingerprintFromU32Quad(obj) {
  const s = `${obj?.magic ?? ""}|${obj?.maxCellCount ?? ""}|${obj?.uniqueCells ?? ""}|${obj?.modeQuanta ?? ""}`;
  return fnv1aStr(FNV_OFFSET, s).toString(16).padStart(8, "0");
}

export function createJointSealGenesis() {
  return Object.freeze({
    version: "joint_seal_v2",
    frameIndex: -1,
    closureRoot: null,
    lastLayers: null
  });
}

/**
 * @param {{ frameIndex?: number, closureRoot?: string | null }} state
 * @param {{ frameSeal: string, gpuSeal: string, cpuSeal: string }} layers
 */
export function appendJointSealFrame(state, layers) {
  const prev = state?.closureRoot ?? "genesis";
  const fi = (state?.frameIndex ?? -1) + 1;
  const fs = String(layers.frameSeal ?? "");
  const gs = String(layers.gpuSeal ?? "");
  const cs = String(layers.cpuSeal ?? "");
  const payload = `${prev}|${fi}|${fs}|${gs}|${cs}`;
  const closureRoot = fnv1aStr(FNV_OFFSET, payload).toString(16).padStart(8, "0");
  return Object.freeze({
    version: "joint_seal_v2",
    frameIndex: fi,
    closureRoot,
    lastLayers: Object.freeze({ frameSeal: fs, gpuSeal: gs, cpuSeal: cs })
  });
}

export function verifyJointSealIntegrity(state) {
  if (!state) return { ok: false, reason: "missing_state" };
  if (state.frameIndex < 0) return { ok: false, reason: "no_frames" };
  if (!state.closureRoot || typeof state.closureRoot !== "string") return { ok: false, reason: "no_closure_root" };
  return { ok: true };
}
