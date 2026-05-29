/**
 * External reproducibility layer v0.1 — cross-environment bundle equivalence (read-only).
 *
 * Same canonical bundle across profiles · gateway latency drift probe · boundary determinism
 * @see docs/RHIZOH_EPISTEMIC_REPRODUCIBILITY_LAYER_V0.1.md
 */

import { runEpistemicAuditBundleV0 } from "./epistemicAuditBundleV0.js";
import {
  collectClientBoundarySnapshotV0,
  evaluateExternalBoundaryValidationV0,
  BOUNDARY_STATE_V0
} from "./externalBoundaryValidationV0.js";
import {
  clearEpistemicTickLedgerForTestV0,
  resetEpistemicTickLedgerSessionV0
} from "./epistemicTickLedgerV0.js";
import { clearEpistemicStabilityForTestV0 } from "./epistemicStabilityControllerV0.js";
import { clearEpistemicAuditBundleForTestV0 } from "./epistemicAuditBundleV0.js";
import { runViolationSimulationSuiteV0 } from "./violationSimulationSuiteV0.js";

export const EPISTEMIC_REPRODUCIBILITY_SCHEMA_V0 = "castle.rhizoh.epistemic_reproducibility.v0";

/** @type {object | null} */
let lastReproReportV0 = null;

/**
 * @param {string} str
 */
function djb2HexV0(str) {
  let h = 5381;
  const s = String(str || "");
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/**
 * Strip volatile fields — comparable across environments / export imports.
 *
 * @param {object} bundle
 */
export function canonicalizeAuditBundleForReproV0(bundle) {
  const scenarios = bundle.simulation?.scenarios?.map((s) =>
    Object.freeze({
      id: s.id,
      pass: s.pass,
      expectedMode: s.expectedMode,
      actualMode: s.actualMode,
      violationClass: s.violationClass
    })
  );

  return Object.freeze({
    schema: bundle.schema,
    version: bundle.version,
    law: Object.freeze({
      allPassed: bundle.simulation?.allPassed ?? null,
      passed: bundle.simulation?.passed ?? null,
      total: bundle.simulation?.total ?? null,
      scenarios: Object.freeze(scenarios || [])
    }),
    epistemic_state: bundle.epistemic_state,
    playbook: Object.freeze({
      system_state: bundle.tick?.playbook?.system_state,
      checks: bundle.tick?.playbook?.checks
    }),
    boundary: Object.freeze({
      boundary_state: bundle.boundary?.boundary_state,
      checks: bundle.boundary?.checks
    }),
    synthesis: Object.freeze({
      compoundFault: bundle.synthesis?.compoundFault,
      dominantResponseMode: bundle.synthesis?.dominantResponseMode
    })
  });
}

/**
 * @param {object} bundle
 */
export function fingerprintReproducibleBundleV0(bundle) {
  const canonical = canonicalizeAuditBundleForReproV0(bundle);
  const hex = djb2HexV0(stableStringifyV0(canonical));
  return Object.freeze({
    schema: "castle.rhizoh.epistemic_repro_fingerprint.v0",
    fingerprint: `repro_bundle_${hex}`,
    canonical
  });
}

/**
 * @param {object} bundleA
 * @param {object} bundleB
 */
export function compareReproducibleBundlesV0(bundleA, bundleB) {
  const a = canonicalizeAuditBundleForReproV0(bundleA);
  const b = canonicalizeAuditBundleForReproV0(bundleB);
  const diffs = diffCanonicalV0(a, b, "");
  const fpA = fingerprintReproducibleBundleV0(bundleA);
  const fpB = fingerprintReproducibleBundleV0(bundleB);

  return Object.freeze({
    schema: "castle.rhizoh.epistemic_repro_compare.v0",
    match: diffs.length === 0,
    fingerprintA: fpA.fingerprint,
    fingerprintB: fpB.fingerprint,
    fingerprintsMatch: fpA.fingerprint === fpB.fingerprint,
    diffs: Object.freeze(diffs)
  });
}

/**
 * Same client + external inputs → identical boundary_state (deterministic evaluator).
 *
 * @param {{ client?: object, external?: object, runs?: number }} [opts]
 */
export function probeBoundaryConsistencyReproducibilityV0(opts = {}) {
  const runs = Math.max(2, Number(opts.runs) || 12);
  const client = collectClientBoundarySnapshotV0({
    clientSeqHead: 24,
    shadowWalTick: 3,
    eventSeqTail: [20, 21, 22, 24],
    collectedAtMs: 0,
    ...(opts.client || {})
  });
  const external = Object.freeze({
    gatewayLive: true,
    lastAcceptedSeq: 20,
    healthStatus: 200,
    fetchPhase: "synthetic_aligned",
    collectedAtMs: 0,
    ...(opts.external || {})
  });

  /** @type {string[]} */
  const states = [];
  /** @type {object[]} */
  const checks = [];

  for (let i = 0; i < runs; i++) {
    const r = evaluateExternalBoundaryValidationV0(client, external);
    states.push(r.boundary_state);
    checks.push(r.checks);
  }

  const uniqueStates = [...new Set(states)];
  const checkFingerprints = [...new Set(checks.map((c) => djb2HexV0(stableStringifyV0(c))))];

  return Object.freeze({
    schema: "castle.rhizoh.boundary_consistency_repro.v0",
    reproducible: uniqueStates.length === 1 && checkFingerprints.length === 1,
    runs,
    boundary_state: uniqueStates[0] ?? null,
    uniqueStates: Object.freeze(uniqueStates),
    checkFingerprint: checkFingerprints[0] ?? null,
    interpretationOnly: true
  });
}

/**
 * Gateway reachability / latency class must not flip boundary when snapshot seq is identical.
 */
export function probeGatewayLatencyDriftV0(opts = {}) {
  const client = collectClientBoundarySnapshotV0({
    clientSeqHead: opts.clientSeqHead ?? 40,
    collectedAtMs: 0
  });

  const alignedExternal = Object.freeze({
    gatewayLive: true,
    lastAcceptedSeq: opts.gatewaySeq ?? 25,
    healthStatus: 200,
    fetchPhase: "ok_fast",
    collectedAtMs: 0
  });

  const slowSameSeqExternal = Object.freeze({
    ...alignedExternal,
    fetchPhase: "ok_slow_latency"
  });

  const timeoutExternal = Object.freeze({
    gatewayLive: false,
    lastAcceptedSeq: null,
    healthStatus: null,
    fetchPhase: "timeout",
    collectedAtMs: 0
  });

  const rAligned = evaluateExternalBoundaryValidationV0(client, alignedExternal);
  const rSlow = evaluateExternalBoundaryValidationV0(client, slowSameSeqExternal);
  const rTimeout = evaluateExternalBoundaryValidationV0(client, timeoutExternal);
  const rTimeoutRequired = evaluateExternalBoundaryValidationV0(client, timeoutExternal, {
    requireGateway: true
  });

  return Object.freeze({
    schema: "castle.rhizoh.gateway_latency_drift.v0",
    aligned: rAligned.boundary_state,
    slowSameSeq: rSlow.boundary_state,
    timeoutSkipped: rTimeout.boundary_state,
    timeoutRequiredGateway: rTimeoutRequired.boundary_state,
    boundaryConsistentWhenSnapshotIdentical:
      rAligned.boundary_state === rSlow.boundary_state,
    latencyClassAffectsOutcome:
      rAligned.boundary_state !== rTimeout.boundary_state ||
      rTimeout.boundary_state !== rTimeoutRequired.boundary_state,
    seqDelta: rAligned.checks?.seqAlignment?.delta ?? null,
    interpretationOnly: true
  });
}

/**
 * Run audit bundle under multiple environment profiles; compare canonical fingerprints.
 *
 * @param {{
 *   profiles?: { id: string, fetchExternal?: boolean, requireGateway?: boolean }[],
 *   collectSignals?: () => object,
 *   resetLedgerBetweenProfiles?: boolean
 * }} [opts]
 */
export async function runCrossEnvironmentBundleProbeV0(opts = {}) {
  const profiles = opts.profiles?.length
    ? opts.profiles
    : [
        { id: "local_no_gateway_a", fetchExternal: false },
        { id: "local_no_gateway_b", fetchExternal: false }
      ];

  const collectSignals = opts.collectSignals || defaultReproCollectSignalsV0;

  const sharedSimulation =
    opts.runSimulation === false
      ? null
      : await runViolationSimulationSuiteV0({ print: false });

  /** @type {object[]} */
  const runs = [];

  for (const profile of profiles) {
    if (opts.resetLedgerBetweenProfiles !== false) {
      resetEpistemicTickLedgerSessionV0();
    }

    const bundle = await runEpistemicAuditBundleV0({
      label: `repro_${profile.id}`,
      fetchExternal: profile.fetchExternal,
      requireGateway: profile.requireGateway,
      collectSignals,
      observe: false,
      runSimulation: false,
      endCorrelationWindow: true
    });

    const bundleForFingerprint = Object.freeze({
      ...bundle,
      simulation: sharedSimulation ?? bundle.simulation
    });
    const fp = fingerprintReproducibleBundleV0(bundleForFingerprint);
    runs.push(
      Object.freeze({
        profileId: profile.id,
        fetchExternal: profile.fetchExternal,
        fingerprint: fp.fingerprint,
        canonical: fp.canonical,
        epistemic_state: bundle.epistemic_state,
        boundary_state: bundle.boundary.boundary_state,
        simulationLawOk: sharedSimulation?.allPassed ?? bundle.gateHints.simulationLawOk
      })
    );
  }

  const lawNote = sharedSimulation
    ? "law_layer_shared_once; profiles compare tick+boundary canonical only"
    : "per_profile_law";

  const fingerprints = runs.map((r) => r.fingerprint);
  const allMatch = fingerprints.every((f) => f === fingerprints[0]);

  return Object.freeze({
    schema: "castle.rhizoh.cross_environment_bundle_probe.v0",
    profileCount: runs.length,
    runs: Object.freeze(runs),
    allFingerprintsMatch: allMatch,
    referenceFingerprint: fingerprints[0] ?? null,
    lawNote,
    interpretationOnly: true
  });
}

/**
 * Full external reproducibility report (§6 bundle + boundary + latency + cross-env).
 *
 * @param {Parameters<typeof runCrossEnvironmentBundleProbeV0>[0] & {
 *   runCrossEnv?: boolean,
 *   boundaryRuns?: number
 * }} [opts]
 */
export async function runExternalReproducibilityReportV0(opts = {}) {
  const openedAtMs = Date.now();
  const collectSignals = opts.collectSignals || defaultReproCollectSignalsV0;

  const boundaryRepro = probeBoundaryConsistencyReproducibilityV0({
    runs: opts.boundaryRuns
  });
  const latencyDrift = probeGatewayLatencyDriftV0(opts.latencyProbe || {});

  let crossEnv = null;
  if (opts.runCrossEnv !== false) {
    crossEnv = await runCrossEnvironmentBundleProbeV0({
      profiles: opts.profiles,
      collectSignals,
      resetLedgerBetweenProfiles: opts.resetLedgerBetweenProfiles
    });
  }

  const closedAtMs = Date.now();
  const externallyReproducible =
    Boolean(boundaryRepro.reproducible) &&
    Boolean(latencyDrift.boundaryConsistentWhenSnapshotIdentical) &&
    (crossEnv == null || crossEnv.allFingerprintsMatch);

  const report = Object.freeze({
    schema: EPISTEMIC_REPRODUCIBILITY_SCHEMA_V0,
    version: "0.1",
    atMs: closedAtMs,
    durationMs: closedAtMs - openedAtMs,
    environment: collectRuntimeEnvironmentV0(),
    boundaryConsistency: boundaryRepro,
    gatewayLatencyDrift: latencyDrift,
    crossEnvironment: crossEnv,
    externallyReproducible,
    centralizedArbitrationBus: false,
    interpretationOnly: true,
    readOnly: true
  });

  lastReproReportV0 = report;
  syncEpistemicReproducibilityWindowV0(report);
  return report;
}

/**
 * Compare two exported bundle JSON blobs (staging vs local auditor).
 *
 * @param {string|object} bundleJsonA
 * @param {string|object} bundleJsonB
 */
export function compareImportedBundleEnvironmentsV0(bundleJsonA, bundleJsonB) {
  const a = typeof bundleJsonA === "string" ? JSON.parse(bundleJsonA) : bundleJsonA;
  const b = typeof bundleJsonB === "string" ? JSON.parse(bundleJsonB) : bundleJsonB;
  return compareReproducibleBundlesV0(a, b);
}

export function exportExternalReproducibilityJsonV0(report) {
  const payload = report ?? lastReproReportV0;
  return JSON.stringify(
    payload
      ? { ...payload, exportedAtMs: Date.now(), readOnly: true }
      : { schema: EPISTEMIC_REPRODUCIBILITY_SCHEMA_V0, error: "no_report_yet" },
    null,
    2
  );
}

export function getLastExternalReproducibilityReportV0() {
  return lastReproReportV0;
}

/** Test-only */
export function clearExternalReproducibilityForTestV0() {
  lastReproReportV0 = null;
  clearEpistemicAuditBundleForTestV0();
  clearEpistemicTickLedgerForTestV0();
  clearEpistemicStabilityForTestV0();
  syncEpistemicReproducibilityWindowV0(null);
}

function defaultReproCollectSignalsV0() {
  return Object.freeze({
    eventSeqs: [1, 2, 3],
    clientBoundary: Object.freeze({
      clientSeqHead: 3,
      shadowWalTick: 0,
      eventSeqTail: [1, 2, 3],
      collectedAtMs: 0
    })
  });
}

function collectRuntimeEnvironmentV0() {
  const isWindow = typeof window !== "undefined";
  return Object.freeze({
    runtime: isWindow ? "browser" : "node",
    userAgent: isWindow ? String(navigator?.userAgent || "") : "node",
    hasWindowRhizoh: isWindow && Boolean(window.__rhizoh)
  });
}

/**
 * @param {unknown} a
 * @param {unknown} b
 * @param {string} prefix
 * @returns {string[]}
 */
function diffCanonicalV0(a, b, prefix) {
  /** @type {string[]} */
  const diffs = [];
  if (a === b) return diffs;
  if (typeof a !== typeof b || a == null || b == null) {
    diffs.push(`${prefix}: ${JSON.stringify(a)} !== ${JSON.stringify(b)}`);
    return diffs;
  }
  if (typeof a !== "object") {
    if (a !== b) diffs.push(`${prefix}: ${a} !== ${b}`);
    return diffs;
  }
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (!(k in a)) {
      diffs.push(`${path}: missing in A`);
      continue;
    }
    if (!(k in b)) {
      diffs.push(`${path}: missing in B`);
      continue;
    }
    diffs.push(...diffCanonicalV0(a[k], b[k], path));
  }
  return diffs;
}

function stableStringifyV0(value) {
  if (value == null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringifyV0(v)).join(",")}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringifyV0(value[k])}`).join(",")}}`;
}

function syncEpistemicReproducibilityWindowV0(report) {
  if (typeof window === "undefined") return;
  if (!window.__rhizoh) window.__rhizoh = {};
  window.__rhizoh_epistemic_reproducibility = report;
  window.__rhizoh.epistemicReproducibility = Object.freeze({
    runReport: runExternalReproducibilityReportV0,
    last: () => lastReproReportV0,
    fingerprint: fingerprintReproducibleBundleV0,
    compareBundles: compareReproducibleBundlesV0,
    compareImported: compareImportedBundleEnvironmentsV0,
    probeBoundary: probeBoundaryConsistencyReproducibilityV0,
    probeLatency: probeGatewayLatencyDriftV0,
    crossEnvProbe: runCrossEnvironmentBundleProbeV0,
    export: exportExternalReproducibilityJsonV0
  });
}
