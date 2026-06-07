/**
 * Rhizoh T0 continuous experience session — single memory across chat · voice · map · event.
 * Presentation + continuity only — no execution graph, no routing authority.
 * @see docs/RHIZOH_SOFT_OPEN_PROD_PLAN_V1.md
 */

import { loadRhizohProductSession } from "../product/rhizohProductSessionPersistenceV1.js";
import { RHIZOH_PRODUCT_BINDING_EVENT_V0 } from "../runtime/rhizohProductBindingV0.js";
import { normalizeSessionLifecycleV0 } from "../../castleSocial/castleSessionLifecycleV0.js";
import { loadRhizohEventRecordV12 } from "./rhizohEventSurfaceV12.js";
import { hydrateEventCatalogFromJoinV1, parseEventJoinBundleV1 } from "./rhizohEventCatalogSyncV1.js";

export const RHIZOH_EXPERIENCE_SESSION_CONTEXT_SCHEMA_V0 =
  "castle.rhizoh_experience_session_context.v0";

const LS_KEY_V0 = "rhizoh.experience.session_context.v0";

/**
 * @returns {string}
 */
function newExperienceSessionIdV0() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return `exp_${crypto.randomUUID()}`;
    }
  } catch {
    /* noop */
  }
  return `exp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * @returns {ReturnType<typeof buildRhizohExperienceSessionContextV0>}
 */
export function createInitialRhizohExperienceSessionContextV0() {
  const atMs = Date.now();
  const product = loadRhizohProductSession();
  return buildRhizohExperienceSessionContextV0({
    experienceSessionId: newExperienceSessionIdV0(),
    productSessionId: product.sessionId,
    persistenceEpoch: 1,
    createdAtMs: atMs,
    updatedAtMs: atMs
  });
}

/**
 * @param {Record<string, unknown>} raw
 */
function normalizeExperienceSessionContextV0(raw) {
  if (!raw || typeof raw !== "object") return null;
  const experienceSessionId =
    String(raw.experienceSessionId || "").trim() || newExperienceSessionIdV0();
  return buildRhizohExperienceSessionContextV0({
    experienceSessionId,
    productSessionId: raw.productSessionId ? String(raw.productSessionId) : null,
    persistenceEpoch: Math.max(1, Math.floor(Number(raw.persistenceEpoch) || 1)),
    productSurface: raw.productSurface ? String(raw.productSurface) : "world",
    fieldState: raw.fieldState ? String(raw.fieldState) : "IDLE",
    habitatFocusMode: raw.habitatFocusMode ? String(raw.habitatFocusMode) : null,
    voiceActive: raw.voiceActive === true,
    mapSurfaceActive: raw.mapSurfaceActive === true,
    worldMapTool: raw.worldMapTool ? String(raw.worldMapTool) : null,
    realityMode: raw.realityMode ? String(raw.realityMode) : null,
    eventId: raw.eventId ? String(raw.eventId) : null,
    eventLifecycle: raw.eventLifecycle ? normalizeSessionLifecycleV0(raw.eventLifecycle) : null,
    inviteToken: raw.inviteToken ? String(raw.inviteToken) : null,
    lastCapWheelAction: raw.lastCapWheelAction ? String(raw.lastCapWheelAction) : null,
    lastCapWheelNode: raw.lastCapWheelNode ? String(raw.lastCapWheelNode) : null,
    lastTransition: raw.lastTransition ? String(raw.lastTransition) : null,
    createdAtMs: Number(raw.createdAtMs) || Date.now(),
    updatedAtMs: Number(raw.updatedAtMs) || Date.now()
  });
}

/**
 * @param {Record<string, unknown>} input
 */
export function buildRhizohExperienceSessionContextV0(input = {}) {
  const atMs = Number(input.updatedAtMs) || Number(input.createdAtMs) || Date.now();
  return Object.freeze({
    schema: RHIZOH_EXPERIENCE_SESSION_CONTEXT_SCHEMA_V0,
    experienceSessionId: String(input.experienceSessionId || newExperienceSessionIdV0()),
    productSessionId: input.productSessionId ? String(input.productSessionId) : null,
    persistenceEpoch: Math.max(1, Math.floor(Number(input.persistenceEpoch) || 1)),
    productSurface: String(input.productSurface || "world"),
    fieldState: String(input.fieldState || "IDLE"),
    habitatFocusMode: input.habitatFocusMode ? String(input.habitatFocusMode) : null,
    voiceActive: input.voiceActive === true,
    mapSurfaceActive: input.mapSurfaceActive === true,
    worldMapTool: input.worldMapTool ? String(input.worldMapTool) : null,
    realityMode: input.realityMode ? String(input.realityMode) : null,
    eventId: input.eventId ? String(input.eventId) : null,
    eventLifecycle: input.eventLifecycle
      ? normalizeSessionLifecycleV0(input.eventLifecycle)
      : null,
    inviteToken: input.inviteToken ? String(input.inviteToken) : null,
    lastCapWheelAction: input.lastCapWheelAction ? String(input.lastCapWheelAction) : null,
    lastCapWheelNode: input.lastCapWheelNode ? String(input.lastCapWheelNode) : null,
    lastTransition: input.lastTransition ? String(input.lastTransition) : null,
    createdAtMs: Number(input.createdAtMs) || atMs,
    updatedAtMs: atMs,
    readOnly: true
  });
}

/**
 * @param {{
 *   productSurface?: string,
 *   fieldState?: string,
 *   habitatFocusMode?: string | null,
 *   voiceActive?: boolean,
 *   mapSurfaceActive?: boolean,
 *   worldMapTool?: string | null,
 *   realityMode?: string | null,
 *   eventId?: string | null,
 *   eventLifecycle?: string | null,
 *   inviteToken?: string | null,
 *   productSessionId?: string | null,
 *   lastCapWheelAction?: string | null,
 *   lastCapWheelNode?: string | null,
 *   lastTransition?: string | null
 * } | null | undefined} snapshot
 */
export function digestExperienceSessionSnapshotV0(snapshot) {
  return JSON.stringify({
    productSurface: snapshot?.productSurface,
    fieldState: snapshot?.fieldState,
    habitatFocusMode: snapshot?.habitatFocusMode,
    voiceActive: snapshot?.voiceActive,
    mapSurfaceActive: snapshot?.mapSurfaceActive,
    worldMapTool: snapshot?.worldMapTool,
    realityMode: snapshot?.realityMode,
    eventId: snapshot?.eventId,
    eventLifecycle: snapshot?.eventLifecycle,
    inviteToken: snapshot?.inviteToken,
    productSessionId: snapshot?.productSessionId,
    lastCapWheelAction: snapshot?.lastCapWheelAction,
    lastCapWheelNode: snapshot?.lastCapWheelNode,
    lastTransition: snapshot?.lastTransition
  });
}

/**
 * Infer transition label for continuity (observational).
 * @param {ReturnType<typeof buildRhizohExperienceSessionContextV0>} prev
 * @param {ReturnType<typeof digestExperienceSessionSnapshotV0>} nextSnap
 */
function inferExperienceTransitionV0(prev, nextSnap) {
  const next = JSON.parse(nextSnap);
  if (prev.voiceActive !== true && next.voiceActive === true) return "chat_to_voice";
  if (prev.voiceActive === true && next.voiceActive !== true) return "voice_to_chat";
  if (prev.mapSurfaceActive !== true && next.mapSurfaceActive === true) return "surface_to_map";
  if (prev.productSurface !== next.productSurface) return `surface_${prev.productSurface}_to_${next.productSurface}`;
  if (prev.eventId !== next.eventId && next.eventId) return "enter_event";
  return prev.lastTransition;
}

/**
 * @param {ReturnType<typeof buildRhizohExperienceSessionContextV0>} prev
 * @param {Parameters<typeof digestExperienceSessionSnapshotV0>[0]} patch
 */
export function patchRhizohExperienceSessionContextV0(prev, patch = {}) {
  const base = prev || createInitialRhizohExperienceSessionContextV0();
  const mergedSnap = {
    productSurface: patch?.productSurface ?? base.productSurface,
    fieldState: patch?.fieldState ?? base.fieldState,
    habitatFocusMode:
      patch?.habitatFocusMode !== undefined ? patch.habitatFocusMode : base.habitatFocusMode,
    voiceActive: patch?.voiceActive ?? base.voiceActive,
    mapSurfaceActive: patch?.mapSurfaceActive ?? base.mapSurfaceActive,
    worldMapTool: patch?.worldMapTool !== undefined ? patch.worldMapTool : base.worldMapTool,
    realityMode: patch?.realityMode !== undefined ? patch.realityMode : base.realityMode,
    eventId: patch?.eventId !== undefined ? patch.eventId : base.eventId,
    eventLifecycle:
      patch?.eventLifecycle !== undefined ? patch.eventLifecycle : base.eventLifecycle,
    inviteToken: patch?.inviteToken !== undefined ? patch.inviteToken : base.inviteToken,
    productSessionId:
      patch?.productSessionId || base.productSessionId || loadRhizohProductSession().sessionId,
    lastCapWheelAction:
      patch?.lastCapWheelAction !== undefined ? patch.lastCapWheelAction : base.lastCapWheelAction,
    lastCapWheelNode:
      patch?.lastCapWheelNode !== undefined ? patch.lastCapWheelNode : base.lastCapWheelNode,
    lastTransition: patch?.lastTransition ?? base.lastTransition
  };
  const digest = digestExperienceSessionSnapshotV0(mergedSnap);
  const lastTransition =
    patch?.lastTransition !== undefined && patch.lastTransition !== null
      ? String(patch.lastTransition)
      : inferExperienceTransitionV0(base, digest);
  const productSessionId = mergedSnap.productSessionId;

  return buildRhizohExperienceSessionContextV0({
    experienceSessionId: base.experienceSessionId,
    productSessionId,
    persistenceEpoch: base.persistenceEpoch,
    productSurface: mergedSnap.productSurface,
    fieldState: mergedSnap.fieldState,
    habitatFocusMode: mergedSnap.habitatFocusMode,
    voiceActive: mergedSnap.voiceActive,
    mapSurfaceActive: mergedSnap.mapSurfaceActive,
    worldMapTool: mergedSnap.worldMapTool,
    realityMode: mergedSnap.realityMode,
    eventId: mergedSnap.eventId,
    eventLifecycle: mergedSnap.eventLifecycle,
    inviteToken: mergedSnap.inviteToken,
    lastCapWheelAction: mergedSnap.lastCapWheelAction,
    lastCapWheelNode: mergedSnap.lastCapWheelNode,
    lastTransition,
    createdAtMs: base.createdAtMs,
    updatedAtMs: Date.now()
  });
}

/**
 * @param {string} [search]
 */
export function parseExperienceJoinParamsV0(search = "") {
  if (typeof window !== "undefined" && !search) {
    search = window.location.search || "";
  }
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const inviteToken = params.get("invite") || params.get("inviteToken") || null;
  const eventId = params.get("event") || params.get("eventId") || null;
  return Object.freeze({
    inviteToken: inviteToken ? String(inviteToken) : null,
    eventId: eventId ? String(eventId) : null
  });
}

/**
 * @param {ReturnType<typeof buildRhizohExperienceSessionContextV0>} context
 */
export function applyExperienceJoinParamsV0(context, joinParams) {
  if (!joinParams?.inviteToken && !joinParams?.eventId) return context;
  if (joinParams.eventId) {
    const record = loadRhizohEventRecordV12(joinParams.eventId);
    return patchRhizohExperienceSessionContextV0(context, {
      eventId: String(joinParams.eventId),
      eventLifecycle: record?.lifecycle || "SCHEDULED",
      inviteToken: joinParams.inviteToken || record?.inviteToken || null,
      lastTransition: "invite_join"
    });
  }
  return patchRhizohExperienceSessionContextV0(context, {
    inviteToken: joinParams.inviteToken,
    lastTransition: "invite_link"
  });
}

/**
 * @param {ReturnType<typeof buildRhizohExperienceSessionContextV0>} context
 */
export function saveRhizohExperienceSessionContextV0(context) {
  const next = buildRhizohExperienceSessionContextV0({
    ...context,
    updatedAtMs: Date.now()
  });
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LS_KEY_V0, JSON.stringify(next));
    }
  } catch {
    /* noop */
  }
  return next;
}

/**
 * @returns {ReturnType<typeof buildRhizohExperienceSessionContextV0>}
 */
export function loadRhizohExperienceSessionContextV0() {
  if (typeof window !== "undefined") {
    hydrateEventCatalogFromJoinV1(window.location.search || "");
  }
  /** @type {unknown} */
  let raw = null;
  try {
    if (typeof window !== "undefined") {
      raw = JSON.parse(window.localStorage.getItem(LS_KEY_V0) || "null");
    }
  } catch {
    raw = null;
  }
  const normalized = normalizeExperienceSessionContextV0(raw);
  const join = parseEventJoinBundleV1();
  if (normalized) {
    if ((join.inviteToken || join.eventId) && !normalized.eventId && !normalized.inviteToken) {
      return applyExperienceJoinParamsV0(normalized, join);
    }
    if (join.eventId && normalized.eventId !== join.eventId) {
      return applyExperienceJoinParamsV0(normalized, join);
    }
    return normalized;
  }
  const initial = createInitialRhizohExperienceSessionContextV0();
  return applyExperienceJoinParamsV0(initial, join);
}

/**
 * Debug mirror only — not user-facing.
 * @param {ReturnType<typeof buildRhizohExperienceSessionContextV0>} context
 */
export function publishRhizohExperienceSessionContextV0(context) {
  if (typeof window !== "undefined") {
    window.__RHIZOH_EXPERIENCE_SESSION__ = Object.freeze({
      schema: RHIZOH_EXPERIENCE_SESSION_CONTEXT_SCHEMA_V0,
      readOnly: true,
      last: context,
      atMs: context?.updatedAtMs ?? Date.now()
    });
  }
  return context;
}

/** @internal vitest */
export function __resetRhizohExperienceSessionContextForTestV0() {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LS_KEY_V0);
      delete window.__RHIZOH_EXPERIENCE_SESSION__;
    }
  } catch {
    /* noop */
  }
}

export { RHIZOH_PRODUCT_BINDING_EVENT_V0 };
