/**
 * Invitation study record exporter v0 — assembles metrics per RHIZOH_INVITATION_STUDY_V0.md
 * RESEARCH-ONLY · interpretation-only export for founder / paper.
 */

import { getVisitorEpistemicTraceV0 } from "./visitorEpistemicTraceV0.js";
import { getObserverTraceSnapshotV0 } from "./observerReadOnlyHookV0.js";
import { buildEpistemicSeparationProofV0 } from "./epistemicSeparationProofV0.js";
import { evaluateEpistemicReturnFieldV0 } from "./epistemicReturnFieldV0.js";
import { readObserverInviteContextV0 } from "./observerInviteLandingV0.js";

export const INVITATION_STUDY_RECORD_SCHEMA_V0 = "castle.rhizoh.invitation_study_record.v0";

function simpleHashV0(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return `anon_${(h >>> 0).toString(16)}`;
}

/**
 * @param {{ locale?: string, sessionStartMs?: number }} [opts]
 */
export function buildInvitationStudyRecordV0(opts = {}) {
  const invite = readObserverInviteContextV0();
  const visitor = getVisitorEpistemicTraceV0();
  const observer = getObserverTraceSnapshotV0();
  const proof = buildEpistemicSeparationProofV0({ locale: opts.locale });
  const returnField = evaluateEpistemicReturnFieldV0(visitor);
  const path = visitor?.path || [];
  const mapEvents = (observer?.entries || []).filter((e) =>
    String(e.type || "").includes("map")
  ).length;

  const startMs =
    opts.sessionStartMs ||
    (typeof sessionStorage !== "undefined"
      ? Number(sessionStorage.getItem("rhizoh.session_start.v0")) || Date.now()
      : Date.now());
  try {
    if (typeof sessionStorage !== "undefined" && !sessionStorage.getItem("rhizoh.session_start.v0")) {
      sessionStorage.setItem("rhizoh.session_start.v0", String(startMs));
    }
  } catch {
    /* noop */
  }

  return Object.freeze({
    schema: INVITATION_STUDY_RECORD_SCHEMA_V0,
    recordId: simpleHashV0(`${invite?.cohortId || "none"}:${visitor?.sessions || 0}:${path.join(">")}`),
    cohortId: invite?.cohortId ?? null,
    perceptionMode: invite?.perceptionMode ?? visitor?.perceptionMode ?? null,
    inviteProceedAtMs: startMs,
    session: Object.freeze({
      durationMs: Math.max(0, Date.now() - startMs),
      returnWithin7d: (visitor?.sessions ?? 0) >= 2
    }),
    behaviors: Object.freeze({
      mapOpened: path.includes("map"),
      mapInteractionCount: mapEvents,
      castlePlacementAttempt: path.includes("castle"),
      observerChatTurns: path.includes("chat") ? 1 : 0,
      voiceSessionStarted: false
    }),
    epistemic: Object.freeze({
      coherence_alignment: visitor?.coherence_alignment ?? 0,
      return_vector: visitor?.return_vector ?? "none",
      familiarity: returnField?.familiarity ?? 0,
      recognition: returnField?.recognition ?? "none",
      separationHolds: proof.separationHolds === true
    }),
    interpretationOnly: true,
    nonExecutive: true,
    isMemory: false
  });
}

/**
 * @param {{ locale?: string }} [opts]
 */
export function exportInvitationStudyRecordV0(opts = {}) {
  const record = buildInvitationStudyRecordV0(opts);
  const json = JSON.stringify(record, null, 2);
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(json).then(() => ({ ok: true, record, method: "clipboard" }));
  }
  return Promise.resolve({ ok: true, record, method: "json", json });
}

export function mountInvitationStudyExportConsoleV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.invitationStudy = Object.freeze({
    build: buildInvitationStudyRecordV0,
    export: exportInvitationStudyRecordV0
  });
}
