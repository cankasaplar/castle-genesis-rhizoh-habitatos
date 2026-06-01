/**
 * RESEARCH-ONLY — Phase 3 projection gate: SpiralMMO reservoir → CubeState delta.
 *
 * **Invariant:** SpiralMMO is a signal source, never a semantic authority.
 *
 * Read-only ingestion · normalization · delta emission — no interpretation · no execution.
 *
 * @see docs/RHIZOH_CUBE_FIELD_SIGNAL_CONTRACT_ADDENDUM_V0.md
 * @see docs/RHIZOH_CUBE_FIELD_V0.md
 */

import {
  clamp01,
  normalizePhaseRad,
  normalizeCubeStateV0,
  CUBE_FIELD_CUBE_STATE_SCHEMA_V0
} from "./cubeFieldSpiralMathV0.js";

export const SPIRAL_RESERVOIR_ADAPTER_SCHEMA_V0 = "rhizoh.cube_field.spiral_reservoir_adapter.v0";
export const SPIRAL_RESERVOIR_SIGNAL_SCHEMA_V0 = "rhizoh.spiral_reservoir.signal.v0";

/** EMA denoise when prevState present (§6 addendum). */
export const SPIRAL_RESERVOIR_DENOISE_ALPHA_V0 = 0.35;

/** Narrative keys — ignore, never map to CubeState in v0. */
const NARRATIVE_KEY_PREFIXES_V0 = Object.freeze(["rumor", "quest", "lore", "headline", "mutation"]);

/** Forbidden authority keys — quarantine field. */
const FORBIDDEN_KEY_RE_V0 =
  /^(execution|authority|wal|seal|sharedState|feedsExecution)/i;

/**
 * Allowlisted reservoir field → CubeState dot-path (passthrough only).
 * @type {Readonly<Record<string, { target: string, kind: "scalar01" | "phase" | "phaseArray4" }>>}
 */
export const SPIRAL_RESERVOIR_FIELD_MAP_V0 = Object.freeze({
  armExtent0: Object.freeze({ target: "intentVector.observation", kind: "scalar01" }),
  armExtent1: Object.freeze({ target: "intentVector.reasoning", kind: "scalar01" }),
  armExtent2: Object.freeze({ target: "intentVector.memory", kind: "scalar01" }),
  armExtent3: Object.freeze({ target: "intentVector.action", kind: "scalar01" }),
  spiralPhaseRad: Object.freeze({ target: "spiralPhaseRad", kind: "phase" }),
  armPhaseOffsetRad: Object.freeze({ target: "armPhaseOffsetRad", kind: "phaseArray4" }),
  rotationRate01: Object.freeze({ target: "cognitiveLoad", kind: "scalar01" }),
  cubeScale01: Object.freeze({ target: "attention", kind: "scalar01" }),
  opacity01: Object.freeze({ target: "uncertainty", kind: "scalar01" }),
  confidence01: Object.freeze({ target: "confidence", kind: "scalar01" }),
  drift01: Object.freeze({ target: "drift", kind: "scalar01" }),
  contradictionPressure01: Object.freeze({ target: "contradictionPressure", kind: "scalar01" }),
  meshCoherence01: Object.freeze({ target: "__quarantine__", kind: "scalar01" })
});

/**
 * @param {unknown} value
 * @param {"scalar01" | "phase" | "phaseArray4"} kind
 * @returns {{ ok: true, value: number | number[] } | { ok: false }}
 */
function coerceSignalValueV0(value, kind) {
  if (kind === "phaseArray4") {
    if (!Array.isArray(value)) return { ok: false };
    const arr = value.slice(0, 4).map((v) => normalizePhaseRad(v));
    while (arr.length < 4) arr.push(0);
    return { ok: true, value: arr };
  }
  const n = Number(value);
  if (!Number.isFinite(n)) return { ok: false };
  if (kind === "phase") return { ok: true, value: normalizePhaseRad(n) };
  return { ok: true, value: clamp01(n) };
}

/**
 * @param {string} key
 */
function classifyUnknownSignalV0(key) {
  const k = String(key || "");
  if (FORBIDDEN_KEY_RE_V0.test(k)) return "quarantine_field";
  const lower = k.toLowerCase();
  for (const prefix of NARRATIVE_KEY_PREFIXES_V0) {
    if (lower.startsWith(prefix)) return "ignore";
  }
  if (k in SPIRAL_RESERVOIR_FIELD_MAP_V0) {
    const entry = SPIRAL_RESERVOIR_FIELD_MAP_V0[k];
    if (entry.target === "__quarantine__") return "quarantine_field";
    return "accept";
  }
  return "ignore";
}

/**
 * Optional EMA denoise — numeric only.
 *
 * @param {number} next
 * @param {number | undefined} prev
 */
function denoiseScalar01V0(next, prev) {
  if (prev === undefined || !Number.isFinite(prev)) return next;
  return clamp01(SPIRAL_RESERVOIR_DENOISE_ALPHA_V0 * next + (1 - SPIRAL_RESERVOIR_DENOISE_ALPHA_V0) * prev);
}

/**
 * @param {Record<string, unknown>} signals
 */
export function normalizeReservoirSignalsV0(signals) {
  const ignored = [];
  const quarantined = [];
  const dropped = [];
  /** @type {Record<string, number | number[]>} */
  const candidates = {};

  const src = signals && typeof signals === "object" ? signals : {};
  for (const key of Object.keys(src)) {
    const policy = classifyUnknownSignalV0(key);
    if (policy === "ignore") {
      ignored.push(key);
      continue;
    }
    if (policy === "quarantine_field") {
      quarantined.push(key);
      continue;
    }
    const map = SPIRAL_RESERVOIR_FIELD_MAP_V0[key];
    const coerced = coerceSignalValueV0(src[key], map.kind);
    if (!coerced.ok) {
      dropped.push(key);
      continue;
    }
    candidates[map.target] = coerced.value;
  }

  return Object.freeze({
    candidates: Object.freeze(candidates),
    ignored: Object.freeze(ignored),
    quarantined: Object.freeze(quarantined),
    dropped: Object.freeze(dropped)
  });
}

/**
 * @param {Record<string, unknown>} target
 * @param {string} dotPath
 * @param {number | number[]} value
 */
function setByDotPathV0(target, dotPath, value) {
  const parts = dotPath.split(".");
  if (parts.length === 1) {
    target[parts[0]] = value;
    return;
  }
  if (!target[parts[0]] || typeof target[parts[0]] !== "object") {
    target[parts[0]] = {};
  }
  target[parts[0]][parts[1]] = value;
}

/**
 * @param {Record<string, unknown>} obj
 * @param {string} dotPath
 */
function getByDotPathV0(obj, dotPath) {
  const parts = dotPath.split(".");
  if (parts.length === 1) return obj[parts[0]];
  const nested = obj[parts[0]];
  if (!nested || typeof nested !== "object") return undefined;
  return nested[parts[1]];
}

/**
 * Merge candidates into CubeState partial — signals only, no semantic inference.
 *
 * @param {Partial<import('./cubeFieldSpiralMathV0.js').CubeStateInputV0>} prev
 * @param {Record<string, number | number[]>} candidates
 * @param {{ denoise?: boolean }} [opts]
 */
export function applyCubeStateDeltaV0(prev, candidates, opts = {}) {
  const denoise = opts.denoise !== false;
  const before = {};
  const after = {};
  const fields = [];

  /** @type {Record<string, unknown>} */
  const merged = {
    ...prev,
    intentVector: { ...(prev?.intentVector || {}) },
    sourceKind: "spiral_reservoir_adapter",
    readOnly: true
  };

  for (const [dotPath, rawValue] of Object.entries(candidates)) {
    const prevVal = getByDotPathV0(merged, dotPath);
    before[dotPath] = prevVal;

    let nextVal = rawValue;
    if (denoise && typeof rawValue === "number") {
      nextVal = denoiseScalar01V0(rawValue, typeof prevVal === "number" ? prevVal : undefined);
    }

    setByDotPathV0(merged, dotPath, nextVal);
    after[dotPath] = nextVal;
    fields.push(dotPath);
  }

  const cubeState = normalizeCubeStateV0(merged);

  return Object.freeze({
    cubeState,
    delta: Object.freeze({
      fields: Object.freeze(fields),
      before: Object.freeze(before),
      after: Object.freeze(after)
    })
  });
}

/**
 * Runtime guard — adapter never claims SpiralMMO semantic authority.
 *
 * @param {ReturnType<typeof ingestSpiralReservoirV0>} result
 */
export function assertSpiralReservoirAdapterInvariantV0(result) {
  if (result?.audit?.semanticAuthority !== "rhizoh_cube_field_spec") {
    throw new Error("spiral_reservoir_invariant: semantic authority must remain rhizoh_cube_field_spec");
  }
  if (result?.mayTriggerExecution === true) {
    throw new Error("spiral_reservoir_invariant: adapter may not trigger execution");
  }
  if (result?.readOnly !== true) {
    throw new Error("spiral_reservoir_invariant: adapter output must be readOnly");
  }
  if (result?.cubeState?.sourceKind !== "spiral_reservoir_adapter") {
    throw new Error("spiral_reservoir_invariant: cubeState.sourceKind must be spiral_reservoir_adapter");
  }
  return true;
}

/**
 * Phase 3 entry — projection gate.
 *
 * @param {{
 *   schemaVersion?: string,
 *   reservoirId: string,
 *   correlationId?: string,
 *   signals: Record<string, unknown>
 * }} envelope
 * @param {{
 *   prevCubeState?: Partial<import('./cubeFieldSpiralMathV0.js').CubeStateInputV0> | null,
 *   sourceRef?: string,
 *   denoise?: boolean
 * }} [opts]
 */
export function ingestSpiralReservoirV0(envelope, opts = {}) {
  const schemaVersion = envelope?.schemaVersion || "";
  const batchQuarantined = schemaVersion !== SPIRAL_RESERVOIR_SIGNAL_SCHEMA_V0;

  const basePrev = normalizeCubeStateV0({
    attention: 0,
    confidence: 0.5,
    uncertainty: 0.5,
    drift: 0,
    cognitiveLoad: 0,
    intentVector: { observation: 0, reasoning: 0, memory: 0, action: 0 },
    spiralPhaseRad: 0,
    armPhaseOffsetRad: [0, 0, 0, 0],
    contradictionPressure: 0,
    sourceKind: "synthetic_fixture",
    sourceRef: "adapter_default",
    ...(opts.prevCubeState || {})
  });

  if (batchQuarantined) {
    const quarantinedState = normalizeCubeStateV0({
      ...basePrev,
      sourceKind: "spiral_reservoir_adapter",
      sourceRef: String(envelope?.reservoirId || "unknown"),
      readOnly: true
    });
    return Object.freeze({
      schema: SPIRAL_RESERVOIR_ADAPTER_SCHEMA_V0,
      ok: false,
      batchQuarantined: true,
      cubeState: quarantinedState,
      delta: Object.freeze({ fields: Object.freeze([]), before: Object.freeze({}), after: Object.freeze({}) }),
      audit: Object.freeze({
        reservoirId: String(envelope?.reservoirId || "unknown"),
        correlationId: String(envelope?.correlationId || ""),
        ignored: Object.freeze([]),
        quarantined: Object.freeze(["__batch_schema__"]),
        dropped: Object.freeze([]),
        semanticAuthority: "rhizoh_cube_field_spec"
      }),
      readOnly: true,
      mayTriggerExecution: false
    });
  }

  const normalized = normalizeReservoirSignalsV0(envelope.signals);
  const { cubeState, delta } = applyCubeStateDeltaV0(
    {
      ...basePrev,
      sourceRef: opts.sourceRef || String(envelope.reservoirId || "reservoir"),
      correlationId: envelope.correlationId || basePrev.correlationId
    },
    normalized.candidates,
    { denoise: opts.denoise }
  );

  return Object.freeze({
    schema: SPIRAL_RESERVOIR_ADAPTER_SCHEMA_V0,
    ok: true,
    batchQuarantined: false,
    cubeState: Object.freeze({
      ...cubeState,
      schemaVersion: CUBE_FIELD_CUBE_STATE_SCHEMA_V0,
      sourceKind: "spiral_reservoir_adapter",
      sourceRef: opts.sourceRef || String(envelope.reservoirId || "reservoir"),
      correlationId: String(envelope.correlationId || cubeState.correlationId || ""),
      readOnly: true
    }),
    delta,
    audit: Object.freeze({
      reservoirId: String(envelope.reservoirId || "unknown"),
      correlationId: String(envelope.correlationId || ""),
      ignored: normalized.ignored,
      quarantined: normalized.quarantined,
      dropped: normalized.dropped,
      semanticAuthority: "rhizoh_cube_field_spec"
    }),
    readOnly: true,
    mayTriggerExecution: false
  });
}
