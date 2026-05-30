/**

 * Turn bridge — product path: Global Meaning Engine (default fast route).

 * CLAG runs only when fast router selects full_pipeline.

 */



import { runRhizohGlobalMeaningTurnV0 } from "./rhizohGlobalMeaningEngineV0.js";
import { resolveCompanionFlowAckV0 } from "./rhizohCompanionLayerV0.js";

import { FAST_ROUTE_V0 } from "./rhizohFastConversationRouterV0.js";

import {

  ingestClagTurnContextV0,

  getClagGraphSnapshotV0

} from "./rhizohCrossLayerAwarenessGraphV0.js";

import {

  getLastRuntimeStabilitySnapshotV0,

  publishRuntimeStabilityV0

} from "./rhizohRuntimeStabilityLayerV0.js";

import { resolveClagPrimaryActiveSovereignNodeV0 } from "./rhizohClagNodeRegistryV0.js";

import { getRhizohCalibrationRootAnchorV0 } from "../spatial/geographicAnchorsV0.js";

import { CLAG_TRAVERSAL_PROFILE_V0 } from "./rhizohClagTraversalPolicyV0.js";



/**

 * LLM-turn pipeline — global meaning first; CLAG optional (full_pipeline only).

 *

 * @param {Parameters<typeof runRhizohGlobalMeaningTurnV0>[0]} input

 */

export function runRhizohClagForLlmTurnV0(input = {}) {

  const out = runRhizohGlobalMeaningTurnV0({

    ...input,

    text: input.message,

    sourcePath: input.sourcePath || "global_meaning_llm_turn"

  });



  const fastAck =

    out.route.route === FAST_ROUTE_V0.FAST_GREET

      ? resolveCompanionFlowAckV0(out.projection.language)

      : null;



  return Object.freeze({

    conversationDepth: out.conversationDepth,

    turnInfluencePre: out.turnInfluencePre,

    stability: out.stability,

    clagGraph: out.clagGraph,

    influenceBundle: out.influenceBundle,

    expression: out.expression,

    meaningFrame: out.meaningFrame,

    route: out.route,

    companion: out.companion,

    projection: out.projection,

    fastAck,

    softIntelligencePending: out.softIntelligencePending === true,

    awaitSoftIntelligence: out.awaitSoftIntelligence

  });

}



/**

 * Living-world frame tick — spiral · geo · collective without LLM.

 *

 * @param {{

 *   traceId?: string,

 *   sessionId?: string,

 *   entryModel?: ReturnType<import("../experience/rhizohLivingWorldEntryOrchestratorV0.js").buildRhizohLivingWorldEntryModelV0>,

 *   pathname?: string

 * }} input

 */

export function runRhizohClagForLivingWorldFrameV0(input = {}) {

  const model = input.entryModel;

  if (!model || typeof model !== "object") {

    return getLastRuntimeStabilitySnapshotV0() || getClagGraphSnapshotV0();

  }



  const primarySovereign = resolveClagPrimaryActiveSovereignNodeV0({ pathname: input.pathname });

  const calibrationRef = getRhizohCalibrationRootAnchorV0()?.id || null;

  const collective = model.worldState?.collectiveFeeling;

  const clagGraph = ingestClagTurnContextV0({

    traceId: input.traceId || `lw:${model.worldState?.worldInstance?.instanceId || "world"}`,

    sessionId: input.sessionId || model.identityBinding?.sessionIdentity || null,

    conversationPhase: model.returning ? "RETURN_VISIT" : "FIRST_OPEN",

    layerSpec: { id: 0, code: "living_world_entry" },

    pathname: input.pathname || "/",

    conversationDepth: {

      conversationMode: "explore",

      depthLevel: 1,

      continuityStrength: model.returning ? 0.5 : 0.2

    },

    storySnapshot: {

      whatHappenedLast: model.continuityStrip?.todayChanged || null,

      unresolvedThreads: model.crossSessionCoherence?.line ? [model.crossSessionCoherence.line] : [],

      storyContinuityScore: model.returning ? 0.55 : 0.25

    },

    turnInfluencePre: {

      dominantShaper: "narrative",

      shapingAnswer: "living_world_entry"

    },

    spiralAgreement: model.worldState?.spiralAgreement,

    geographicAnchor: primarySovereign?.geographicAnchorId || null,

    calibrationAnchorReference: calibrationRef,

    socialPulse: collective

      ? { mode: collective.mode || "collective", label: collective.label || null }

      : null,

    traversalProfile: CLAG_TRAVERSAL_PROFILE_V0.LIVING_WORLD_FRAME

  });



  return publishRuntimeStabilityV0({

    mode: "living_world_frame",

    clagGraph,

    conversationDepth: {

      conversationMode: "explore",

      depthLevel: 1,

      continuityStrength: model.returning ? 0.5 : 0.2

    },

    traceId: input.traceId,

    sessionId: input.sessionId || model.identityBinding?.sessionIdentity || null

  });

}



/** @deprecated Internal — use publishRuntimeStability via bridge helpers. */

export { getClagGraphSnapshotV0 as getInternalClagGraphSnapshotV0 };


