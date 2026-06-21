/**
 * Founder cohort aggregate v0 — read-only rollup for ops / invitation study.
 * Local session truth + peer castle count; not a multi-user server dashboard yet.
 */

import { buildInvitationStudyRecordV0 } from "./invitationStudyExportV0.js";
import { exportJsonSafeV0 } from "./exportJsonSafeV0.js";
import { buildEpistemicSeparationProofV0 } from "./epistemicSeparationProofV0.js";
import { measureEpistemicResonanceFieldV0 } from "./epistemicResonanceFieldV0.js";
import { getVisitorEpistemicTraceV0 } from "./visitorEpistemicTraceV0.js";
import { getObserverTraceSnapshotV0 } from "./observerReadOnlyHookV0.js";
import { projectObserverLensV0 } from "./observerEpistemicLensV0.js";

export const FOUNDER_COHORT_AGGREGATE_SCHEMA_V0 = "castle.rhizoh.founder_cohort_aggregate.v0";

export function isFounderOpsSessionV0() {
  if (typeof window === "undefined") return false;
  try {
    if (import.meta.env?.VITE_RHIZOH_FOUNDER_PANEL === "1") return true;
    const q = new URLSearchParams(window.location.search);
    return q.get("founder") === "1" || q.get("cohort") === "review";
  } catch {
    return false;
  }
}

function readCohortObservationLogV0() {
  if (typeof window === "undefined") return [];
  try {
    const fn = window.__CASTLE_COHORT_OBSERVATION_LOG__;
    if (typeof fn === "function") return fn()?.entries || [];
  } catch {
    /* noop */
  }
  return [];
}

function readRemoteCastleCountV0() {
  if (typeof window === "undefined") return 0;
  try {
    const inspect = window.__rhizoh?.inspectMapPinOwner;
    if (typeof inspect === "function") {
      const remote = window.__rhizoh?.__remoteCastlesCount;
      if (typeof remote === "number") return remote;
    }
  } catch {
    /* noop */
  }
  return 0;
}

/**
 * @param {{ locale?: string, remoteCastleCount?: number }} [opts]
 */
export function buildFounderCohortAggregateV0(opts = {}) {
  const locale = opts.locale ?? "en";
  const visitor = getVisitorEpistemicTraceV0();
  const observer = getObserverTraceSnapshotV0();
  const lens = projectObserverLensV0();
  const study = buildInvitationStudyRecordV0({ locale });
  const proof = buildEpistemicSeparationProofV0({ locale });
  const resonance = measureEpistemicResonanceFieldV0({ locale });

  return Object.freeze({
    schema: FOUNDER_COHORT_AGGREGATE_SCHEMA_V0,
    exportedAtMs: Date.now(),
    sessionScope: "local_browser_only",
    inviteCohort: study.cohortId,
    perceptionMode: study.perceptionMode,
    peerCastlesOnline: opts.remoteCastleCount ?? readRemoteCastleCountV0(),
    observer: Object.freeze({
      traceCount: observer?.count ?? 0,
      visitorSessions: visitor?.sessions ?? 0,
      path: visitor?.path ?? [],
      familiarity: lens?.returnField?.familiarity ?? 0,
      recognition: lens?.returnField?.recognition ?? "none"
    }),
    resonance: Object.freeze({
      peak: resonance.peakResonance,
      primaryEntity: resonance.primaryEntity,
      measurementOnly: true,
      isCoupling: false
    }),
    separationProof: Object.freeze({
      holds: proof.separationHolds === true,
      paperSpine: proof.paperSpine
    }),
    invitationStudyRecord: study,
    cohortObservationEvents: Object.freeze(readCohortObservationLogV0().slice(-12)),
    productGaps: Object.freeze({
      multiUserAggregate: "requires_server_or_manual_export_per_invitee",
      mapPeerPins: "requires_firebase_active_castles_and_show_pins",
      centralizedDashboard: "founder_panel_v0_local_only"
    }),
    interpretationOnly: true,
    readOnly: true
  });
}

export async function exportFounderCohortAggregateV0(opts = {}) {
  const aggregate = buildFounderCohortAggregateV0(opts);
  const json = JSON.stringify(aggregate, null, 2);
  const out = await exportJsonSafeV0(json, `rhizoh-founder-cohort-${aggregate.exportedAtMs}.json`);
  return { ...out, aggregate };
}

export function mountFounderCohortAggregateConsoleV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.founderCohort = Object.freeze({
    build: buildFounderCohortAggregateV0,
    export: exportFounderCohortAggregateV0,
    isFounderSession: isFounderOpsSessionV0
  });
}
