/**
 * Cohort invite pack — Metehan (human observer) + Friday (prompt script runner).
 * Export: snapshot JSON, replay URL, Friday test script.
 */

import { captureWorldObservationSnapshotV0, buildSessionReplayInspectUrlV0 } from "../runtime/worldObservationObservabilityV0.js";
import { getWorldObservationIngressQueueSnapshotV0 } from "../runtime/worldObservationIngressQueueV0.js";

export const COHORT_INVITE_PACK_SCHEMA_V0 = "castle.rhizoh.cohort_invite_pack.v0";

export const COHORT_REVIEWER_SLOTS_V0 = Object.freeze({
  metehan: Object.freeze({
    id: "metehan",
    role: "human_observer",
    label: "Metehan",
    focus: ["screenshot", "live_session", "subjective_read"]
  }),
  friday: Object.freeze({
    id: "friday",
    role: "prompt_runner",
    label: "Friday",
    focus: ["event_log", "agent_response_trace", "map_interaction"]
  })
});

/** Friday cohort test script — observation targets per step. */
export const FRIDAY_PROMPT_SCRIPT_V0 = Object.freeze([
  Object.freeze({
    id: "friday_q1",
    order: 1,
    prompt: "Burada ne yapabilirsin?",
    observe: ["event_log", "agent_response", "continuity_strip"],
    passHint: "Rhizoh somut yetenek sınırı + davet tonu; boş slogan yok."
  }),
  Object.freeze({
    id: "friday_q2",
    order: 2,
    prompt: "Kendi alanını kur",
    observe: ["map_interaction", "world_reaction", "world_tick"],
    passHint: "Harita/komut hattı tepki verir; sessiz dünya kalmaz."
  }),
  Object.freeze({
    id: "friday_q3",
    order: 3,
    prompt: "Rhizoh sana nasıl tepki veriyor?",
    observe: ["agent_response_trace", "gateway_seq", "latency"],
    passHint: "traceId + nabız seq; kopukluk yok."
  })
]);

function pageOrigin() {
  if (typeof window === "undefined") return "https://rhizoh.com";
  return String(window.location?.origin || "https://rhizoh.com").replace(/\/+$/, "");
}

/**
 * @param {{ reviewerId?: string, cohort?: string }} [opts]
 */
export function buildCohortInviteUrlV0(opts = {}) {
  const reviewer = String(opts.reviewerId || "metehan").trim().toLowerCase();
  const cohort = String(opts.cohort || "review").trim();
  const u = new URL("/", pageOrigin());
  u.searchParams.set("cohort", cohort);
  u.searchParams.set("reviewer", reviewer);
  return u.toString();
}

function resolveReplayBand() {
  const q = getWorldObservationIngressQueueSnapshotV0();
  const toSeq = q.lastAcceptedSeq;
  if (typeof toSeq !== "number" || !Number.isFinite(toSeq) || toSeq <= 0) {
    return { fromSeq: null, toSeq: null, replayUrl: "" };
  }
  const fromSeq = Math.max(1, toSeq - 32);
  return {
    fromSeq,
    toSeq,
    replayUrl: buildSessionReplayInspectUrlV0(fromSeq, toSeq)
  };
}

/**
 * @param {{ reviewerId?: string, label?: string, sessionNotes?: string, extra?: Record<string, unknown> }} [opts]
 */
export function buildCohortInvitePackV0(opts = {}) {
  const reviewerId = String(opts.reviewerId || "metehan").trim().toLowerCase();
  const reviewer =
    COHORT_REVIEWER_SLOTS_V0[reviewerId] ||
    Object.freeze({ id: reviewerId, role: "reviewer", label: opts.label || reviewerId });

  const snapshot = captureWorldObservationSnapshotV0({
    cohortReviewer: reviewer.id,
    sessionNotes: opts.sessionNotes ? String(opts.sessionNotes).slice(0, 512) : undefined,
    ...(opts.extra || {})
  });

  const replay = resolveReplayBand();

  return Object.freeze({
    schema: COHORT_INVITE_PACK_SCHEMA_V0,
    exportedAtMs: Date.now(),
    inviteUrl: buildCohortInviteUrlV0({ reviewerId: reviewer.id }),
    reviewer,
    fridayScript: FRIDAY_PROMPT_SCRIPT_V0,
    snapshot,
    replay: Object.freeze({
      fromSeq: replay.fromSeq,
      toSeq: replay.toSeq,
      url: replay.replayUrl
    }),
    outputsExpected: Object.freeze([
      "event_log",
      "agent_response_trace",
      "map_interaction_record",
      "screenshot_optional"
    ])
  });
}

/**
 * @param {ReturnType<typeof buildCohortInvitePackV0>} pack
 */
export function serializeCohortInvitePackV0(pack) {
  return JSON.stringify(pack, null, 2);
}

/**
 * @param {ReturnType<typeof buildCohortInvitePackV0>} pack
 * @returns {Promise<{ ok: boolean, method?: string }>}
 */
export async function exportCohortInvitePackV0(pack) {
  const json = serializeCohortInvitePackV0(pack);
  const filename = `rhizoh-cohort-${pack.reviewer?.id || "review"}-${pack.exportedAtMs}.json`;

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(json);
      return { ok: true, method: "clipboard" };
    } catch {
      /* fall through */
    }
  }

  if (typeof document !== "undefined") {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return { ok: true, method: "download" };
  }

  return { ok: false };
}

export function isCohortReviewSessionV0() {
  if (typeof window === "undefined") return false;
  try {
    if (import.meta.env?.VITE_RHIZOH_COHORT_INSPECT === "1") return true;
    const q = new URLSearchParams(window.location.search);
    return q.get("cohort") === "review" || q.get("cohort") === "metehan-friday";
  } catch {
    return false;
  }
}

export function getActiveCohortReviewerFromUrlV0() {
  if (typeof window === "undefined") return null;
  try {
    const q = new URLSearchParams(window.location.search);
    const r = String(q.get("reviewer") || "").trim().toLowerCase();
    return r || null;
  } catch {
    return null;
  }
}
