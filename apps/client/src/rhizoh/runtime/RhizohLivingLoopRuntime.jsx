import { useEffect, useState, useCallback } from "react";
import { startRhizohLivingLoopOrchestratorV0 } from "./rhizohLivingLoopOrchestratorV0.js";
import {
  clearLiveRuntimeOrchestratorProjectionStateV0
} from "./liveRuntimeOrchestratorV0.js";
import {
  clearProjectionHintsFromHostV0,
  clearCastleAuraSurfaceHintsV0
} from "./sceneProjectionAdapterV0.js";
import { isWorldExecutionOffV0, getWorldExecutionModeV0 } from "./worldExecutionGateV0.js";
import { getRuntimeFrameId } from "./runtimeFrameCorrelationV0.js";
import { buildObservationEnvelopeV0 } from "./observationEnvelopeV0.js";
import { resolveObservationIdentityLaneV0, readObservationReplaySeedV0 } from "./observationLaneResolveV0.js";
import { checkObservationLaneDriftV0 } from "./observationLaneDriftV0.js";
import {
  setObservationEnvelopeForUiV0,
  clearObservationEnvelopeForUiV0
} from "./atmosphereRuntimeSnapshotV0.js";

const TTL_MS = 10 * 60 * 1000;

/**
 * RLL-O mount — binds LocationSeed → WorldInstance → Atmosphere → Ribbon → Castle → Memory WAL.
 * Publishes observation envelope from the atmosphere leg (unchanged contract).
 */
export function RhizohLivingLoopRuntime({ onFrame }) {
  const [, setTick] = useState(0);
  const onFrameStable = useCallback(
    (frame) => {
      onFrame?.(frame);
    },
    [onFrame]
  );

  useEffect(() => {
    const root = typeof document !== "undefined" ? document.documentElement : null;
    const ac = new AbortController();

    const cleanupDomAndHints = () => {
      clearLiveRuntimeOrchestratorProjectionStateV0();
      if (root) clearProjectionHintsFromHostV0(root);
      const castle =
        typeof document !== "undefined" ? document.querySelector("[data-rhizoh-atmosphere-castle-surface]") : null;
      clearCastleAuraSurfaceHintsV0(castle);
      clearObservationEnvelopeForUiV0();
    };

    if (isWorldExecutionOffV0()) {
      cleanupDomAndHints();
      return cleanupDomAndHints;
    }

    let effectActive = true;
    const stop = startRhizohLivingLoopOrchestratorV0({
      ttlMs: TTL_MS,
      signal: ac.signal,
      onPostTick: async (frame) => {
        if (!effectActive || !frame) return;
        onFrameStable(frame);
        setTick((n) => n + 1);

        const lane = resolveObservationIdentityLaneV0();
        const frameId = getRuntimeFrameId() || "";
        const drift = checkObservationLaneDriftV0(frameId, lane);
        if (!drift.ok) {
          console.warn("[CASTLE_OBSERVATION_LANE_DRIFT]", drift);
        }
        const envelope = buildObservationEnvelopeV0({
          lane,
          runtimeFrameId: frameId,
          replaySeed: readObservationReplaySeedV0(),
          executionMode: getWorldExecutionModeV0(),
          payload: {
            state: frame.atmosphere.state,
            hints: frame.atmosphere.hints,
            temporal: frame.atmosphere.temporal,
            livingLoop: {
              worldInstanceId: frame.worldInstance.instanceId,
              ribbon: frame.ribbon,
              castle: frame.castle
            }
          }
        });
        setObservationEnvelopeForUiV0(envelope);
      }
    });

    return () => {
      effectActive = false;
      ac.abort();
      stop();
      cleanupDomAndHints();
    };
  }, [onFrameStable]);

  return null;
}
