import { useEffect } from "react";
import {
  startLiveRuntimeOrchestratorV0,
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
 * PR-2 — WORLD execution tick. PR-2.5 — publishes **observation envelope** (lane + frame + provenance + payload),
 * never raw tick as UI truth. React renderer ayrı dosyada; orchestrator import etmez.
 */
export function RhizohAtmosphereRuntime() {
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
    const stop = startLiveRuntimeOrchestratorV0({
      ttlMs: TTL_MS,
      signal: ac.signal,
      onPostTick: async (result) => {
        if (!effectActive || !result) return;
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
            state: result.state,
            hints: result.hints,
            temporal: result.temporal
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
  }, []);

  return null;
}
