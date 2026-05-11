/**
 * MK-1 Kernel Validator v0.1 — commit-time acceptance layer (runtime alignment).
 * @see docs/MK1_KERNEL_VALIDATOR_V0_1.md
 *
 * Execution contract (system order): EBVM → CSB → GDK → MK-1
 * MK-1 is the final accept/reject boundary (no side effects).
 * Not ontology, not epistemic truth.
 *
 * **πEFC mode:** `mk1Validate(trace, { manifest, clock, … })` is the **πEFC reference
 * evaluator** (sovereign decision surface). The name `mk1Validate` is historical;
 * semantically: primitive structural kernel + **πEFC adapter** — see
 * `evaluateBindIndexed.mjs` — sovereign entrypoint.
 *
 *   node scripts/mk1Validate.mjs <fixture.mjs>
 *   npm run epistemic:mk1-validate
 */

import * as crypto from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { stableStringifyForDeterminism } from "./evaluateBind.mjs";
import { anfExpectedOpId } from "./anfReduce.mjs";
import { projectPi } from "./projectPi.mjs";

/** @typedef {{ valid: true, class: "MK1_VALID_TRACE", witness: string }} Mk1Ok */
/** @typedef {{ valid: false, code: string, class: "MK1_REJECTED_TRACE" }} Mk1Err */

/**
 * Closed error contract — runtime must not invent new codes (closure property).
 * @type {Readonly<{
 *   INVALID_INPUT: string;
 *   INVALID_EDGE_KIND: string;
 *   IDENTITY_DIVERGENCE: string;
 *   CLOCK_NON_INJECTIVE: string;
 *   NON_CANONICAL_TRACE: string;
 *   ROOT_HASH_MISMATCH: string;
 *   PROJECTION_AUTHORITY_MISMATCH: string;
 *   COMPAT_MATRIX_UNDEFINED: string;
 *   EPOCH_BINDING_MISSING: string;
 *   DUAL_READ_WITNESS_MISSING: string;
 * }>}
 */
/**
 * Frozen decision surface — **DecisionClass ∈ D** (runtime must not invent values).
 * @see docs/PI_EFC_RUNTIME_FORMAL_SPEC_V1.md §9.8
 * @type {Readonly<{
 *   ACCEPT_SELF: string;
 *   ACCEPT_NON_BREAKING: string;
 *   REJECT_BREAKING: string;
 *   REJECT_INCOMPARABLE: string;
 *   REJECT_UNDEFINED_POLICY: string;
 *   PENDING: string;
 *   PARTIAL_VALID: string;
 * }>}
 */
export const DECISION_CLASS = Object.freeze({
  ACCEPT_SELF: "DECISION_ACCEPT_SELF",
  ACCEPT_NON_BREAKING: "DECISION_ACCEPT_NON_BREAKING",
  REJECT_BREAKING: "DECISION_REJECT_BREAKING",
  REJECT_INCOMPARABLE: "DECISION_REJECT_INCOMPARABLE",
  REJECT_UNDEFINED_POLICY: "DECISION_REJECT_UNDEFINED_POLICY",
  PENDING: "DECISION_PENDING",
  PARTIAL_VALID: "DECISION_PARTIAL_VALID"
});

export const MK1_ERR = Object.freeze({
  INVALID_INPUT: "MK1_ERR_INVALID_INPUT",
  INVALID_EDGE_KIND: "MK1_ERR_INVALID_EDGE_KIND",
  IDENTITY_DIVERGENCE: "MK1_ERR_IDENTITY_DIVERGENCE",
  CLOCK_NON_INJECTIVE: "MK1_ERR_CLOCK_NON_INJECTIVE",
  NON_CANONICAL_TRACE: "MK1_ERR_NON_CANONICAL_TRACE",
  ROOT_HASH_MISMATCH: "MK1_ERR_ROOT_HASH_MISMATCH",
  /** πEFC: trace.piHash / piHash_trace ≠ piAuthority and no valid matrix bridge */
  PROJECTION_AUTHORITY_MISMATCH: "MK1_ERR_PROJECTION_AUTHORITY_MISMATCH",
  /** πEFC: M(i,j) === UNDEFINED or matrix required but absent */
  COMPAT_MATRIX_UNDEFINED: "MK1_ERR_COMPAT_MATRIX_UNDEFINED",
  /** πEFC: projection epoch / pi labels missing when πEFC options require them */
  EPOCH_BINDING_MISSING: "MK1_ERR_EPOCH_BINDING_MISSING",
  /** πEFC: dual-read / CUT_OVER witness required but missing ([piEMS §4.2.1]) */
  DUAL_READ_WITNESS_MISSING: "MK1_ERR_DUAL_READ_WITNESS_MISSING"
});

const K = new Set(["causal", "semantic", "structural"]);

/** @type {Set<string>} */
const _allowedCodes = new Set(Object.values(MK1_ERR));

/** @type {Set<string>} */
const _allowedDecisionClass = new Set(Object.values(DECISION_CLASS));

/**
 * Global identity domain for MK-1 — not a “format choice”.
 * HARD INVARIANT: output ∈ [a-f0-9]{64} (Node digest is lowercase hex).
 * @param {unknown} data
 * @returns {string}
 */
export function H_canon(data) {
  const normalized = stableStringifyForDeterminism(data);

  return crypto
    .createHash("sha256")
    .update(normalized, "utf8")
    .digest("hex");
}

const _hex64 = /^[0-9a-f]{64}$/;

/**
 * `finalHash` ∉ hash input domain (no circularity).
 * @param {object | null | undefined} trace
 * @returns {Record<string, unknown>}
 */
export function traceWithoutFinalHash(trace) {
  if (!trace || typeof trace !== "object") return {};

  const { finalHash, ...rest } = trace;
  return rest;
}

/**
 * Structural MK-1 only (no πEFC governance layer).
 * @param {object} trace
 * @param {unknown} manifest
 * @param {unknown} clock
 * @returns {Mk1Ok | Mk1Err}
 */
function runMk1Structural(trace, manifest, clock) {
  const g1 = checkEdgeKinds(trace);
  if (!g1.ok) return err(MK1_ERR.INVALID_EDGE_KIND);

  const g2 = checkANF(trace, manifest, clock);
  if (!g2.ok) return err(MK1_ERR.IDENTITY_DIVERGENCE);

  const g3 = checkClock(trace, clock);
  if (!g3.ok) return err(MK1_ERR.CLOCK_NON_INJECTIVE);

  const g4 = checkGECS(trace);
  if (!g4.ok) return err(MK1_ERR.NON_CANONICAL_TRACE);

  const g5 = checkRoot(trace);
  if (!g5.ok) return err(MK1_ERR.ROOT_HASH_MISMATCH);

  return {
    valid: true,
    class: "MK1_VALID_TRACE",
    witness: /** @type {{ finalHash: string }} */ (trace).finalHash
  };
}

/**
 * @param {unknown} trace
 * @param {unknown} manifestOrOpts
 * @param {unknown} [clockMaybe]
 * @returns {Mk1Ok | Mk1Err | PiefcOutcome}
 */
export function mk1Validate(trace, manifestOrOpts, clockMaybe) {
  const opts = normalizeMk1Call(trace, manifestOrOpts, clockMaybe);
  if (!opts) {
    return err(MK1_ERR.INVALID_INPUT);
  }

  const structural = runMk1Structural(trace, opts.manifest, opts.clock);
  if (!opts.piEfc) {
    return structural;
  }

  return evaluatePiefcLayer(/** @type {object} */ (trace), opts, structural);
}

/**
 * @typedef {{
 *   mk1: Mk1Ok | Mk1Err;
 *   compatibility: string;
 *   decisionClass: typeof DECISION_CLASS[keyof typeof DECISION_CLASS];
 *   witness?: string;
 *   piEfcCode?: string;
 * }} PiefcOutcome
 */

/**
 * @param {unknown} trace
 * @param {unknown} manifestOrOpts
 * @param {unknown} [clockMaybe]
 * @returns {null | {
 *   manifest: unknown;
 *   clock: unknown;
 *   piAuthority?: string;
 *   epochContext?: Record<string, unknown>;
 *   compatibilityMatrix?: (i: string, j: string) => string;
 *   piEfc: boolean;
 * }}
 */
function normalizeMk1Call(trace, manifestOrOpts, clockMaybe) {
  if (!trace || typeof trace !== "object" || Array.isArray(trace)) {
    return null;
  }
  if (!Array.isArray(/** @type {{ edges?: unknown }} */ (trace).edges)) {
    return null;
  }

  if (
    manifestOrOpts &&
    typeof manifestOrOpts === "object" &&
    !Array.isArray(manifestOrOpts) &&
    Object.prototype.hasOwnProperty.call(manifestOrOpts, "manifest")
  ) {
    const o = /** @type {{ manifest: unknown, clock?: unknown, clockContext?: unknown, piAuthority?: string, epochContext?: Record<string, unknown>, compatibilityMatrix?: (i: string, j: string) => string }} */ (manifestOrOpts);
    const clock = o.clock ?? o.clockContext;
    if (!o.manifest || !clock) {
      return null;
    }
    const piEfc = isPiefcOptions(o);
    return {
      manifest: o.manifest,
      clock,
      piAuthority: o.piAuthority,
      epochContext: o.epochContext,
      compatibilityMatrix: o.compatibilityMatrix,
      piEfc
    };
  }

  if (clockMaybe === undefined || !manifestOrOpts || !clockMaybe) {
    return null;
  }

  return {
    manifest: manifestOrOpts,
    clock: clockMaybe,
    piEfc: false
  };
}

/**
 * @param {{ piAuthority?: string, epochContext?: Record<string, unknown>, compatibilityMatrix?: unknown }} o
 */
function isPiefcOptions(o) {
  if (o.piAuthority != null || o.compatibilityMatrix != null) {
    return true;
  }
  const ec = o.epochContext;
  if (ec == null || typeof ec !== "object") {
    return false;
  }
  return (
    ec.traceEpochId != null ||
    ec.authorityEpochId != null ||
    ec.dualReadRequired === true
  );
}

/**
 * @param {object} trace
 * @param {NonNullable<ReturnType<typeof normalizeMk1Call>>} opts
 * @param {Mk1Ok | Mk1Err} structural
 * @returns {PiefcOutcome}
 */
function evaluatePiefcLayer(trace, opts, structural) {
  if (!structural.valid) {
    return buildPiefcOutcome(
      structural,
      "UNDEFINED",
      DECISION_CLASS.REJECT_UNDEFINED_POLICY
    );
  }

  const dual = checkDualReadWitness(trace, opts.epochContext);
  if (!dual.ok) {
    return buildPiefcOutcome(
      structural,
      "UNDEFINED",
      DECISION_CLASS.REJECT_UNDEFINED_POLICY,
      MK1_ERR.DUAL_READ_WITNESS_MISSING
    );
  }

  const comp = resolveCompatibility(trace, opts);
  if (!comp.ok) {
    return buildPiefcOutcome(
      structural,
      "UNDEFINED",
      DECISION_CLASS.REJECT_UNDEFINED_POLICY,
      comp.code
    );
  }

  const decisionClass = computeDecisionClass(structural, comp.cls);
  return buildPiefcOutcome(structural, comp.cls, decisionClass);
}

/**
 * @param {Record<string, unknown> | undefined} epochContext
 */
function checkDualReadWitness(trace, epochContext) {
  if (!epochContext || epochContext.dualReadRequired !== true) {
    return { ok: true };
  }
  const need = epochContext.authorityEpochId;
  if (typeof need !== "string") {
    return { ok: false };
  }
  const w = trace.mk1DualReadWitness;
  if (!w || typeof w !== "object" || !Array.isArray(w.epochs)) {
    return { ok: false };
  }
  return { ok: w.epochs.includes(need) };
}

/**
 * @param {object} trace
 * @param {NonNullable<ReturnType<typeof normalizeMk1Call>>} opts
 */
function resolveCompatibility(trace, opts) {
  const { piAuthority, epochContext, compatibilityMatrix } = opts;
  /** @type {Record<string, unknown> | undefined} */
  const ec = epochContext;

  if (typeof compatibilityMatrix === "function") {
    const traceEpoch = trace.projectionEpochId ?? ec?.traceEpochId;
    const authEpoch = ec?.authorityEpochId;
    if (typeof traceEpoch !== "string" || typeof authEpoch !== "string") {
      return { ok: false, code: MK1_ERR.EPOCH_BINDING_MISSING };
    }
    const raw = compatibilityMatrix(traceEpoch, authEpoch);
    if (raw === "UNDEFINED") {
      return { ok: false, code: MK1_ERR.COMPAT_MATRIX_UNDEFINED };
    }
    if (
      raw !== "SELF" &&
      raw !== "NON_BREAKING" &&
      raw !== "BREAKING" &&
      raw !== "INCOMPARABLE"
    ) {
      return { ok: false, code: MK1_ERR.COMPAT_MATRIX_UNDEFINED };
    }
    return { ok: true, cls: raw };
  }

  const tracePi = trace.piHash ?? trace.piHash_trace;
  const authPi = piAuthority;
  const traceEpoch = trace.projectionEpochId ?? ec?.traceEpochId;
  const authEpoch = ec?.authorityEpochId;

  if (authPi == null && authEpoch == null) {
    return { ok: true, cls: "SELF" };
  }
  if (authPi != null && tracePi == null) {
    return { ok: false, code: MK1_ERR.EPOCH_BINDING_MISSING };
  }
  if (authPi == null && tracePi != null) {
    return { ok: false, code: MK1_ERR.EPOCH_BINDING_MISSING };
  }
  if (authPi !== tracePi) {
    return { ok: false, code: MK1_ERR.PROJECTION_AUTHORITY_MISMATCH };
  }
  if (authEpoch != null || traceEpoch != null) {
    if (typeof authEpoch !== "string" || typeof traceEpoch !== "string") {
      return { ok: false, code: MK1_ERR.EPOCH_BINDING_MISSING };
    }
    if (authEpoch !== traceEpoch) {
      return { ok: false, code: MK1_ERR.PROJECTION_AUTHORITY_MISMATCH };
    }
  }

  return { ok: true, cls: "SELF" };
}

/**
 * @param {Mk1Ok | Mk1Err} structural
 * @param {string} compatCls
 */
function computeDecisionClass(structural, compatCls) {
  if (!structural.valid) {
    return DECISION_CLASS.REJECT_UNDEFINED_POLICY;
  }
  if (compatCls === "INCOMPARABLE") {
    return DECISION_CLASS.REJECT_INCOMPARABLE;
  }
  if (compatCls === "BREAKING") {
    return DECISION_CLASS.REJECT_BREAKING;
  }
  if (compatCls === "NON_BREAKING") {
    return DECISION_CLASS.ACCEPT_NON_BREAKING;
  }
  return DECISION_CLASS.ACCEPT_SELF;
}

/**
 * @param {Mk1Ok | Mk1Err} structural
 * @param {string} compatibility
 * @param {string} decisionClass
 * @param {string} [piEfcCode]
 * @returns {PiefcOutcome}
 */
function buildPiefcOutcome(structural, compatibility, decisionClass, piEfcCode) {
  if (!_allowedDecisionClass.has(decisionClass)) {
    throw new Error(`MK-1 decision closure violation: ${decisionClass}`);
  }
  const out = {
    mk1: structural,
    compatibility,
    decisionClass,
    witness: structural.valid ? structural.witness : undefined
  };
  if (piEfcCode) {
    return { ...out, piEfcCode };
  }
  return out;
}

// -------------------- Guards --------------------

/**
 * ∀ e ∈ trace.edges ⇒ e.kind ∈ K
 * @param {{ edges: Array<{ kind?: string }> }} trace
 */
function checkEdgeKinds(trace) {
  for (const e of trace.edges) {
    if (!e || typeof e.kind !== "string" || !K.has(e.kind)) {
      return { ok: false };
    }
  }
  return { ok: true };
}

/**
 * ANF gate: ∀ edge · `opId === anfExpectedOpId(edge, index, manifest, clock)` (tuple ⟨π,σ,ι,γ,μ⟩).
 * @param {{ edges: Array<{ kind?: string, opId?: string, anfBinding?: string | number }> }} trace
 */
function checkANF(trace, manifest, clock) {
  const edges = trace.edges;
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i];
    if (!e?.opId || !_hex64.test(e.opId)) {
      return { ok: false };
    }
    const expected = anfExpectedOpId(e, i, manifest, clock);
    if (e.opId !== expected) {
      return { ok: false };
    }
  }
  return { ok: true };
}

/**
 * GDK stress hook: if both `trace.mk1ClockWitness.tick` and `clock.tick` are numbers,
 * they must match — otherwise `MK1_ERR_CLOCK_NON_INJECTIVE` (time / witness divergence).
 * If either side omits tick, guard passes (backward compatible; full GDK §5.4 later).
 */
function checkClock(trace, clock) {
  if (!clock || typeof clock !== "object" || typeof clock.tick !== "number") {
    return { ok: true };
  }
  const w = trace.mk1ClockWitness;
  if (!w || typeof w !== "object" || typeof w.tick !== "number") {
    return { ok: true };
  }
  if (w.tick !== clock.tick) {
    return { ok: false };
  }
  return { ok: true };
}

/**
 * GECS / UCFC: canonical class membership delegated to π in `checkRoot` (order-invariant multiset).
 * Reserved for future “already canonical” fast-reject without π.
 */
function checkGECS(_trace) {
  return { ok: true };
}

/**
 * Root check = pure equality over canonical domain (strict string equality on hex).
 * @param {{ finalHash?: string, [k: string]: unknown }} trace
 */
function checkRoot(trace) {
  if (!trace?.finalHash) {
    return { ok: false };
  }

  if (!_hex64.test(trace.finalHash)) {
    return { ok: false };
  }

  const body = traceWithoutFinalHash(trace);
  const canonical = projectPi(body);
  const computed = H_canon(canonical);

  return { ok: computed === trace.finalHash };
}

/**
 * No dynamic error generation — codes must be members of MK1_ERR.
 * @param {string} code
 * @returns {Mk1Err}
 */
function err(code) {
  if (!_allowedCodes.has(code)) {
    throw new Error(`MK-1 closure violation: dynamic or unknown code: ${code}`);
  }
  return {
    valid: false,
    code,
    class: "MK1_REJECTED_TRACE"
  };
}

// -------------------- CLI (fixed contract) --------------------

async function runCli() {
  const file = process.argv[2];
  if (!file) {
    console.error(MK1_ERR.INVALID_INPUT);
    process.exit(1);
  }

  // Invariant: resolved module path is part of the deterministic identity chain.
  const mod = await import(
    pathToFileURL(resolve(process.cwd(), file)).href
  );
  const { trace, manifest, clock } = mod;
  const result = mk1Validate(trace, manifest, clock);
  console.log(JSON.stringify(result, null, 2));
  const ok = "mk1" in result ? result.mk1.valid : result.valid;
  process.exit(ok ? 0 : 1);
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  runCli();
}
