import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const body = fs.readFileSync(
  path.join(root, "apps/client/src/rhizoh/runtime/_queryRhizohLLM_body.tmp.js"),
  "utf8"
);

const imports = `import { getCastleFlightConfig } from "../../castleFlight/castleFlightConfig.js";
import { getOrCreateCastleDevUid } from "../useRhizohGatewayMonitor.js";
import { parseDSL, detectCastleIntentWithoutCoords } from "../../kernel/rhizohCommandParser.js";
import { enqueueCastleRuntimeTransaction, TCEE_PHASE } from "../boot/index.js";
import {
  createRhizohClientTraceIdV0,
  logCastleLifecycleV0,
  logVoiceInfoV0,
  resolveRhizohTurnTraceIdV0
} from "./rhizohProductionLogNamespacesV0.js";
import { evaluateVoiceTurnAcceptanceV0, voiceTurnAcceptanceLogDetailV0 } from "./voiceTurnAcceptanceGateV0.js";
import {
  runVoiceTranscriptWitnessPipelineV0,
  runVoiceTurnGateAfterWitnessV0
} from "./voiceTranscriptWitnessPipelineV0.js";
import {
  finalizeVoiceBehavioralCommitmentV0,
  publishVoiceBehavioralCommitmentV0
} from "./voiceBehavioralCommitmentV0.js";
import { VOICE_DIRECTED_SPEECH_BAND } from "./voiceDirectedSpeechObservationV0.js";
import { buildRhizohContinuityHealthDetailV0, publishRhizohTrustDebugV0 } from "./rhizohTrustDebugV0.js";
import { recordReplyFormatDriftSampleV0, getReplyFormatDriftRollingV0 } from "./replyFormatDriftTrackerV0.js";
import {
  normalizeRhizohLlmGatewayResponseV0,
  resolveRhizohReplyForDisplayV0,
  toReplyFormatDriftSampleV0,
  publishRhizohLlmReplyNormalizedV0
} from "./rhizohLlmReplyNormalizeV0.js";
import { describeRhizohNarrativeLayerCapabilityV0 } from "./rhizohNarrativeLayerCapabilityV0.js";
import {
  buildRhizohHealthState,
  computeRhizohHealthInfluence,
  blendRelationalToneWithHealthRecommended,
  adjustRelationalToneForHealthLatency,
  formatReliabilityEpisodesSummaryForLlm
} from "../reliability/index.js";
import { deriveRhizohPolicy } from "../policy/index.js";
import { routeRhizohInput } from "../router/routeRhizohInput.js";
import {
  RHIZOH_CONVERSATION_ORCHESTRATOR_VERSION,
  advanceRhizohConversationPhase,
  buildRhizohConversationLlmDirective,
  buildRhizohProductCapabilityEnvelope,
  describeRhizohPhaseExitProgressV0
} from "../product/rhizohConversationOrchestratorV1.js";
import {
  loadRhizohProductSession,
  readRhizohExplicitPowerUnlock,
  saveRhizohProductSession
} from "../product/rhizohProductSessionPersistenceV1.js";
import { inferRhizohUserGoalHint } from "../experience/index.js";
import {
  applyEmotionDelta,
  applyRepairOutcome,
  deriveRelationalTone,
  readOutcomeSessionFromMeta,
  DEFAULT_EMOTIONS
} from "../emotion/index.js";
import {
  selectWeightedMemoryTurns,
  computeIdentityFeedbackFromRecall,
  applyRecallFeedbackToIdentityGraph,
  recallClosurePayloadForMeta
} from "../memory/index.js";
import { buildRhizohDriftLogEntry } from "../telemetry/index.js";
import {
  getRhizohStabilityAnchorSnapshot,
  normalizeGovernorCalibration,
  softClampEmotionsToIdentityAnchor,
  clampRelationalToneToAnchor,
  applyMemoryDominanceCap
} from "../stability/index.js";
import { readIdentityGraph } from "../../kernel/rhizohIdentityKernelV1.js";
`;

const preamble = `/**
 * Rhizoh LLM query — single client entry for text/voice turns (POST /rhizoh/llm).
 * RUNTIME INVARIANT: Gateway decides, client renders.
 * @see docs/RHIZOH_REPLY_NORMALIZATION_LAYER_V1.md
 */
`;

const postImports = `
export const RHIZOH_QUERY_LLM_SCHEMA_V1 = "castle.rhizoh.query_llm.v1";
export const TEXT_LLM_TIMEOUT_MS = 32_000;

const RHIZOH_GENERATION_MODE_MAX = {
  FAST_DIALOGUE: 120,
  STANDARD: 320,
  REFLECTIVE: 480,
  NARRATIVE: 640,
  DEEP_REASONING: 900
};

/** @type {{ applyPersonalCastleDsl?: Function, readClientContinuity?: Function, patchRhizohEmotionDisk?: Function, getUiRuntimeHints?: Function }} */
let _deps = {};

export function registerRhizohQueryLlmDepsV0(deps = {}) {
  _deps = { ..._deps, ...deps };
}

function readClientContinuity() {
  if (typeof _deps.readClientContinuity === "function") return _deps.readClientContinuity();
  return { turns: [], persona: {}, meta: {} };
}

function patchRhizohEmotionDisk(emotions, relationalTone, outcomeResonance, outcomeSession, driftLogEntry) {
  if (typeof _deps.patchRhizohEmotionDisk === "function") {
    _deps.patchRhizohEmotionDisk(emotions, relationalTone, outcomeResonance, outcomeSession, driftLogEntry);
  }
}

function normalizeRhizohGenerationModeId(mode) {
  return String(mode || "STANDARD").trim().toUpperCase().replace(/-/g, "_");
}
`;

let fixed = body
  .replace(/^function logRhizohHealth/m, "export function logRhizohHealth")
  .replace(/^async function queryRhizohLLM/m, "export async function queryRhizohLLM")
  .replace(
    /const dslParsed = parseDSL\(trimmed\);\s*\n\s*if \(dslParsed\) \{\s*\n\s*const out = await applyPersonalCastleDsl\(dslParsed\);/,
    `const dslParsed = parseDSL(trimmed);
  if (dslParsed) {
    if (typeof _deps.applyPersonalCastleDsl !== "function") {
      return { reply: "DSL komutu bu yuzeyde kullanilamiyor.", directive: "FOCUS_RHIZOH", source: "dsl-unavailable" };
    }
    const out = await _deps.applyPersonalCastleDsl(dslParsed);`
  )
  .replace(
    /try \{\s*\n\s*const st = uiStore\.getState\(\);\s*\n\s*runtimeHints = \{\s*\n\s*realityMode: st\.realityMode,\s*\n\s*mapSurfaceActive: st\.mapSurfaceActive,\s*\n\s*layerFocus: st\.layerFocus,\s*\n\s*governanceState: st\.governanceState\s*\n\s*\};\s*\n\s*\} catch \{\s*\n\s*runtimeHints = \{\};\s*\n\s*\}/s,
    `try {
      if (typeof _deps.getUiRuntimeHints === "function") {
        runtimeHints = { ...runtimeHints, ..._deps.getUiRuntimeHints() };
      }
    } catch {
      runtimeHints = {};
    }`
  );

const outPath = path.join(root, "apps/client/src/rhizoh/runtime/rhizohQueryLlmV1.js");
fs.writeFileSync(outPath, `${preamble}\n${imports}\n${postImports}\n${fixed}\n`);
console.log("wrote", outPath, fixed.split("\n").length, "body lines");
