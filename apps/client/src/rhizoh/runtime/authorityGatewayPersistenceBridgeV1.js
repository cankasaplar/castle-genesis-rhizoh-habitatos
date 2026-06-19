/**
 * Authority Gateway Persistence Bridge v1 — transport + witness only.
 * listen: rhizoh:authority-seal-v1 → shadow buffer → batch flush → gateway append → gateway witness seal
 * NO fusion · NO REC · NO projection · NO arbitration
 * RESEARCH-ONLY
 * @see docs/RHIZOH_GATEWAY_AUTHORITY_PERSISTENCE_BRIDGE_V1.md
 */

import { getCastleFlightConfig } from "../../castleFlight/castleFlightConfig.js";
import { getOrCreateCastleDevUid, getRhizohGatewayHealthBase } from "../useRhizohGatewayMonitor.js";
import { buildEpistemicTransportHeadersV0 } from "../epistemic/epistemicLedgerStreamV529.js";
import { onEpistemicTelemetryGatewayAttachV1 } from "../epistemic/epistemicLedgerStreamV529.js";
import {
  AUTHORITY_LEDGER_SCHEMA_V1,
  AUTHORITY_SEAL_EVENT_V1
} from "./authorityLedgerSealPipelineV1.js";

export const AUTHORITY_GATEWAY_BRIDGE_SCHEMA_V1 = "castle.rhizoh.authority_gateway_bridge.v1";
export const AUTHORITY_GATEWAY_BRIDGE_EVENT_V1 = "rhizoh:authority-gateway-bridge-v1";

/** @type {null | boolean} */
let authorityRoutesReachableV1 = null;
let warnedAuthority404V1 = false;

const SHADOW_QUEUE_V1 = [];
const FLUSH_QUEUE_V1 = [];
let flushTimerV1 = 0;
let inFlightV1 = false;
let lastWitnessedHeightV1 = 0;
let lastGatewayWitnessV1 = null;
let bridgeWiredV1 = false;

const WINDOW_MS_V1 = 240;
const ROUTE_PATH_V1 = "/rhizoh/authority/ledger/batch";

function publishBridgeStateV1(status, detail = {}) {
  if (typeof window === "undefined") return;
  try {
    window.__CASTLE_AUTHORITY_GATEWAY_BRIDGE__ = Object.freeze({
      schema: AUTHORITY_GATEWAY_BRIDGE_SCHEMA_V1,
      lastStatus: status,
      shadowCount: SHADOW_QUEUE_V1.length,
      flushPending: FLUSH_QUEUE_V1.length,
      lastWitnessedHeight: lastWitnessedHeightV1,
      routesReachable: authorityRoutesReachableV1,
      at: Date.now(),
      ...detail
    });
  } catch {
    /* noop */
  }
}

function dispatchBridgeEventV1(detail) {
  if (typeof globalThis !== "undefined" && globalThis.dispatchEvent) {
    globalThis.dispatchEvent(new CustomEvent(AUTHORITY_GATEWAY_BRIDGE_EVENT_V1, { detail }));
  }
}

export function getAuthorityGatewayRoutesReachableV1() {
  return authorityRoutesReachableV1;
}

export function markAuthorityGatewayRoutesOkV1() {
  authorityRoutesReachableV1 = true;
}

/**
 * @param {string} [base]
 */
export function markAuthorityGatewayRoutesMissingV1(base = "") {
  if (authorityRoutesReachableV1 === false) return;
  authorityRoutesReachableV1 = false;
  if (warnedAuthority404V1) return;
  warnedAuthority404V1 = true;
  const suffix = base ? ` — ${base}` : "";
  console.warn(
    `[Rhizoh authority] POST ${ROUTE_PATH_V1} → 404${suffix}. ` +
      "Gateway authority witness route not deployed; client sealed history remains local-only this session."
  );
}

function hasTransportCredentialsV1(idToken = "") {
  const tok = String(idToken || "").trim();
  const cfg = getCastleFlightConfig();
  const gt = String(cfg.gatewayToken || "").trim();
  const devUid = getOrCreateCastleDevUid();
  return Boolean(tok || (gt && devUid));
}

function canRemoteTransmitV1(idToken = "") {
  if (authorityRoutesReachableV1 === false) return false;
  if (!getRhizohGatewayHealthBase()) return false;
  if (!hasTransportCredentialsV1(idToken)) return false;
  return true;
}

/**
 * @param {object} entry sealed authority ledger entry
 * @param {string} [idToken]
 */
export function enqueueAuthorityLedgerWitnessV1(entry, idToken = "") {
  if (!entry || typeof entry !== "object") return;
  const height = Number(entry.height);
  if (!Number.isFinite(height) || height < 1) return;
  if (height <= lastWitnessedHeightV1) return;

  const tok = String(idToken || "").trim();
  const row = { entry, idToken: tok };

  if (!canRemoteTransmitV1(tok)) {
    SHADOW_QUEUE_V1.push(row);
    if (SHADOW_QUEUE_V1.length > 128) SHADOW_QUEUE_V1.splice(0, SHADOW_QUEUE_V1.length - 128);
    publishBridgeStateV1("buffering");
    return;
  }

  FLUSH_QUEUE_V1.push(row);
  if (FLUSH_QUEUE_V1.length > 128) FLUSH_QUEUE_V1.splice(0, FLUSH_QUEUE_V1.length - 128);
  scheduleFlushV1();
}

async function postAuthorityBatchV1(entries, idToken) {
  const base = getRhizohGatewayHealthBase();
  if (!base) return { ok: false, error: "no_gateway_base" };
  if (authorityRoutesReachableV1 === false) {
    return { ok: false, error: "authority_remote_routes_missing", skipRetry: true };
  }
  try {
    const res = await fetch(`${String(base).replace(/\/+$/, "")}${ROUTE_PATH_V1}`, {
      method: "POST",
      headers: buildEpistemicTransportHeadersV0(idToken),
      body: JSON.stringify({ entries }),
      ...(typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
        ? { signal: AbortSignal.timeout(12000) }
        : {})
    });
    const j = await res.json().catch(() => ({}));
    if (res.status === 404) {
      markAuthorityGatewayRoutesMissingV1(base);
      return { ok: false, error: j.error || "http_404", skipRetry: true };
    }
    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: j.error || `http_${res.status}`, skipRetry: true };
    }
    if (!res.ok || !j?.ok) return { ok: false, error: j.error || `http_${res.status}` };
    markAuthorityGatewayRoutesOkV1();
    return { ok: true, body: j };
  } catch (e) {
    return { ok: false, error: String(e?.message || e || "authority_batch_failed") };
  }
}

async function flushNowV1() {
  if (inFlightV1) return;
  const pending = FLUSH_QUEUE_V1.splice(0, 40);
  if (!pending.length && SHADOW_QUEUE_V1.length && canRemoteTransmitV1("")) {
    while (SHADOW_QUEUE_V1.length && FLUSH_QUEUE_V1.length < 40) {
      FLUSH_QUEUE_V1.push(SHADOW_QUEUE_V1.shift());
    }
    return flushNowV1();
  }
  if (!pending.length) return;

  inFlightV1 = true;
  const idToken = pending.map((x) => x.idToken).find(Boolean) || "";
  const entries = pending.map((x) => x.entry);
  const r = await postAuthorityBatchV1(entries, idToken);
  inFlightV1 = false;

  if (!r.ok) {
    publishBridgeStateV1(r.skipRetry ? "skipped" : "error", { lastError: r.error || "batch_failed" });
    if (r.skipRetry) return;
    for (const row of pending.slice(-20)) FLUSH_QUEUE_V1.unshift(row);
    scheduleFlushV1();
    return;
  }

  const witnessed = Number(r.body?.witnessed || 0);
  const chainHeight = Number(r.body?.chainHeight || 0);
  if (chainHeight > lastWitnessedHeightV1) {
    lastWitnessedHeightV1 = chainHeight;
  }
  lastGatewayWitnessV1 = r.body?.lastWitness || null;

  publishBridgeStateV1("ok", {
    witnessed,
    quarantined: Number(r.body?.quarantined || 0),
    chainHeight,
    lastWitness: lastGatewayWitnessV1
  });
  dispatchBridgeEventV1({
    schema: `${AUTHORITY_GATEWAY_BRIDGE_SCHEMA_V1}.flush`,
    witnessed,
    chainHeight,
    lastWitness: lastGatewayWitnessV1
  });

  if (FLUSH_QUEUE_V1.length || SHADOW_QUEUE_V1.length) scheduleFlushV1();
}

function scheduleFlushV1() {
  if (typeof window === "undefined") return;
  if (flushTimerV1) return;
  flushTimerV1 = window.setTimeout(() => {
    flushTimerV1 = 0;
    void flushNowV1();
  }, WINDOW_MS_V1);
}

export function flushAuthorityGatewayShadowBufferV1() {
  let drained = 0;
  while (SHADOW_QUEUE_V1.length) {
    FLUSH_QUEUE_V1.push(SHADOW_QUEUE_V1.shift());
    drained += 1;
  }
  if (drained) scheduleFlushV1();
  return drained;
}

function onAuthoritySealV1(ev) {
  const entry = ev?.detail;
  if (!entry || String(entry.schema || "") !== `${AUTHORITY_LEDGER_SCHEMA_V1}.entry`) return;
  enqueueAuthorityLedgerWitnessV1(entry);
}

export function getAuthorityGatewayBridgeSnapshotV1() {
  return Object.freeze({
    schema: `${AUTHORITY_GATEWAY_BRIDGE_SCHEMA_V1}.snapshot`,
    wired: bridgeWiredV1,
    routesReachable: authorityRoutesReachableV1,
    shadowCount: SHADOW_QUEUE_V1.length,
    flushPending: FLUSH_QUEUE_V1.length,
    lastWitnessedHeight: lastWitnessedHeightV1,
    lastGatewayWitness: lastGatewayWitnessV1,
    sharedOfficialHistory: lastWitnessedHeightV1 > 0,
    diagnosis: Object.freeze({
      localOnly: lastWitnessedHeightV1 === 0 && SHADOW_QUEUE_V1.length > 0,
      gatewayWitnessActive: lastWitnessedHeightV1 > 0,
      holdHistoryTransport: true,
      fusionOnBridge: false,
      arbitrationOnBridge: false
    }),
    interpretationOnly: true,
    nonExecutive: true,
    atMs: Date.now()
  });
}

export function ensureAuthorityGatewayPersistenceBridgeV1() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};

  if (!bridgeWiredV1) {
    bridgeWiredV1 = true;
    window.addEventListener(AUTHORITY_SEAL_EVENT_V1, onAuthoritySealV1);
    window.addEventListener("castle-rhizoh-epistemic-ledger", () => {
      void flushAuthorityGatewayShadowBufferV1();
    });
  }

  if (!window.__rhizoh.authorityGatewayBridge) {
    window.__rhizoh.authorityGatewayBridge = () => getAuthorityGatewayBridgeSnapshotV1();
  }
  if (!window.__rhizoh.flushAuthorityGatewayBridge) {
    window.__rhizoh.flushAuthorityGatewayBridge = () => {
      const attach = onEpistemicTelemetryGatewayAttachV1("authority_bridge_flush");
      const drained = flushAuthorityGatewayShadowBufferV1();
      scheduleFlushV1();
      return Object.freeze({ ...attach, drainedCount: drained });
    };
  }

  publishBridgeStateV1("armed");
  return window.__rhizoh.authorityGatewayBridge;
}

/** @internal vitest */
export function resetAuthorityGatewayBridgeForTestV1() {
  if (typeof window !== "undefined" && bridgeWiredV1) {
    window.removeEventListener(AUTHORITY_SEAL_EVENT_V1, onAuthoritySealV1);
  }
  bridgeWiredV1 = false;
  authorityRoutesReachableV1 = null;
  warnedAuthority404V1 = false;
  SHADOW_QUEUE_V1.length = 0;
  FLUSH_QUEUE_V1.length = 0;
  flushTimerV1 = 0;
  inFlightV1 = false;
  lastWitnessedHeightV1 = 0;
  lastGatewayWitnessV1 = null;
}
