/**
 * Castle cloud sync v0 — push/pull Archive, Library, Ghost Memory, Codex to gateway.
 */

import { getOrCreateCastleDevUid, getRhizohApiBase } from "../useRhizohGatewayMonitor.js";
import { listCastleArchiveEntitiesV0, listCastleArchiveEventsV0 } from "./castleArchiveVaultV0.js";
import {
  publishTowerLiveStatusV0,
  setRhizohTowerSyncActiveV0
} from "./rhizohTowerLiveStatusV0.js";

export const CASTLE_CLOUD_SYNC_SCHEMA_V0 = "castle.cloud_sync.v0";
export const CASTLE_CLOUD_SYNC_EVENT_V0 = "rhizoh:castle-cloud-sync-v0";

function authHeaders() {
  return {
    "Content-Type": "application/json",
    "X-Castle-Dev-Uid": getOrCreateCastleDevUid()
  };
}

/**
 * @returns {Promise<{ ok: boolean, snapshot?: object, error?: string }>}
 */
export async function pullCastleCloudSyncV0() {
  setRhizohTowerSyncActiveV0(true);
  publishTowerLiveStatusV0();
  try {
    const res = await fetch(`${getRhizohApiBase()}/rhizoh/sync/vault`, { headers: authHeaders() });
    const json = await res.json();
    if (!json?.ok) return { ok: false, error: json?.error || "pull_failed" };
    try {
      window.dispatchEvent(
        new CustomEvent(CASTLE_CLOUD_SYNC_EVENT_V0, {
          detail: Object.freeze({ direction: "pull", snapshot: json.snapshot })
        })
      );
    } catch {
      /* noop */
    }
    return { ok: true, snapshot: json.snapshot };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  } finally {
    setRhizohTowerSyncActiveV0(false);
    publishTowerLiveStatusV0();
  }
}

/**
 * Push local archive + ghost memory snapshot to gateway.
 */
export async function pushCastleCloudSyncV0(opts = {}) {
  setRhizohTowerSyncActiveV0(true);
  publishTowerLiveStatusV0();
  try {
    const entities = listCastleArchiveEntitiesV0();
    const events = listCastleArchiveEventsV0();
    const ghostMemory = readGhostMemoryLocalV0();
    const codex = Array.isArray(opts.codex) ? opts.codex : readCodexLocalV0();

    const res = await fetch(`${getRhizohApiBase()}/rhizoh/sync/vault`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ entities, events, ghostMemory, codex })
    });
    const json = await res.json();
    if (!json?.ok) return { ok: false, error: json?.error || "push_failed" };
    try {
      window.dispatchEvent(
        new CustomEvent(CASTLE_CLOUD_SYNC_EVENT_V0, {
          detail: Object.freeze({ direction: "push", snapshot: json.snapshot })
        })
      );
    } catch {
      /* noop */
    }
    return { ok: true, snapshot: json.snapshot };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  } finally {
    setRhizohTowerSyncActiveV0(false);
    publishTowerLiveStatusV0();
  }
}

function readGhostMemoryLocalV0() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem("rhizoh_ghost_memory_v0");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readCodexLocalV0() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem("rhizoh_codex_cache_v0");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Two-way sync: push local then pull merged server snapshot.
 */
export async function syncCastleCloudVaultV0(opts = {}) {
  const push = await pushCastleCloudSyncV0(opts);
  if (!push.ok) return push;
  return pullCastleCloudSyncV0();
}
