/**

 * L9 Event Arbitration · City Mind kontrol katmanı

 * — bölge cooldown, metin fingerprint dedupe, sürü kümesi (tek yayın),

 *   öncelik / spiral global gate, pet & akademi çift tetik koruması.

 * — Execution gate: motor + reality senkronu, swarm_nexus için map yüzeyi.

 */

import { getRhizohApiBase } from "../rhizoh/useRhizohGatewayMonitor.js";

import {

  dispatchL9SocialDraftToWindow,

  buildThoughtChainL8V1,

  buildPulseSeriesFromSeed

} from "./castleL9EventMeshV1.js";

import {

  configureL9ExecutionGate,

  evaluateL9ExecutionGate,

  enqueueL9ExecutionDeferred,

  flushDeferredL9Emits,

  clearL9ExecutionDeferredQueue

} from "./castleL9ExecutionGate.js";

import { formatMeshSwarmFieldObservationV0 } from "../rhizoh/spatial/worldMeshLabelsV0.js";

import { getL9CooldownMultiplier, evaluateL9ProposeThrottle } from "./castleL9GatePolicy.js";

import { getCastleRuntimeMetrics } from "./castleRuntimeMetrics.js";

import { emitL9ExecutionFeedback } from "./castleL9ExecutionFeedback.js";



export { configureL9ExecutionGate };



const PRIORITY = {

  academy_master: 100,

  pet_guardian: 92,

  swarm_nexus: 72,

  spiral_geometry: 38,

  demo: 14,

  unknown: 8

};



const COOLDOWN_MS = {

  swarm_nexus: 150000,

  spiral_geometry: 320000,

  academy_master: 96000,

  pet_guardian: 130000,

  demo: 35000,

  default: 72000

};



const SWARM_CLUSTER_MS = 3800;

const FP_TTL_MS = 52000;

const MAX_MAP_ENTRIES = 96;



function getCastleDevUid() {

  const key = "castle.dev.uid";

  try {

    let uid = window.localStorage.getItem(key) || "";

    if (!uid) {

      uid = `u-${Math.random().toString(36).slice(2, 10)}`;

      window.localStorage.setItem(key, uid);

    }

    return uid;

  } catch {

    return `u-${Math.random().toString(36).slice(2, 10)}`;

  }

}



export function zoneKeyFromLatLon(lat, lon, prec = 2) {

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return "global";

  const r = (x) => Math.round(x * 10 ** prec) / 10 ** prec;

  return `${r(lat)}_${r(lon)}`;

}



function hashFingerprint(text) {

  let h = 5381;

  const s = String(text || "").slice(0, 480);

  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);

  return `fp_${h >>> 0}`;

}



function pruneMap(map, now) {

  if (map.size <= MAX_MAP_ENTRIES) return;

  for (const [k, t] of map) {

    if (t < now) map.delete(k);

    if (map.size <= MAX_MAP_ENTRIES * 0.6) break;

  }

}



function codexLocalRing(detail) {

  try {

    const key = "castle.codex.l9.ring";

    const raw = JSON.parse(window.localStorage.getItem(key) || "[]");

    raw.unshift({

      ts: Date.now(),

      trigger: detail.trigger,

      agent: detail.agent,

      text: String(detail.text || "").slice(0, 600)

    });

    window.localStorage.setItem(key, JSON.stringify(raw.slice(0, 48)));

  } catch {

    /* noop */

  }

}



function emitL9EngineHint(detail) {

  try {

    if (typeof window === "undefined") return;

    window.dispatchEvent(

      new CustomEvent("castle-l9-engine-hint", {

        detail: {

          trigger: detail.trigger,

          agentCount: detail.agentCount,

          agentIdx: detail.agentIdx,

          ...getCastleRuntimeMetrics(),

          cooldownMult: getL9CooldownMultiplier()

        }

      })

    );

  } catch {

    /* noop */

  }

}



/**

 * Gateway /memory + yerel CODEX halkası + Ghost Pet kişilik nabzı (UI/sim tarafı dinler).

 */

export async function reinforceL9EventMemory(detail) {

  const api = getRhizohApiBase();

  const body = {

    scope: "users",

    text: `L9[${detail.trigger}] ${String(detail.agent || "")}: ${String(detail.text || "").slice(0, 1400)}`,

    tags: ["l9", "city-mind", String(detail.trigger || "event")],

    importance: Math.min(0.95, 0.48 + (PRIORITY[String(detail.trigger)] || 10) / 220),

    kind: "episodic",

    meta: {

      trigger: detail.trigger,

      agentIdx: detail.agentIdx,

      lat: detail.lat,

      lon: detail.lon,

      agentCount: detail.agentCount

    }

  };

  if (api) {

    try {

      const res = await fetch(`${api}/memory`, {

        method: "POST",

        headers: { "Content-Type": "application/json", "X-Castle-Dev-Uid": getCastleDevUid() },

        body: JSON.stringify(body)

      });

      await res.json().catch(() => ({}));

    } catch {

      /* offline */

    }

  }

  codexLocalRing(detail);

  if (String(detail.trigger) === "pet_guardian" && detail.agentIdx != null && detail.agentIdx >= 0) {

    window.dispatchEvent(

      new CustomEvent("castle-l9-ghost-personality", {

        detail: { agentIdx: detail.agentIdx, trigger: detail.trigger }

      })

    );

  }

}



function emitL9ToWorld(detail) {

  dispatchL9SocialDraftToWindow(detail);

  void reinforceL9EventMemory(detail);

  emitL9EngineHint(detail);

}



export function flushL9ExecutionHoldQueue() {

  return flushDeferredL9Emits(emitL9ToWorld);

}



export class CastleL9EventBusV2 {

  constructor() {

    this._coolUntil = new Map();

    this._fpUntil = new Map();

    this._onceEmit = new Map();

    this._swarmPending = null;

    this._swarmTimer = 0;

  }



  reset() {

    this._coolUntil.clear();

    this._fpUntil.clear();

    this._onceEmit.clear();

    if (this._swarmTimer) window.clearTimeout(this._swarmTimer);

    this._swarmTimer = 0;

    this._swarmPending = null;

    clearL9ExecutionDeferredQueue();

  }



  _coolK(trigger, zone) {

    if (trigger === "spiral_geometry") return "spiral_geometry::global";

    return `${trigger}::${zone}`;

  }



  _canEmitNow(trigger, zone, text, now, detail) {

    const ck = this._coolK(trigger, zone);

    const fp = hashFingerprint(text);

    if (this._coolUntil.get(ck) > now) return { ok: false, reason: "zone_cooldown" };



    if (this._fpUntil.get(fp) > now) return { ok: false, reason: "text_dedupe" };



    if (trigger === "pet_guardian" && detail.agentIdx != null) {

      const k = `pet::${detail.agentIdx}`;

      if (now - (this._onceEmit.get(k) || 0) < 125000) return { ok: false, reason: "pet_double" };

    }

    if (trigger === "academy_master" && detail.agentIdx != null) {

      const k = `academy::${detail.agentIdx}`;

      if (now - (this._onceEmit.get(k) || 0) < 88000) return { ok: false, reason: "academy_double" };

    }



    return { ok: true, ck, fp };

  }



  _applyArbitrationLocks(detail, now, ck, fp) {

    const trigger = String(detail.trigger || "unknown");

    const mult = getL9CooldownMultiplier();

    const cd = (COOLDOWN_MS[trigger] ?? COOLDOWN_MS.default) * mult;

    this._coolUntil.set(ck, now + cd);

    this._fpUntil.set(fp, now + FP_TTL_MS);

    pruneMap(this._coolUntil, now);

    pruneMap(this._fpUntil, now);



    if (trigger === "pet_guardian" && detail.agentIdx != null) this._onceEmit.set(`pet::${detail.agentIdx}`, now);

    if (trigger === "academy_master" && detail.agentIdx != null) this._onceEmit.set(`academy::${detail.agentIdx}`, now);

  }



  _commitEmit(detail, now, ck, fp) {

    this._applyArbitrationLocks(detail, now, ck, fp);

    const ex = evaluateL9ExecutionGate(detail);

    if (!ex.ok) {

      enqueueL9ExecutionDeferred({ ...detail, arbitration: { ...(detail.arbitration || {}), executionDeferred: true, executionReason: ex.reason } });

      emitL9ExecutionFeedback({

        kind: "execution_deferred",

        reason: ex.reason,

        trigger: String(detail.trigger || ""),

        message: `L9 emit ertelendi (${ex.reason}) — flush ile yayınlanacak`

      });

      return { status: "execution_deferred", reason: ex.reason, trigger: String(detail.trigger || "") };

    }

    emitL9ToWorld(detail);

    return { status: "emitted", trigger: String(detail.trigger || "") };

  }



  _scheduleSwarmFlush() {

    if (this._swarmTimer) window.clearTimeout(this._swarmTimer);

    this._swarmTimer = window.setTimeout(() => {

      this._swarmTimer = 0;

      this._flushSwarmCluster();

    }, SWARM_CLUSTER_MS);

  }



  _flushSwarmCluster() {

    const p = this._swarmPending;

    this._swarmPending = null;

    if (!p) return { status: "swarm_empty" };



    const now = Date.now();

    const maxCnt = Math.max(p.maxCnt, Number(p.detail.agentCount) || 0);

    const z = p.zone;

    const text = formatMeshSwarmFieldObservationV0(maxCnt);

    const merged = {

      ...p.detail,

      agentCount: maxCnt,

      text,

      heatPulse: buildPulseSeriesFromSeed(maxCnt + (now % 997), 14),

      thoughtChain: buildThoughtChainL8V1({

        threatLevel: Math.min(1, maxCnt / 16),

        districtEnergy: 0.5 + maxCnt * 0.028,

        swarmLevel: 0.76,

        memoryEcho: 0.42

      }),

      arbitration: { collapsedAgents: maxCnt, clusterMs: SWARM_CLUSTER_MS }

    };



    const gate = this._canEmitNow("swarm_nexus", z, merged.text, now, merged);

    if (!gate.ok) return { status: "swarm_blocked", reason: gate.reason };



    return this._commitEmit(merged, now, gate.ck, gate.fp);

  }



  /**

   * @returns {object} status: emitted | swarm_buffered | swarm_merged | blocked | ...

   */

  propose(detail) {

    const trigger = String(detail.trigger || "unknown");

    const now = Date.now();

    const z = zoneKeyFromLatLon(detail.lat, detail.lon);



    if (trigger === "swarm_nexus") {

      const rt0 = evaluateL9ProposeThrottle(trigger);

      if (!rt0.ok) return { status: "blocked", reason: rt0.reason, trigger };

      const cnt = Math.max(0, Number(detail.agentCount) || 0);

      if (!this._swarmPending || this._swarmPending.zone !== z) {

        if (this._swarmPending) this._flushSwarmCluster();

        this._swarmPending = { zone: z, maxCnt: cnt, detail: { ...detail } };

        this._scheduleSwarmFlush();

        return { status: "swarm_buffered", zone: z };

      }

      this._swarmPending.maxCnt = Math.max(this._swarmPending.maxCnt, cnt);

      this._swarmPending.detail = { ...this._swarmPending.detail, ...detail, agentCount: this._swarmPending.maxCnt };

      this._scheduleSwarmFlush();

      return { status: "swarm_merged", maxCnt: this._swarmPending.maxCnt };

    }



    const rt1 = evaluateL9ProposeThrottle(trigger);

    if (!rt1.ok) return { status: "blocked", reason: rt1.reason, trigger };

    const text = String(detail.text || "");

    const gate = this._canEmitNow(trigger, z, text, now, detail);

    if (!gate.ok) return { status: "blocked", reason: gate.reason, trigger };



    const pri = PRIORITY[trigger] ?? PRIORITY.unknown;

    void pri;



    return this._commitEmit({ ...detail, arbitration: { zone: z, priority: pri } }, now, gate.ck, gate.fp);

  }

}



export const l9EventBus = new CastleL9EventBusV2();



export function resetL9EventBus() {

  l9EventBus.reset();

}



export function pushL9SocialDraftArbitrated(detail) {

  return l9EventBus.propose(detail);

}


