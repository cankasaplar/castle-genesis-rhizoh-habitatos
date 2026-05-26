/**
 * CORE-ELIGIBLE — Rhizoh Living Loop Orchestrator (RLL-O) v0.
 *
 * Single rhythm binding:
 *   LocationSeed → WorldInstance → Atmosphere → Ribbon → Castle Interaction → Memory WAL
 *
 * Atmosphere tick delegates to `liveRuntimeOrchestratorV0` (weather → presence → projection).
 * Memory WAL is observation-lane only (`livingLoopMemoryWalV0`); does not advance sealer cursor.
 *
 * @see docs/LIVE_RUNTIME_STREAMING_CORE_V0.md
 */

import { resolveLocationSeedV0 } from "./locationSeedV0.js";
import { resolveLivingWorldInstanceV0 } from "./worldInstanceFromLocationSeedV0.js";
import {
  runLiveRuntimeOrchestratorTickV0,
  startLiveRuntimeOrchestratorV0,
  LIVE_RUNTIME_ORCHESTRATOR_DEFAULT_TICK_MS
} from "./liveRuntimeOrchestratorV0.js";
import { clampLiveRuntimeOrchestratorIntervalMsV0 } from "./liveRuntimeTemporalLockV0.js";
import { isWorldExecutionOffV0 } from "./worldExecutionGateV0.js";
import { appendLivingLoopMemoryWalV0, livingLoopMemoryWalEnabledV0 } from "./livingLoopMemoryWalV0.js";

export const RHIZOH_LIVING_LOOP_ORCHESTRATOR_SCHEMA_V0 = "castle.rhizoh.living_loop_orchestrator.v0";

/** @type {import("./rhizohLivingLoopOrchestratorV0.js").RhizohLivingLoopFrameV0 | null} */
let _lastFrame = null;

/**
 * @typedef {{
 *   schema: string,
 *   atMs: number,
 *   locationSeed: ReturnType<typeof resolveLocationSeedV0>,
 *   worldInstance: ReturnType<typeof resolveLivingWorldInstanceV0>,
 *   atmosphere: Awaited<ReturnType<typeof runLiveRuntimeOrchestratorTickV0>>,
 *   ribbon: { atmosphereLead: string, worldEcho: string, affordanceHint: string },
 *   castle: { affordanceId: string, metabolicPulse: number, auraIntensity: number, surfaceReady: boolean },
 *   memoryWal: { ok: boolean, tick?: number, hash?: string, code?: string } | null
 * }} RhizohLivingLoopFrameV0
 */

/**
 * @param {{
 *   state?: import("./worldPresenceRuntimeV0.js").buildWorldPresenceStateV0 extends (...args: infer A) => any ? Awaited<ReturnType<import("./worldPresenceRuntimeV0.js").buildWorldPresenceStateV0>> : unknown,
 *   hints?: import("./sceneProjectionAdapterV0.js").ProjectionHintsV0
 * }} io
 */
export function deriveLivingLoopRibbonFrameV0(io) {
  const amb = io.state?.ambient;
  const weather = amb?.weatherType ? String(amb.weatherType) : "unknown";
  const lum = typeof amb?.luminosity === "number" ? amb.luminosity : 0.5;
  const hour = amb?.localTime?.hour ?? 12;
  const dayPart = hour < 6 ? "gece" : hour < 12 ? "sabah" : hour < 18 ? "öğle" : "akşam";
  const pulse = typeof io.hints?.castleMetabolicPulse === "number" ? io.hints.castleMetabolicPulse : 0.4;

  const atmosphereLead =
    weather === "rain"
      ? `${dayPart} — yağışlı çevre; görüş bütçesi daralıyor.`
      : weather === "clear"
        ? `${dayPart} — açık gökyüzü; uzak rezonans alanı geniş.`
        : `${dayPart} — ${weather} atmosferi; Castle nefes ritmi ${Math.round(pulse * 100)}%.`;

  const tz = io.worldInstance?.timeZone || io.locationSeed?.timeZone || "UTC";
  const locale = io.worldInstance?.locale || io.locationSeed?.locale || "und";
  const worldEcho = `Dünya örneği ${io.worldInstance?.instanceId || "—"} · ${tz} · ${locale}`;

  const affordanceHint =
    pulse > 0.62
      ? "Castle yüzeyi yüksek metabolik nabızda — dokunma / odak etkileşimi için hazır."
      : pulse > 0.35
        ? "Castle yüzeyi orta nabızda — gözlem ve hafif etkileşim bandı."
        : "Castle yüzeyi sakin modda — önce gözlem, sonra etkileşim.";

  return { atmosphereLead, worldEcho, affordanceHint };
}

/**
 * @param {{
 *   hints?: import("./sceneProjectionAdapterV0.js").ProjectionHintsV0,
 *   surfaceReady?: boolean
 * }} io
 */
export function deriveCastleInteractionFrameV0(io) {
  const pulse = typeof io.hints?.castleMetabolicPulse === "number" ? io.hints.castleMetabolicPulse : 0.4;
  const aura = typeof io.hints?.castleAuraIntensity === "number" ? io.hints.castleAuraIntensity : 0.4;
  const affordanceId =
    pulse > 0.62 ? "castle.interact.focus" : pulse > 0.35 ? "castle.interact.observe" : "castle.interact.rest";
  return {
    affordanceId,
    metabolicPulse: pulse,
    auraIntensity: aura,
    surfaceReady: Boolean(io.surfaceReady)
  };
}

export function getRhizohLivingLoopSnapshotV0() {
  return _lastFrame;
}

export function clearRhizohLivingLoopSnapshotForTestsV0() {
  _lastFrame = null;
}

/**
 * @param {{
 *   ttlMs?: number,
 *   signal?: AbortSignal,
 *   locationSeed?: ReturnType<typeof resolveLocationSeedV0>,
 *   worldInstance?: ReturnType<typeof resolveLivingWorldInstanceV0>,
 *   skipMemoryWal?: boolean
 * }} [opts]
 * @returns {Promise<RhizohLivingLoopFrameV0>}
 */
export async function runRhizohLivingLoopTickV0(opts = {}) {
  const locationSeed = opts.locationSeed || resolveLocationSeedV0();
  const worldInstance = opts.worldInstance || resolveLivingWorldInstanceV0();
  const livingContext = { locationSeed, worldInstance };

  const atmosphere = await runLiveRuntimeOrchestratorTickV0({
    ttlMs: opts.ttlMs,
    signal: opts.signal,
    livingContext
  });

  const surfaceReady =
    typeof document !== "undefined" &&
    Boolean(document.querySelector("[data-rhizoh-atmosphere-castle-surface]"));

  const ribbon = deriveLivingLoopRibbonFrameV0({
    locationSeed,
    worldInstance,
    state: atmosphere.state,
    hints: atmosphere.hints
  });
  const castle = deriveCastleInteractionFrameV0({
    hints: atmosphere.hints,
    surfaceReady
  });

  const atMs = Date.now();
  /** @type {RhizohLivingLoopFrameV0["memoryWal"]} */
  let memoryWal = null;
  if (!opts.skipMemoryWal && livingLoopMemoryWalEnabledV0()) {
    memoryWal = await appendLivingLoopMemoryWalV0({
      locationSeed,
      worldInstance,
      ribbon,
      castle,
      atmosphereTickMs: atMs
    });
  }

  const frame = Object.freeze({
    schema: RHIZOH_LIVING_LOOP_ORCHESTRATOR_SCHEMA_V0,
    atMs,
    locationSeed,
    worldInstance,
    atmosphere,
    ribbon,
    castle,
    memoryWal
  });
  _lastFrame = frame;
  return frame;
}

/**
 * @param {{
 *   intervalMs?: number,
 *   ttlMs?: number,
 *   signal?: AbortSignal,
 *   onPostTick?: (frame: RhizohLivingLoopFrameV0) => void | Promise<void>
 * }} [opts]
 * @returns {() => void} stop
 */
export function startRhizohLivingLoopOrchestratorV0(opts = {}) {
  if (isWorldExecutionOffV0()) {
    return () => {};
  }

  const locationSeed = resolveLocationSeedV0();
  const worldInstance = resolveLivingWorldInstanceV0();
  const livingContext = { locationSeed, worldInstance };

  const envTick =
    typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_RHIZOH_LIVING_LOOP_TICK_MS;
  const parsedEnv = Number(envTick);
  const fromEnv =
    Number.isFinite(parsedEnv) && parsedEnv >= 500 && parsedEnv <= 600_000
      ? parsedEnv
      : LIVE_RUNTIME_ORCHESTRATOR_DEFAULT_TICK_MS;
  const intervalMs = clampLiveRuntimeOrchestratorIntervalMsV0(
    typeof opts.intervalMs === "number" && opts.intervalMs > 0 ? opts.intervalMs : fromEnv
  );

  return startLiveRuntimeOrchestratorV0({
    intervalMs,
    ttlMs: opts.ttlMs,
    signal: opts.signal,
    livingContext,
    onPostTick: async (atmosphere) => {
      const surfaceReady =
        typeof document !== "undefined" &&
        Boolean(document.querySelector("[data-rhizoh-atmosphere-castle-surface]"));
      const ribbon = deriveLivingLoopRibbonFrameV0({
        locationSeed,
        worldInstance,
        state: atmosphere.state,
        hints: atmosphere.hints
      });
      const castle = deriveCastleInteractionFrameV0({
        hints: atmosphere.hints,
        surfaceReady
      });
      const atMs = Date.now();
      let memoryWal = null;
      if (livingLoopMemoryWalEnabledV0()) {
        memoryWal = await appendLivingLoopMemoryWalV0({
          locationSeed,
          worldInstance,
          ribbon,
          castle,
          atmosphereTickMs: atMs
        });
      }
      const frame = Object.freeze({
        schema: RHIZOH_LIVING_LOOP_ORCHESTRATOR_SCHEMA_V0,
        atMs,
        locationSeed,
        worldInstance,
        atmosphere,
        ribbon,
        castle,
        memoryWal
      });
      _lastFrame = frame;
      await opts.onPostTick?.(frame);
    }
  });
}
