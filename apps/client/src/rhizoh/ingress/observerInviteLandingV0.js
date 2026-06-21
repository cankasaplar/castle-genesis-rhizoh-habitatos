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
import { resolveInvitePerceptionLensV0 } from "./observerInvitePerceptionLensV0.js";
import { OBSERVER_INVITE_ROLE_V0 } from "./observerInviteRolesV0.js";

export { OBSERVER_INVITE_ROLE_V0 };

export const OBSERVER_INVITE_LANDING_SCHEMA_V0 = "castle.rhizoh.observer_invite_landing.v0";

const SESSION_KEY_V0 = "rhizoh_observer_invite_context_v0.1";
export const OBSERVER_INVITE_SKIP_MEDIA_KEY_V0 = "rhizoh_observer_invite_skip_media_v0";
export const OBSERVER_INVITE_LAND_HOME_KEY_V0 = "rhizoh_observer_invite_land_home_v0";
const PROCEED_EVENT_V0 = "rhizoh:invite-proceed-v0";

/** Invite landing supports TR + EN only (product cohort). */
export const OBSERVER_INVITE_LANDING_LOCALES_V0 = Object.freeze(["en", "tr"]);

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
 * @param {string} [code]
 * @returns {"en"|"tr"|null}
 */
export function normalizeObserverInviteLangV0(code) {
  const c = String(code || "").toLowerCase().slice(0, 2);
  return OBSERVER_INVITE_LANDING_LOCALES_V0.includes(c) ? c : null;
}

/**
 * @param {URLSearchParams | string} input
 */
export function parseObserverInviteFromSearchV0(input) {
  const params =
    input instanceof URLSearchParams
      ? input
      : new URLSearchParams(String(input || "").replace(/^\?/, ""));

  const token = String(params.get("invite") || params.get("token") || params.get("k") || "").trim();
  if (token) return parseObserverInviteTokenV0(token);

  const cohort = String(params.get("cohort") || "").trim();
  const reviewer = String(params.get("reviewer") || "").trim();
  if (cohort === "review" && reviewer) {
    return parseObserverInviteTokenV0(reviewer);
  }

  return null;
}

/**
 * Deterministic seed for legacy reviewer ids (opaque URL generation).
 * @param {string} reviewerId
 */
export function reviewerIdToInviteSeedV0(reviewerId) {
  const raw = String(reviewerId || "").trim().toLowerCase();
  if (!raw) return 42;
  let h = 0;
  for (let i = 0; i < raw.length; i += 1) {
    h = (h * 31 + raw.charCodeAt(i)) % 100000;
  }
  return h || 42;
}

/**
 * @param {{
 *   cohortId?: string,
 *   stressClassTarget?: string,
 *   seed?: number,
 *   inviteToken?: string,
 *   lang?: string
 * }} [opts]
 */
export function buildObserverInviteUrlV0(opts = {}) {
  const payload =
    opts.inviteToken != null
      ? Object.freeze({ inviteToken: String(opts.inviteToken).trim() })
      : generateInvitePayloadV0({
          cohortId: opts.cohortId || "observer",
          stressClassTarget: opts.stressClassTarget || EPISTEMIC_STRESS_CLASS_V0.SYSTEMS_ENGINEER,
          seed: opts.seed ?? Date.now() % 100000
        });
  const u = new URL("/invite", pageOrigin());
  u.searchParams.set("invite", payload.inviteToken);
  const lang = normalizeObserverInviteLangV0(opts.lang);
  if (lang) u.searchParams.set("lang", lang);
  return u.toString();
}

export function markObserverInviteSkipAutoMediaV0() {
  if (typeof sessionStorage === "undefined") return false;
  try {
    sessionStorage.setItem(OBSERVER_INVITE_SKIP_MEDIA_KEY_V0, "1");
    return true;
  } catch {
    return false;
  }
}

export function shouldObserverInviteSkipAutoMediaV0() {
  if (typeof sessionStorage === "undefined") return false;
  try {
    return sessionStorage.getItem(OBSERVER_INVITE_SKIP_MEDIA_KEY_V0) === "1";
  } catch {
    return false;
  }
}

export function clearObserverInviteSkipAutoMediaV0() {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(OBSERVER_INVITE_SKIP_MEDIA_KEY_V0);
  } catch {
    /* noop */
  }
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
 * @param {string} [locale]
 */
export function buildObserverInviteLandingBundleV0(invite, locale = "en") {
  const causalMap = buildCausalMapLayerV0();
  const manifest = projectIdentityManifestV0({ causalMap });
  const causalTimeline = buildCausalSnapshotTimelineV0(causalMap);
  const role = invite?.role || "observer";
  const loc = normalizeObserverInviteLangV0(locale) || "en";
  const perceptionLens = resolveInvitePerceptionLensV0(role, loc);

  return Object.freeze({
    schema: OBSERVER_INVITE_LANDING_SCHEMA_V0,
    projectedAtMs: Date.now(),
    invite: invite ?? readObserverInviteContextV0(),
    perceptionLens,
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

export function markObserverInviteLandHomeV0() {
  if (typeof sessionStorage === "undefined") return false;
  try {
    sessionStorage.setItem(OBSERVER_INVITE_LAND_HOME_KEY_V0, "1");
    return true;
  } catch {
    return false;
  }
}

export function shouldObserverInviteLandHomeV0() {
  if (typeof sessionStorage === "undefined") return false;
  try {
    return sessionStorage.getItem(OBSERVER_INVITE_LAND_HOME_KEY_V0) === "1";
  } catch {
    return false;
  }
}

export function clearObserverInviteLandHomeV0() {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(OBSERVER_INVITE_LAND_HOME_KEY_V0);
  } catch {
    /* noop */
  }
}

export function dispatchObserverInviteProceedV0(detail = {}) {
  if (typeof window === "undefined") return;
  markObserverInviteSkipAutoMediaV0();
  markObserverInviteLandHomeV0();
  window.dispatchEvent(
    new CustomEvent(PROCEED_EVENT_V0, {
      detail: Object.freeze({ ...detail, atMs: Date.now(), skipAutoMedia: true })
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
