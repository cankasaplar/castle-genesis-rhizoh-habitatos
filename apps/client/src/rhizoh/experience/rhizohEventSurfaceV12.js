/**
 * Rhizoh Event Surface V1.2 — shared experience container (create · invite · join).
 * Presentation + local continuity only — no WAL, no execution graph.
 * @see docs/RHIZOH_SOFT_OPEN_PROD_PLAN_V1.md §7
 * @see docs/EVENT_SYSTEM_V1.md
 */

import { buildEventInstanceV0 } from "../../castleSocial/castleEventInstanceV0.js";
import {
  buildEventAxisV0,
  EVENT_MODALITY_AXIS_V0,
  EVENT_TEMPORAL_AXIS_V0,
  EVENT_SPACE_AXIS_V0,
  EVENT_PARTICIPATION_AXIS_V0
} from "../../castleSocial/castleEventAxisV0.js";
import { SESSION_LIFECYCLE_V0 } from "../../castleSocial/castleSessionLifecycleV0.js";
import {
  patchRhizohExperienceSessionContextV0,
  saveRhizohExperienceSessionContextV0
} from "./rhizohExperienceSessionContextV0.js";
import {
  buildRhizohEventInviteLinkWithSyncV1,
  propagateEventCatalogV1
} from "./rhizohEventCatalogSyncV1.js";

export const RHIZOH_EVENT_SURFACE_SCHEMA_V12 = "castle.rhizoh_event_surface.v12";

export const RHIZOH_EVENT_SURFACE_FOCUS_EVENT_V12 = "rhizoh:event-surface-focus-v12";

export const RHIZOH_EVENT_TYPE_V12 = Object.freeze({
  LIVE: "live",
  SCHEDULED: "scheduled",
  VISIT: "visit",
  CONCERT: "concert"
});

export const RHIZOH_EVENT_VISIBILITY_V12 = Object.freeze({
  INVITE_ONLY: "invite_only"
});

const LS_EVENTS_KEY_V12 = "rhizoh.events.surface.v12";

/**
 * @returns {string}
 */
function newEventIdV12() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return `evt_${crypto.randomUUID().slice(0, 8)}`;
    }
  } catch {
    /* noop */
  }
  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * @returns {string}
 */
function newInviteTokenV12() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    }
  } catch {
    /* noop */
  }
  return Math.random().toString(36).slice(2, 18);
}

/**
 * @param {string} productSessionId
 */
export function deriveHostCastleIdV12(productSessionId) {
  const raw = String(productSessionId || "guest").replace(/[^a-zA-Z0-9]/g, "");
  return `castle_${raw.slice(0, 16) || "guest"}`;
}

/**
 * @param {string} type
 */
export function mapEventTypeToAxisV12(type) {
  const t = String(type || "").toLowerCase();
  if (t === RHIZOH_EVENT_TYPE_V12.LIVE) {
    return buildEventAxisV0({
      participation: EVENT_PARTICIPATION_AXIS_V0.MULTI,
      temporal: EVENT_TEMPORAL_AXIS_V0.LIVE,
      modality: EVENT_MODALITY_AXIS_V0.VOICE,
      space: EVENT_SPACE_AXIS_V0.SHARED
    });
  }
  if (t === RHIZOH_EVENT_TYPE_V12.SCHEDULED) {
    return buildEventAxisV0({
      participation: EVENT_PARTICIPATION_AXIS_V0.MULTI,
      temporal: EVENT_TEMPORAL_AXIS_V0.PLANNED,
      modality: EVENT_MODALITY_AXIS_V0.CONCERT,
      space: EVENT_SPACE_AXIS_V0.SHARED
    });
  }
  if (t === RHIZOH_EVENT_TYPE_V12.VISIT) {
    return buildEventAxisV0({
      participation: EVENT_PARTICIPATION_AXIS_V0.DUO,
      temporal: EVENT_TEMPORAL_AXIS_V0.LIVE,
      modality: EVENT_MODALITY_AXIS_V0.VISIT,
      space: EVENT_SPACE_AXIS_V0.REMOTE
    });
  }
  if (t === RHIZOH_EVENT_TYPE_V12.CONCERT) {
    return buildEventAxisV0({
      participation: EVENT_PARTICIPATION_AXIS_V0.MULTI,
      temporal: EVENT_TEMPORAL_AXIS_V0.LIVE,
      modality: EVENT_MODALITY_AXIS_V0.CONCERT,
      space: EVENT_SPACE_AXIS_V0.SHARED
    });
  }
  return buildEventAxisV0();
}

/**
 * @param {string} type
 */
export function mapEventTypeToLifecycleV12(type) {
  const t = String(type || "").toLowerCase();
  if (
    t === RHIZOH_EVENT_TYPE_V12.LIVE ||
    t === RHIZOH_EVENT_TYPE_V12.VISIT ||
    t === RHIZOH_EVENT_TYPE_V12.CONCERT
  ) {
    return SESSION_LIFECYCLE_V0.LIVE;
  }
  if (t === RHIZOH_EVENT_TYPE_V12.SCHEDULED) {
    return SESSION_LIFECYCLE_V0.SCHEDULED;
  }
  return SESSION_LIFECYCLE_V0.DRAFT;
}

/**
 * @param {string} eventId
 * @param {string} inviteToken
 * @param {string} [origin]
 */
export function buildRhizohEventInviteLinkV12(eventId, inviteToken, origin = "") {
  let base = "https://rhizoh.com";
  if (origin) {
    base = String(origin).replace(/\/+$/, "");
  } else if (typeof window !== "undefined" && window.location?.origin) {
    base = String(window.location.origin).replace(/\/+$/, "");
  }
  const u = new URL("/", base);
  u.searchParams.set("event", String(eventId || "").trim());
  const tok = String(inviteToken || "").trim();
  if (tok) u.searchParams.set("invite", tok);
  return u.toString();
}

/**
 * @param {Record<string, unknown>} record
 */
function normalizeEventRecordV12(record) {
  if (!record || typeof record !== "object") return null;
  const eventId = String(record.eventId || "").trim();
  if (!eventId) return null;
  return Object.freeze({
    schema: RHIZOH_EVENT_SURFACE_SCHEMA_V12,
    eventId,
    title: String(record.title || "Untitled experience").slice(0, 120),
    type: String(record.type || RHIZOH_EVENT_TYPE_V12.SCHEDULED).toLowerCase(),
    visibility: String(record.visibility || RHIZOH_EVENT_VISIBILITY_V12.INVITE_ONLY),
    lifecycle: String(record.lifecycle || SESSION_LIFECYCLE_V0.SCHEDULED),
    inviteToken: String(record.inviteToken || ""),
    inviteLink: String(record.inviteLink || ""),
    experienceSessionId: record.experienceSessionId ? String(record.experienceSessionId) : null,
    hostCastleId: record.hostCastleId ? String(record.hostCastleId) : null,
    sessionId: record.sessionId ? String(record.sessionId) : null,
    createdAtMs: Number(record.createdAtMs) || Date.now(),
    updatedAtMs: Number(record.updatedAtMs) || Date.now(),
    readOnly: true
  });
}

/**
 * @returns {ReturnType<typeof normalizeEventRecordV12>[]}
 */
function readEventCatalogV12() {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(window.localStorage.getItem(LS_EVENTS_KEY_V12) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.map(normalizeEventRecordV12).filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * @param {ReturnType<typeof normalizeEventRecordV12>[]} catalog
 */
function writeEventCatalogV12(catalog) {
  if (typeof window === "undefined") return catalog;
  try {
    window.localStorage.setItem(LS_EVENTS_KEY_V12, JSON.stringify(catalog.slice(-48)));
  } catch {
    /* noop */
  }
  return catalog;
}

/**
 * @param {string} eventId
 */
export function loadRhizohEventRecordV12(eventId) {
  const id = String(eventId || "").trim();
  if (!id) return null;
  return readEventCatalogV12().find((e) => e.eventId === id) || null;
}

/**
 * @param {ReturnType<typeof normalizeEventRecordV12>} record
 */
export function saveRhizohEventRecordV12(record) {
  const normalized = normalizeEventRecordV12(record);
  if (!normalized) return null;
  const catalog = readEventCatalogV12().filter((e) => e.eventId !== normalized.eventId);
  catalog.push(normalized);
  writeEventCatalogV12(catalog);
  publishRhizohEventSurfaceV12(normalized);
  return normalized;
}

/**
 * @param {{
 *   title?: string,
 *   type?: string,
 *   experienceSessionId?: string | null,
 *   hostCastleId?: string | null,
 *   productSessionId?: string | null,
 *   visibility?: string
 * }} input
 */
export function createRhizohEventV12(input = {}) {
  const title = String(input.title || "").trim().slice(0, 120) || "Shared experience";
  const type = String(input.type || RHIZOH_EVENT_TYPE_V12.SCHEDULED).toLowerCase();
  const experienceSessionId = input.experienceSessionId
    ? String(input.experienceSessionId)
    : null;
  const hostCastleId =
    String(input.hostCastleId || "").trim() ||
    deriveHostCastleIdV12(input.productSessionId || experienceSessionId || "guest");
  const lifecycle = mapEventTypeToLifecycleV12(type);
  const axis = mapEventTypeToAxisV12(type);
  const eventId = newEventIdV12();
  const inviteToken = newInviteTokenV12();
  const atMs = Date.now();

  const instance = buildEventInstanceV0({
    eventId,
    hostCastleId,
    lifecycle,
    axis,
    sessionId: experienceSessionId ? `sess_${experienceSessionId.replace(/^exp_/, "")}` : `sess_${eventId}`,
    spatialBinding:
      lifecycle === SESSION_LIFECYCLE_V0.LIVE
        ? {
            cesiumSessionId: `cesium_${eventId}`,
            octoSessionId: type === RHIZOH_EVENT_TYPE_V12.CONCERT ? `octo_${eventId}` : null,
            presentationLensId: "habitat_lens_world"
          }
        : undefined
  });

  if (!instance.ok) {
    return Object.freeze({ ok: false, reason: instance.reason || "event_instance_failed" });
  }

  /** @type {ReturnType<typeof normalizeEventRecordV12>} */
  const record = Object.freeze({
    schema: RHIZOH_EVENT_SURFACE_SCHEMA_V12,
    eventId,
    title,
    type,
    visibility: String(input.visibility || RHIZOH_EVENT_VISIBILITY_V12.INVITE_ONLY),
    lifecycle,
    inviteToken,
    inviteLink: "",
    experienceSessionId,
    hostCastleId,
    sessionId: instance.session.sessionId,
    createdAtMs: atMs,
    updatedAtMs: atMs,
    readOnly: true
  });

  saveRhizohEventRecordV12(record);
  const inviteLink = buildRhizohEventInviteLinkWithSyncV1(record);
  const recordWithLink = saveRhizohEventRecordV12({ ...record, inviteLink, updatedAtMs: atMs });

  return Object.freeze({
    ok: true,
    eventId,
    inviteToken,
    inviteLink,
    record: recordWithLink,
    instance,
    sessionBinding: Object.freeze({
      experienceSessionId,
      eventId,
      sessionId: instance.session.sessionId,
      lifecycle,
      hostCastleId
    })
  });
}

/**
 * Host-side async propagation — call after create when auth uid is known.
 * @param {ReturnType<typeof loadRhizohEventRecordV12>} record
 * @param {{ uid?: string | null }} [auth]
 */
export async function propagateRhizohEventCatalogV12(record, auth = {}) {
  return propagateEventCatalogV1(record, auth);
}

/**
 * @param {{ eventId?: string | null }} experienceContext
 */
export function resolveActiveEventInviteShareV12(experienceContext) {
  const eventId = experienceContext?.eventId ? String(experienceContext.eventId) : "";
  if (!eventId) return null;
  const record = loadRhizohEventRecordV12(eventId);
  if (!record) return null;
  const inviteLink = buildRhizohEventInviteLinkWithSyncV1(record);
  return Object.freeze({ record, inviteLink });
}

/**
 * Merge event into continuous experience session (no new shell).
 * @param {ReturnType<typeof loadRhizohExperienceSessionContextV0>} experienceContext
 * @param {ReturnType<typeof normalizeEventRecordV12>} eventRecord
 */
export function attachRhizohEventToExperienceSessionV12(experienceContext, eventRecord) {
  if (!experienceContext || !eventRecord) return experienceContext;
  const next = patchRhizohExperienceSessionContextV0(experienceContext, {
    eventId: eventRecord.eventId,
    eventLifecycle: eventRecord.lifecycle,
    inviteToken: eventRecord.inviteToken,
    lastTransition: "event_create"
  });
  return saveRhizohExperienceSessionContextV0(next);
}

/**
 * Join path — restore event context from catalog + URL params.
 */
export function joinRhizohEventIntoExperienceSessionV12(
  experienceContext,
  eventId,
  inviteToken = null
) {
  if (!experienceContext || !eventId) return experienceContext;
  const record = loadRhizohEventRecordV12(eventId);
  const next = patchRhizohExperienceSessionContextV0(experienceContext, {
    eventId: String(eventId),
    eventLifecycle: record?.lifecycle || SESSION_LIFECYCLE_V0.SCHEDULED,
    inviteToken: inviteToken || record?.inviteToken || null,
    lastTransition: "invite_join"
  });
  return saveRhizohExperienceSessionContextV0(next);
}

/**
 * @param {ReturnType<typeof normalizeEventRecordV12>} record
 */
export function publishRhizohEventSurfaceV12(record) {
  if (typeof window !== "undefined") {
    window.__RHIZOH_EVENT_SURFACE__ = Object.freeze({
      schema: RHIZOH_EVENT_SURFACE_SCHEMA_V12,
      readOnly: true,
      last: record,
      catalogCount: readEventCatalogV12().length,
      atMs: record?.updatedAtMs ?? Date.now()
    });
  }
  return record;
}

/**
 * Cap wheel / drawer — signal create flow focus without routing.
 */
export function emitRhizohEventSurfaceFocusV12(detail = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(RHIZOH_EVENT_SURFACE_FOCUS_EVENT_V12, {
      detail: Object.freeze({
        mode: String(detail.mode || "create"),
        atMs: Date.now()
      })
    })
  );
}

/** @internal vitest */
export function __resetRhizohEventSurfaceForTestV12() {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LS_EVENTS_KEY_V12);
      delete window.__RHIZOH_EVENT_SURFACE__;
    }
  } catch {
    /* noop */
  }
}
