/**
 * Authority Ledger + Seal Pipeline v1 — durable official history for admission decisions.
 * Admission Request → Human Attestation → Authority Decision → Ledger Seal → (Reality Mutation: phase-gated)
 * fusion ≠ authority · ledger records · seal verifies · mutation never auto.
 * RESEARCH-ONLY
 * @see docs/RHIZOH_AUTHORITY_LEDGER_SEAL_PIPELINE_V1.md
 */

import { ensureAuthorityGatewayPersistenceBridgeV1 } from "./authorityGatewayPersistenceBridgeV1.js";
import { ensureAuthorityEpochMergeEventV1 } from "./authorityEpochMergeEventV1.js";
import { ensureUnifiedSemanticRealityFieldV1 } from "./unifiedSemanticRealityFieldV1.js";
import { ensureWorkerAuthorityReplayAlignmentV1 } from "./workerAuthorityReplayAlignmentV1.js";
import {
  getAuthorityEpochSnapshotV1,
  mintAuthorityEpochIdV1,
  resetAuthorityEpochForTestV1
} from "./authorityEpochBoundaryV1.js";
import {
  ADMISSION_VERDICT_V1,
  getAdmissionArbitrationSnapshotV1
} from "./admissionArbitrationLayerV1.js";
import { foldWalSegmentHashV0, WAL_HASH_CHAIN_GENESIS_V0 } from "./continuity/walHashChainV0.js";

export const AUTHORITY_LEDGER_SCHEMA_V1 = "castle.rhizoh.authority_ledger.v1";
export const AUTHORITY_LEDGER_EVENT_V1 = "rhizoh:authority-ledger-v1";
export const AUTHORITY_SEAL_EVENT_V1 = "rhizoh:authority-seal-v1";

export const AUTHORITY_CHAIN_STAGE_V1 = Object.freeze({
  ADMISSION_REQUEST: "admission_request",
  HUMAN_ATTESTATION: "human_attestation",
  AUTHORITY_DECISION: "authority_decision",
  LEDGER_SEAL: "ledger_seal",
  REALITY_MUTATION: "reality_mutation"
});

export const AUTHORITY_DECISION_V1 = Object.freeze({
  INFERENCE_READ_ONLY: "inference_read_only",
  HOLD_NO_DOWNSTREAM: "hold_no_downstream",
  PENDING_HUMAN: "pending_human",
  MUTATION_BLOCKED: "mutation_blocked"
});

const LEDGER_RING_MAX_V1 = 128;
/** @type {object[]} */
const ledgerEntriesV1 = [];
let ledgerHeightV1 = 0;
/** @type {string} */
let sealChainHeadV1 = WAL_HASH_CHAIN_GENESIS_V0;
/** @type {object | null} */
let lastSealV1 = null;
/** @type {object | null} */
let lastPipelineV1 = null;
/** @type {object | null} */
let pendingHumanAttestationV1 = null;

function dispatchAuthorityEventV1(name, detail) {
  if (typeof globalThis !== "undefined" && globalThis.dispatchEvent) {
    globalThis.dispatchEvent(new CustomEvent(name, { detail }));
  }
}

/**
 * @param {object} arbitration
 */
export function recordAdmissionRequestV1(arbitration) {
  return Object.freeze({
    schema: `${AUTHORITY_LEDGER_SCHEMA_V1}.admission_request`,
    arbitrationId: arbitration.arbitrationId || null,
    arbitrationSeq: arbitration.arbitrationSeq ?? null,
    verdict: arbitration.verdict || ADMISSION_VERDICT_V1.HOLD,
    inferenceEligible: Boolean(arbitration.inferenceEligible),
    holdReason: arbitration.holdReason || null,
    projectionRef: arbitration.projectionRef || null,
    phaseContext: arbitration.phaseContext || null,
    atMs: arbitration.atMs || Date.now(),
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * Human attestation records intent only — does not auto-mutate reality.
 * @param {{ operatorId?: string, reason?: string, arbitrationId?: string }} [opts]
 */
export function recordHumanAttestationV1(opts = {}) {
  const attestation = Object.freeze({
    schema: `${AUTHORITY_LEDGER_SCHEMA_V1}.human_attestation`,
    operatorId: opts.operatorId || "human_operator",
    reason: String(opts.reason || "reality_mutation_request"),
    arbitrationId: opts.arbitrationId || lastPipelineV1?.admissionRequest?.arbitrationId || null,
    attestedAtMs: Date.now(),
    autoGrantsMutation: false,
    interpretationOnly: true,
    nonExecutive: true
  });
  pendingHumanAttestationV1 = attestation;
  return attestation;
}

/**
 * @param {object} admissionRequest
 * @param {object | null} [humanAttestation]
 */
export function deriveAuthorityDecisionV1(admissionRequest, humanAttestation = null) {
  const verdict = admissionRequest.verdict;
  let decision = AUTHORITY_DECISION_V1.HOLD_NO_DOWNSTREAM;
  let realityMutationPermitted = false;

  if (verdict === ADMISSION_VERDICT_V1.INFERENCE_ELIGIBLE) {
    decision = AUTHORITY_DECISION_V1.INFERENCE_READ_ONLY;
  } else if (verdict === ADMISSION_VERDICT_V1.HUMAN_ATTESTATION_REQUIRED) {
    decision = AUTHORITY_DECISION_V1.PENDING_HUMAN;
  }

  if (humanAttestation) {
    decision = AUTHORITY_DECISION_V1.MUTATION_BLOCKED;
    realityMutationPermitted = false;
  }

  return Object.freeze({
    schema: `${AUTHORITY_LEDGER_SCHEMA_V1}.authority_decision`,
    decision,
    verdict,
    inferenceEligible: Boolean(admissionRequest.inferenceEligible),
    realityMutationPermitted,
    mutationBlockedReason: realityMutationPermitted
      ? null
      : "phase_gate_data_plane_off",
    requiresForMutation: Object.freeze([
      AUTHORITY_CHAIN_STAGE_V1.HUMAN_ATTESTATION,
      AUTHORITY_CHAIN_STAGE_V1.LEDGER_SEAL,
      "signed_ready"
    ]),
    atMs: Date.now(),
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * Append sealed entry to authority ledger (hash-chained).
 * @param {{ admissionRequest: object, authorityDecision: object, humanAttestation?: object | null, atMs?: number }} input
 */
export function sealAuthorityLedgerEntryV1(input) {
  const atMs = Number(input.atMs) || Date.now();
  ledgerHeightV1 += 1;

  const body = Object.freeze({
    height: ledgerHeightV1,
    admissionRequest: input.admissionRequest,
    humanAttestation: input.humanAttestation || null,
    authorityDecision: input.authorityDecision,
    realityMutation: Object.freeze({
      stage: AUTHORITY_CHAIN_STAGE_V1.REALITY_MUTATION,
      permitted: false,
      reason: input.authorityDecision.mutationBlockedReason || "phase_gate",
      interpretationOnly: true,
      nonExecutive: true
    })
  });

  const prevSealHash = sealChainHeadV1;
  const sealHash = foldWalSegmentHashV0(prevSealHash, body);

  const entry = Object.freeze({
    schema: `${AUTHORITY_LEDGER_SCHEMA_V1}.entry`,
    entryId: `auth_ledger_${ledgerHeightV1}`,
    height: ledgerHeightV1,
    stage: AUTHORITY_CHAIN_STAGE_V1.LEDGER_SEAL,
    epoch: getAuthorityEpochSnapshotV1(),
    ...body,
    seal: Object.freeze({
      prevSealHash,
      sealHash,
      sealedAtMs: atMs
    }),
    interpretationOnly: true,
    nonExecutive: true,
    orchestratesOnly: true
  });

  sealChainHeadV1 = sealHash;
  lastSealV1 = Object.freeze({
    height: ledgerHeightV1,
    sealHash,
    prevSealHash,
    sealedAtMs: atMs
  });

  ledgerEntriesV1.unshift(entry);
  if (ledgerEntriesV1.length > LEDGER_RING_MAX_V1) {
    ledgerEntriesV1.length = LEDGER_RING_MAX_V1;
  }

  dispatchAuthorityEventV1(AUTHORITY_SEAL_EVENT_V1, entry);
  dispatchAuthorityEventV1(AUTHORITY_LEDGER_EVENT_V1, entry);

  return entry;
}

/**
 * Full pipeline: admission request → decision → ledger seal.
 * @param {{ arbitration: object, humanAttestation?: object | null, atMs?: number }} input
 */
export function processAuthorityPipelineV1(input) {
  const admissionRequest = recordAdmissionRequestV1(input.arbitration);
  const humanAttestation = input.humanAttestation || pendingHumanAttestationV1;
  const authorityDecision = deriveAuthorityDecisionV1(admissionRequest, humanAttestation);
  const sealedEntry = sealAuthorityLedgerEntryV1({
    admissionRequest,
    authorityDecision,
    humanAttestation,
    atMs: input.atMs
  });

  const pipeline = Object.freeze({
    schema: `${AUTHORITY_LEDGER_SCHEMA_V1}.pipeline`,
    stages: Object.freeze([
      AUTHORITY_CHAIN_STAGE_V1.ADMISSION_REQUEST,
      humanAttestation ? AUTHORITY_CHAIN_STAGE_V1.HUMAN_ATTESTATION : null,
      AUTHORITY_CHAIN_STAGE_V1.AUTHORITY_DECISION,
      AUTHORITY_CHAIN_STAGE_V1.LEDGER_SEAL,
      AUTHORITY_CHAIN_STAGE_V1.REALITY_MUTATION
    ].filter(Boolean)),
    admissionRequest,
    humanAttestation,
    authorityDecision,
    sealedEntry,
    ledgerHeight: ledgerHeightV1,
    sealHash: lastSealV1?.sealHash || null,
    realityMutationPermitted: false,
    atMs: sealedEntry.seal.sealedAtMs,
    interpretationOnly: true,
    nonExecutive: true
  });

  lastPipelineV1 = pipeline;
  if (humanAttestation) {
    pendingHumanAttestationV1 = null;
  }

  return pipeline;
}

/**
 * Deterministic local replay — verifies hash chain.
 */
export function replayAuthorityLedgerV1() {
  const chronological = [...ledgerEntriesV1].reverse();
  let head = WAL_HASH_CHAIN_GENESIS_V0;
  const trace = [];

  for (const entry of chronological) {
    const body = Object.freeze({
      height: entry.height,
      admissionRequest: entry.admissionRequest,
      humanAttestation: entry.humanAttestation,
      authorityDecision: entry.authorityDecision,
      realityMutation: entry.realityMutation
    });
    const expected = foldWalSegmentHashV0(head, body);
    const ok = expected === entry.seal?.sealHash;
    trace.push(
      Object.freeze({
        height: entry.height,
        ok,
        expected,
        actual: entry.seal?.sealHash || null
      })
    );
    if (!ok) {
      return Object.freeze({
        schema: `${AUTHORITY_LEDGER_SCHEMA_V1}.replay`,
        ok: false,
        reason: "hash_chain_break",
        height: entry.height,
        trace,
        interpretationOnly: true,
        nonExecutive: true
      });
    }
    head = expected;
  }

  return Object.freeze({
    schema: `${AUTHORITY_LEDGER_SCHEMA_V1}.replay`,
    ok: true,
    height: ledgerHeightV1,
    sealHead: head,
    entriesReplayed: chronological.length,
    workerReplayAvailable: false,
    localReplayAvailable: true,
    note: "gateway worker replay requires data-plane READY",
    trace,
    interpretationOnly: true,
    nonExecutive: true
  });
}

export function getAuthorityLedgerSnapshotV1() {
  const replay = ledgerHeightV1 > 0 ? replayAuthorityLedgerV1() : null;
  return Object.freeze({
    schema: `${AUTHORITY_LEDGER_SCHEMA_V1}.snapshot`,
    ledgerHeight: ledgerHeightV1,
    epoch: getAuthorityEpochSnapshotV1(),
    lastSeal: lastSealV1,
    sealChainHead: sealChainHeadV1,
    lastPipeline: lastPipelineV1,
    pendingHumanAttestation: pendingHumanAttestationV1,
    recentEntries: Object.freeze(ledgerEntriesV1.slice(0, 8)),
    replay,
    diagnosis: Object.freeze({
      officialHistoryWritable: ledgerHeightV1 > 0,
      sealPresent: Boolean(lastSealV1?.sealHash),
      gatewayWorkerReplay: false,
      localReplayAvailable: ledgerHeightV1 > 0,
      realityMutationAutoPath: false
    }),
    interpretationOnly: true,
    nonExecutive: true,
    atMs: Date.now()
  });
}

export function buildAuthorityLedgerReportV1() {
  return Object.freeze({
    schema: `${AUTHORITY_LEDGER_SCHEMA_V1}.report`,
    note: "Authority ledger + seal — official history for admission decisions (mutation phase-gated)",
    snapshot: getAuthorityLedgerSnapshotV1(),
    apis: Object.freeze({
      snapshot: "window.__rhizoh.authorityLedger()",
      seal: "window.__rhizoh.sealAuthorityDecision(arbitration?)",
      replay: "window.__rhizoh.replayAuthorityLedger()",
      humanAttestation: "window.__rhizoh.recordHumanAttestation()"
    }),
    atMs: Date.now()
  });
}

export function ensureAuthorityLedgerSealPipelineV1() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};

  mintAuthorityEpochIdV1();

  if (!window.__rhizoh.authorityLedger) {
    window.__rhizoh.authorityLedger = () => getAuthorityLedgerSnapshotV1();
  }
  if (!window.__rhizoh.authorityLedgerReport) {
    window.__rhizoh.authorityLedgerReport = () => buildAuthorityLedgerReportV1();
  }
  if (!window.__rhizoh.sealAuthorityDecision) {
    window.__rhizoh.sealAuthorityDecision = (arbitration) =>
      processAuthorityPipelineV1({
        arbitration: arbitration || getAdmissionArbitrationSnapshotV1().lastVerdict
      });
  }
  if (!window.__rhizoh.replayAuthorityLedger) {
    window.__rhizoh.replayAuthorityLedger = () => replayAuthorityLedgerV1();
  }
  if (!window.__rhizoh.recordHumanAttestation) {
    window.__rhizoh.recordHumanAttestation = (opts) => recordHumanAttestationV1(opts);
  }

  ensureAuthorityGatewayPersistenceBridgeV1();
  ensureWorkerAuthorityReplayAlignmentV1();
  ensureAuthorityEpochMergeEventV1();
  ensureUnifiedSemanticRealityFieldV1();

  return window.__rhizoh.authorityLedger;
}

/** @internal vitest */
export function resetAuthorityLedgerForTestV1() {
  resetAuthorityEpochForTestV1();
  ledgerEntriesV1.length = 0;
  ledgerHeightV1 = 0;
  sealChainHeadV1 = WAL_HASH_CHAIN_GENESIS_V0;
  lastSealV1 = null;
  lastPipelineV1 = null;
  pendingHumanAttestationV1 = null;
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.__authorityLedgerWired;
  }
}
