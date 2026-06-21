/**
 * Observer invite landing v0 — token parse, URL build, session context (read-only).
 * @see docs/RHIZOH_OBSERVER_INVITE_LANDING_V0.md
 */

import {
  EPISTEMIC_STRESS_CLASS_V0,
  generateInvitePayloadV0
} from "./closedUserAdmissionEngineV0.js";
import { buildCausalMapLayerV0 } from "../runtime/rhizohCausalMapLayerV0.js";
import { projectIdentityManifestV0 } from "../runtime/identityManifestProjectionV0.js";

export const OBSERVER_INVITE_LANDING_SCHEMA_V0 = "castle.rhizoh.observer_invite_landing.v0";

export const OBSERVER_INVITE_ROLE_V0 = Object.freeze({
  OBSERVER: "observer",
  REVIEWER: "reviewer",
  INVESTOR: "investor"
});

const SESSION_KEY_V0 = "rhizoh_observer_invite_context_v0.1";
const PROCEED_EVENT_V0 = "rhizoh:invite-proceed-v0";

function pageOrigin() {
  if (typeof window === "undefined") return "https://rhizoh.com";
  return String(window.location?.origin || "https://rhizoh.com").replace(/\/+$/, "");
}

/**
 * @param {string} token
 */
export function parseObserverInviteTokenV0(token) {
  const raw = String(token || "").trim();
  if (!raw) return null;

  if (raw.startsWith("rhizoh_inv_")) {
    const body = raw.slice("rhizoh_inv_".length);
    const knownClasses = Object.values(EPISTEMIC_STRESS_CLASS_V0);
    let cohortId = "cohort_default";
    let stressClassTarget = EPISTEMIC_STRESS_CLASS_V0.SYSTEMS_ENGINEER;
    let seed = 0;

    for (const cls of knownClasses) {
      const needle = `_${cls}_`;
      const idx = body.indexOf(needle);
      if (idx >= 0) {
        cohortId = body.slice(0, idx) || "cohort_default";
        stressClassTarget = cls;
        seed = Number(body.slice(idx + needle.length)) || 0;
        break;
      }
    }

    let role = OBSERVER_INVITE_ROLE_V0.OBSERVER;
    if (stressClassTarget === EPISTEMIC_STRESS_CLASS_V0.HUMAN_EXPLORER) {
      role = OBSERVER_INVITE_ROLE_V0.REVIEWER;
    } else if (stressClassTarget === EPISTEMIC_STRESS_CLASS_V0.INVARIANT_KEEPER) {
      role = OBSERVER_INVITE_ROLE_V0.INVESTOR;
    }
    return Object.freeze({
      schema: OBSERVER_INVITE_LANDING_SCHEMA_V0,
      inviteToken: raw,
      cohortId,
      stressClassTarget,
      seed,
      role,
      legacyCohort: false,
      interpretationOnly: true,
      readOnly: true
    });
  }

  return Object.freeze({
    schema: OBSERVER_INVITE_LANDING_SCHEMA_V0,
    inviteToken: raw,
    cohortId: "review",
    reviewerId: raw,
    role: OBSERVER_INVITE_ROLE_V0.REVIEWER,
    legacyCohort: true,
    interpretationOnly: true,
    readOnly: true
  });
}

/**
 * @param {URLSearchParams | string} input
 */
export function parseObserverInviteFromSearchV0(input) {
  const params =
    input instanceof URLSearchParams
      ? input
      : new URLSearchParams(String(input || "").replace(/^\?/, ""));

  const token = String(params.get("invite") || params.get("token") || "").trim();
  if (token) return parseObserverInviteTokenV0(token);

  const cohort = String(params.get("cohort") || "").trim();
  const reviewer = String(params.get("reviewer") || "").trim();
  if (cohort === "review" && reviewer) {
    return parseObserverInviteTokenV0(reviewer);
  }

  return null;
}

/**
 * @param {{
 *   cohortId?: string,
 *   stressClassTarget?: string,
 *   seed?: number,
 *   reviewerId?: string,
 *   role?: string
 * }} [opts]
 */
export function buildObserverInviteUrlV0(opts = {}) {
  if (opts.reviewerId) {
    const u = new URL("/invite", pageOrigin());
    u.searchParams.set("cohort", "review");
    u.searchParams.set("reviewer", String(opts.reviewerId).trim().toLowerCase());
    return u.toString();
  }

  const payload = generateInvitePayloadV0({
    cohortId: opts.cohortId || "observer",
    stressClassTarget: opts.stressClassTarget || EPISTEMIC_STRESS_CLASS_V0.SYSTEMS_ENGINEER,
    seed: opts.seed ?? Date.now() % 100000
  });
  const u = new URL("/invite", pageOrigin());
  u.searchParams.set("invite", payload.inviteToken);
  if (opts.role) u.searchParams.set("role", String(opts.role));
  return u.toString();
}

/**
 * @param {ReturnType<typeof parseObserverInviteTokenV0>} invite
 */
export function persistObserverInviteContextV0(invite) {
  if (!invite || typeof sessionStorage === "undefined") return false;
  try {
    sessionStorage.setItem(SESSION_KEY_V0, JSON.stringify({ ...invite, storedAtMs: Date.now() }));
    if (typeof window !== "undefined") {
      window.__rhizoh = window.__rhizoh || {};
      window.__rhizoh.observerInvite = invite;
    }
    return true;
  } catch {
    return false;
  }
}

export function readObserverInviteContextV0() {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY_V0);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Causal nodes sorted by atMs — read-only timeline slice.
 * @param {object} [causalMap]
 * @param {number} [limit]
 */
export function buildCausalSnapshotTimelineV0(causalMap, limit = 24) {
  const map = causalMap || buildCausalMapLayerV0();
  const raw = map.causalMapRaw || map;
  const nodes = Array.isArray(raw.nodes) ? raw.nodes : [];
  const timeline = [...nodes]
    .sort((a, b) => (a.atMs || 0) - (b.atMs || 0))
    .slice(-limit)
    .map((n) =>
      Object.freeze({
        id: n.id,
        kind: n.kind,
        atMs: n.atMs ?? null,
        label: n.label ?? n.kind,
        domain: n.domain ?? null
      })
    );

  return Object.freeze({
    schema: "castle.rhizoh.causal_snapshot_timeline.v0",
    nodeCount: map.nodeCount ?? nodes.length,
    edgeCount: map.edgeCount ?? (map.edges?.length || 0),
    timeline: Object.freeze(timeline),
    readOnly: true,
    interpretationOnly: true
  });
}

/**
 * Full observer landing bundle — invite + manifest + causal timeline.
 * @param {ReturnType<typeof parseObserverInviteTokenV0>} [invite]
 */
export function buildObserverInviteLandingBundleV0(invite) {
  const causalMap = buildCausalMapLayerV0();
  const manifest = projectIdentityManifestV0({ causalMap });
  const causalTimeline = buildCausalSnapshotTimelineV0(causalMap);

  return Object.freeze({
    schema: OBSERVER_INVITE_LANDING_SCHEMA_V0,
    projectedAtMs: Date.now(),
    invite: invite ?? readObserverInviteContextV0(),
    manifest,
    causalTimeline,
    constitutionalSpine: "Observation ≠ Execution",
    interpretationOnly: true,
    readOnly: true,
    influencesExecution: false
  });
}

export function isObserverInvitePathV0(pathname) {
  const p = String(pathname || "").trim();
  return p === "/invite" || p.startsWith("/invite/");
}

export function dispatchObserverInviteProceedV0(detail = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(PROCEED_EVENT_V0, {
      detail: Object.freeze({ ...detail, atMs: Date.now() })
    })
  );
}

export function subscribeObserverInviteProceedV0(handler) {
  if (typeof window === "undefined") return () => {};
  const fn = (e) => handler(e.detail);
  window.addEventListener(PROCEED_EVENT_V0, fn);
  return () => window.removeEventListener(PROCEED_EVENT_V0, fn);
}

export const OBSERVER_INVITE_PROCEED_EVENT_V0 = PROCEED_EVENT_V0;
