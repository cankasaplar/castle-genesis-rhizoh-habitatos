/**
 * SPECFLOW: RESEARCH-ONLY — Social Coherence Kernel: **one decision loop** per frame.
 *
 * Merge order (do not reorder without new golden tests):
 * 1) **Arbiter tick** → authoritative `socialRuntimeV1` slice (Rhizoh presence / initiative / mode gates)
 * 2) **WS room roster** → merged into `castlePeers` view (network truth blended into CSIL input)
 * 3) **CSIL engine** → registry + focus / shadow + role (interaction thread)
 *
 * Castle Social Coherence Kernel is a deterministic state evolution engine that transforms
 * multi-agent social interaction into a diff-based temporal graph, enabling scalable distributed
 * coherence across real-time castles (see `buildSocialCoherenceNetworkDiffV0` + global reducer).
 *
 * ## Next evolution (natural upgrades)
 *
 * **A — Diff-based coherence:** broadcast only deltas (`buildSocialCoherenceNetworkDiffV0`) so WS / UI
 * traffic stays bounded as roster + social pulse grow.
 *
 * **B — Global multi-castle kernel:** `runGlobalSocialCoherenceKernelTickV0` (`globalCoherenceKernelBridgeV0.js`)
 * fuses slices then passes `mergedWsRoom` as `wsRoom` here; contract anchor:
 * `castleMultiUserSocialRuntimeContractV0.js`.
 *
 * **C — Time rewind / replay:** bind `frame` / `seq` to Genesis checkpoint lineage for audit and
 * regression; read-side alignment today: `genesis/GenesisReplaySessionViewer.jsx` + gateway
 * `/rhizoh/genesis/checkpoint/*` surfaces (not a replay executor in this module).
 */

import { applySocialArbiterTickV0 } from "../socialRuntime/socialStateAuthorityArbiterV0.js";
import { runCsilCastleSocialEngineStepV0 } from "./csilCastleSocialEngineV0.js";
import {
  advancePersonaContinuityV0,
  createInitialPersonaContinuityStateV0
} from "./personaContinuityV0.js";
import { compressIdentityToCharacterLineV0 } from "./identityCompressionV0.js";
import { evaluateCrossCastleIdentityBleedV0 } from "./crossCastleIdentityBleedV0.js";

export const SOCIAL_COHERENCE_KERNEL_SCHEMA_V0 = "castle.rhizoh.social_coherence_kernel.v0";

/** Roadmap ids (documentation / telemetry tags; not executed as a state machine here). */
export const SOCIAL_COHERENCE_EVOLUTION_V0 = Object.freeze({
  DIFF_BASED_NETWORK: "diff_based_network",
  GLOBAL_MULTI_CASTLE: "global_multi_castle",
  GENESIS_REPLAY_BIND: "genesis_replay_bind"
});

const NETWORK_PULSE_KEYS = [
  "coherenceFrame",
  "energyHint01",
  "modeHint",
  "rhizohRuntimeRole",
  "focusUserId",
  "wsRoomSeq"
];

/**
 * Diff for outbound `snapshotForNetwork` — only changed `socialPulse` keys (deterministic).
 *
 * @param {Record<string, unknown>|null|undefined} prevSnapshotForNetwork
 * @param {Record<string, unknown>|null|undefined} nextSnapshotForNetwork
 * @returns {{ dirty: boolean, patch: Record<string, unknown>, schema: string }}
 */
export function buildSocialCoherenceNetworkDiffV0(prevSnapshotForNetwork, nextSnapshotForNetwork) {
  const prev =
    prevSnapshotForNetwork &&
    typeof prevSnapshotForNetwork === "object" &&
    prevSnapshotForNetwork.socialPulse &&
    typeof prevSnapshotForNetwork.socialPulse === "object"
      ? /** @type {Record<string, unknown>} */ (prevSnapshotForNetwork.socialPulse)
      : {};
  const next =
    nextSnapshotForNetwork &&
    typeof nextSnapshotForNetwork === "object" &&
    nextSnapshotForNetwork.socialPulse &&
    typeof nextSnapshotForNetwork.socialPulse === "object"
      ? /** @type {Record<string, unknown>} */ (nextSnapshotForNetwork.socialPulse)
      : {};
  /** @type {Record<string, unknown>} */
  const patch = {};
  let dirty = false;
  for (const k of NETWORK_PULSE_KEYS) {
    if (prev[k] !== next[k]) {
      patch[k] = next[k];
      dirty = true;
    }
  }
  return {
    schema: "castle.rhizoh.social_coherence_network_diff.v0",
    dirty,
    patch
  };
}

function cloneSocialRuntimeV1(sr) {
  return sr && typeof sr === "object" ? { ...sr } : {};
}

/**
 * @param {unknown} wsRoom
 * @param {unknown[]} existingPeers
 */
export function mergeCastlePeersFromWsRosterV0(wsRoom, existingPeers) {
  const base = Array.isArray(existingPeers) ? [...existingPeers] : [];
  const seen = new Set(base.map((p) => String(p?.id || "").trim()).filter(Boolean));
  const roster = wsRoom && typeof wsRoom === "object" && Array.isArray(wsRoom.roster) ? wsRoom.roster : [];
  for (const row of roster) {
    const r = row && typeof row === "object" ? row : {};
    const id = String(r.userId || r.id || "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const label = String(r.label || r.displayName || id).slice(0, 48);
    const n = Number(r.energyHint01 ?? r.nexusEnergy);
    base.push({
      id,
      label,
      bridged: !!r.bridged,
      ...(Number.isFinite(n) ? { nexusEnergy: n } : {})
    });
  }
  return base;
}

/**
 * `continuityMeta` may carry `socialRuntimeV1`, `rhizohPersonaContinuity`, optional `rhizohSocialMemoryRecall`
 * (see `socialMemoryRetrievalV0.js`).
 *
 * @param {{
 *   nowMs?: number,
 *   lastFrame?: number,
 *   continuityMeta?: Record<string, unknown>|null,
 *   msSinceHardEvent: number,
 *   silenceMs: number,
 *   registry: unknown,
 *   csilInput: Record<string, unknown>,
 *   speechEvents?: Array<{ userId: string, ts: number, textLen?: number }>,
 *   distinctLangCount?: number,
 *   userEnergySlices?: Array<{ userId: string, energy01?: number }>,
 *   wsRoom?: { castleRoomKey?: string, seq?: number, roster?: unknown[] } | null,
 *   runArbiterTick?: boolean
 * }} input
 */
export function runSocialCoherenceKernelTickV0(input) {
  const nowMs = Math.max(0, Number(input.nowMs) || Date.now());
  const lastFrame = Math.max(0, Math.floor(Number(input.lastFrame) || 0));
  const frame = lastFrame + 1;
  const meta = input.continuityMeta && typeof input.continuityMeta === "object" ? input.continuityMeta : {};
  const prevSr = meta.socialRuntimeV1 && typeof meta.socialRuntimeV1 === "object" ? meta.socialRuntimeV1 : {};

  const runTick = input.runArbiterTick !== false;
  const tickOut = runTick
    ? applySocialArbiterTickV0({
        prevSr,
        nowMs,
        silenceMs: Math.max(0, Number(input.silenceMs) || 0),
        msSinceHardEvent: Number(input.msSinceHardEvent)
      })
    : {
        skipPersistence: true,
        nextSr: cloneSocialRuntimeV1(prevSr),
        didModeChange: false,
        shouldEmitAmbientPing: false,
        signal: { silenceMs: 0, silenceLevel: "ACTIVE", tickAt: nowMs },
        arbiter: { layer: "kernel", authorityPhase: "bypass", note: "arbiter_tick_disabled" }
      };

  const socialRuntimeV1 = tickOut.skipPersistence ? cloneSocialRuntimeV1(prevSr) : { ...tickOut.nextSr };

  const wsRoom = input.wsRoom && typeof input.wsRoom === "object" ? input.wsRoom : null;
  const basePeers = Array.isArray(input.csilInput?.castlePeers) ? input.csilInput.castlePeers : [];
  const castlePeers = mergeCastlePeersFromWsRosterV0(wsRoom, basePeers);

  const csil = runCsilCastleSocialEngineStepV0({
    registry: input.registry,
    input: {
      ...input.csilInput,
      castlePeers
    },
    speechEvents: input.speechEvents,
    distinctLangCount: input.distinctLangCount,
    userEnergySlices: Array.isArray(input.userEnergySlices) ? input.userEnergySlices : undefined,
    silenceMs: input.silenceMs,
    socialConflictFlag: input.socialConflictFlag
  });

  const decision = {
    rhizohRuntimeRole: csil.rhizohRuntimeRole,
    focusUserId: csil.focus?.userId ?? null,
    shadowUserIds: csil.shadowListeners.map((s) => s.userId),
    socialConflictFlag: csil.socialConflictFlag,
    arbitrationPriority: csil.arbitrationPriority,
    socialMode: String(socialRuntimeV1.mode || "")
  };

  const prevPersonaContinuity =
    meta.rhizohPersonaContinuity && typeof meta.rhizohPersonaContinuity === "object"
      ? meta.rhizohPersonaContinuity
      : createInitialPersonaContinuityStateV0();
  const rhizohPersonaContinuity = advancePersonaContinuityV0(prevPersonaContinuity, {
    rhizohRuntimeRole: decision.rhizohRuntimeRole,
    socialMode: decision.socialMode
  });
  const coherenceMeta = { ...meta, socialRuntimeV1, rhizohPersonaContinuity };

  const identityCompressionLine = compressIdentityToCharacterLineV0(rhizohPersonaContinuity, decision.rhizohRuntimeRole, {});
  const smRecall =
    meta.rhizohSocialMemoryRecall && typeof meta.rhizohSocialMemoryRecall === "object"
      ? meta.rhizohSocialMemoryRecall
      : { recallLines: [], episodeRefs: [] };
  const crossCastleBleedGuard = evaluateCrossCastleIdentityBleedV0({
    wsRoom,
    castlePeers,
    operatorUserId: String(input.csilInput?.firebaseUid || input.csilInput?.sessionKey || input.csilInput?.operatorId || "")
  });

  const snapshotForUi = {
    schema: SOCIAL_COHERENCE_KERNEL_SCHEMA_V0,
    frame,
    ts: nowMs,
    role: decision.rhizohRuntimeRole,
    focusUserId: decision.focusUserId,
    energy01: csil.energy01,
    peerCount: castlePeers.length,
    wsRoomSeq: wsRoom != null && Number.isFinite(Number(wsRoom.seq)) ? Number(wsRoom.seq) : null,
    arbiterPhase: tickOut.arbiter?.authorityPhase ?? null
  };

  const snapshotForLlm = {
    schema: SOCIAL_COHERENCE_KERNEL_SCHEMA_V0,
    frame,
    ts: nowMs,
    socialRuntimeV1,
    personaContinuity: rhizohPersonaContinuity,
    identityCompressionLine,
    socialMemoryRecall: smRecall,
    crossCastleBleedGuard,
    rhizohCastleRuntimeRole: decision.rhizohRuntimeRole,
    socialFocus: csil.focus,
    socialShadows: csil.shadowListeners,
    castlePeersHead: castlePeers.slice(0, 8),
    wsRoomKey: wsRoom ? String(wsRoom.castleRoomKey || "") : ""
  };

  const snapshotForNetwork = {
    schema: SOCIAL_COHERENCE_KERNEL_SCHEMA_V0,
    frame,
    socialPulse: {
      coherenceFrame: frame,
      energyHint01: csil.energy01,
      modeHint: decision.socialMode,
      rhizohRuntimeRole: decision.rhizohRuntimeRole,
      focusUserId: decision.focusUserId,
      wsRoomSeq: snapshotForUi.wsRoomSeq
    }
  };

  return {
    schema: SOCIAL_COHERENCE_KERNEL_SCHEMA_V0,
    frame,
    ts: nowMs,
    decision,
    socialRuntimeV1,
    coherenceMeta,
    layers: {
      arbiter: tickOut,
      csil,
      ws: wsRoom
        ? {
            castleRoomKey: String(wsRoom.castleRoomKey || ""),
            seq: Number(wsRoom.seq) || 0,
            rosterLen: Array.isArray(wsRoom.roster) ? wsRoom.roster.length : 0
          }
        : null
    },
    snapshotForUi,
    snapshotForLlm,
    snapshotForNetwork
  };
}
