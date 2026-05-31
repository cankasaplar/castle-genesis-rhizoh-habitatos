/**
 * CORE-ELIGIBLE — Living-world + optional spatial map shell (research / spatial-main track).
 * Default rhizoh.com product uses AppRhizoh528T0.jsx via AppRhizoh528.jsx router.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RhizohAtmospherePresenceBridge } from "./rhizoh/runtime/RhizohAtmospherePresenceBridge.jsx";
import { RhizohLivingWorldEntryShell } from "./components/RhizohLivingWorldEntryShell.jsx";
import { buildRhizohLivingWorldEntryModelV0 } from "./rhizoh/experience/rhizohLivingWorldEntryOrchestratorV0.js";
import {
  openLivingWorldBrowserSessionV0,
  touchLivingWorldPersistenceTickV0,
  sealLivingWorldSessionSnapshotV0
} from "./rhizoh/experience/livingWorldPersistenceUxV0.js";
import {
  buildWorldMutationFeedbackV0,
  recordWorldMutationV0,
  sealWorldMutationLedgerV0,
  WORLD_MUTATION_ACTION_V0
} from "./rhizoh/experience/worldMutationFeedbackV0.js";
import {
  hydrateCrossSessionCoherenceV0,
  sealCrossSessionCoherenceAnchorV0
} from "./rhizoh/experience/crossSessionWorldCoherenceV0.js";
import { bindIdentityDriftContextV0 } from "./rhizoh/experience/identityDriftBindingV0.js";
import { resolveLivingWorldInstanceV0 } from "./rhizoh/runtime/worldInstanceFromLocationSeedV0.js";
import { runRhizohClagForLivingWorldFrameV0 } from "./rhizoh/runtime/rhizohClagTurnBridgeV0.js";
import { RhizohSpatialWorldShell } from "./components/RhizohSpatialWorldShell.jsx";

const SPIRAL_PERCEPTION_BRIDGE_V0 =
  typeof import.meta !== "undefined" &&
  import.meta.env?.VITE_SPIRAL_MMO_PERCEPTION_BRIDGE === "1";

const SPIRAL_AGREEMENT_LAYER_V0 =
  typeof import.meta !== "undefined" &&
  import.meta.env?.VITE_SPIRAL_MMO_AGREEMENT_LAYER === "1";

export default function AppRhizoh528LivingEntry() {
  const [worldInstanceBoot] = useState(() => resolveLivingWorldInstanceV0());
  const [identityBinding] = useState(() =>
    bindIdentityDriftContextV0({
      worldInstanceId: worldInstanceBoot.instanceId,
      timeZone: worldInstanceBoot.timeZone,
      locale: worldInstanceBoot.locale
    })
  );
  const [livingFrame, setLivingFrame] = useState(
    /** @type {import("./rhizoh/runtime/rhizohLivingLoopOrchestratorV0.js").RhizohLivingLoopFrameV0 | null} */ (null)
  );
  const [sessionTouch, setSessionTouch] = useState(
    /** @type {ReturnType<typeof openLivingWorldBrowserSessionV0> | null} */ (null)
  );
  const [mutationRevision, setMutationRevision] = useState(0);
  const [crossSessionCoherence, setCrossSessionCoherence] = useState(
    /** @type {{ coherenceLine?: string | null, hydrated?: boolean } | null} */ (null)
  );
  const [lastActionClosure, setLastActionClosure] = useState(
    /** @type {{ action: string, feedbackLine: string } | null} */ (null)
  );

  useEffect(() => {
    const touch = openLivingWorldBrowserSessionV0({ worldInstanceId: worldInstanceBoot.instanceId });
    setSessionTouch(touch);

    const hydrated = hydrateCrossSessionCoherenceV0({
      worldInstanceId: worldInstanceBoot.instanceId,
      lastVisitGapMs: touch.lastVisitGapMs,
      returning: touch.isReturnVisit
    });
    if (hydrated.coherenceLine) {
      setCrossSessionCoherence({
        coherenceLine: hydrated.coherenceLine,
        hydrated: hydrated.hydrated
      });
    }

    const onLeave = () => {
      sealLivingWorldSessionSnapshotV0(worldInstanceBoot.instanceId);
      sealWorldMutationLedgerV0(worldInstanceBoot.instanceId);
      sealCrossSessionCoherenceAnchorV0(worldInstanceBoot.instanceId);
    };
    window.addEventListener("pagehide", onLeave);
    return () => {
      window.removeEventListener("pagehide", onLeave);
      onLeave();
    };
  }, [worldInstanceBoot.instanceId]);

  const onLivingFrame = useCallback(
    (frame) => {
      setLivingFrame(frame);
      const wi = frame?.worldInstance?.instanceId || worldInstanceBoot.instanceId;
      touchLivingWorldPersistenceTickV0({
        worldInstanceId: wi,
        weatherType: frame?.atmosphere?.state?.ambient?.weatherType,
        castleAffordanceId: frame?.castle?.affordanceId,
        atmosphereLead: frame?.ribbon?.atmosphereLead
      });
    },
    [worldInstanceBoot.instanceId]
  );

  const worldInstance = livingFrame?.worldInstance ?? worldInstanceBoot;

  const mutationFeedback = useMemo(
    () =>
      buildWorldMutationFeedbackV0({
        worldInstanceId: worldInstance.instanceId,
        returning: Boolean(sessionTouch?.isReturnVisit)
      }),
    [worldInstance.instanceId, sessionTouch, mutationRevision]
  );

  const recordMutation = useCallback(
    (action) => {
      const result = recordWorldMutationV0({
        worldInstanceId: worldInstance.instanceId,
        action,
        identityBinding
      });
      if (result.ok && result.feedbackLine) {
        setLastActionClosure({ action, feedbackLine: result.feedbackLine });
      }
      setMutationRevision((n) => n + 1);
      return result;
    },
    [worldInstance.instanceId, identityBinding]
  );

  const onObserve = useCallback(() => {
    recordMutation(WORLD_MUTATION_ACTION_V0.OBSERVE);
  }, [recordMutation]);

  const onEnterCastle = useCallback(() => {
    recordMutation(WORLD_MUTATION_ACTION_V0.ENTER_CASTLE);
  }, [recordMutation]);

  const entryModel = useMemo(
    () =>
      buildRhizohLivingWorldEntryModelV0({
        worldInstance,
        livingFrame,
        sessionTouch,
        mutationFeedback,
        crossSessionCoherence,
        identityBinding,
        spiralPerceptionBridge: SPIRAL_PERCEPTION_BRIDGE_V0,
        spiralAgreementLayer: SPIRAL_AGREEMENT_LAYER_V0,
        lastActionClosure
      }),
    [worldInstance, livingFrame, sessionTouch, mutationFeedback, crossSessionCoherence, identityBinding, lastActionClosure]
  );

  useEffect(() => {
    runRhizohClagForLivingWorldFrameV0({
      entryModel,
      sessionId: identityBinding?.sessionIdentity,
      pathname: typeof window !== "undefined" ? window.location.pathname : "/"
    });
  }, [entryModel, identityBinding?.sessionIdentity]);

  return (
    <>
      <RhizohAtmospherePresenceBridge onLivingFrame={onLivingFrame} />
      <RhizohSpatialWorldShell
        entryModel={entryModel}
        onObserve={onObserve}
        onEnterCastle={onEnterCastle}
      />
    </>
  );
}
