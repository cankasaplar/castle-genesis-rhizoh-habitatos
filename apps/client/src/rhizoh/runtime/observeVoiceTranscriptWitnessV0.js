/**
 * Ambient witness — re-export canonical pipeline (RAW → WITNESS → SHADOW → GATE).
 */

export const VOICE_WITNESS_OBSERVATION_SCHEMA = "castle.rhizoh.voice_witness_observation.v0";

export {
  witnessRawVoiceTranscriptV0,
  finalizeVoiceWitnessShadowV0,
  witnessVoiceStreamLifecycleV0,
  runVoiceTranscriptWitnessPipelineV0,
  getVoiceWitnessPipelineSnapshotV0,
  resetVoiceWitnessPipelineForTestV0,
  observeVoiceTranscriptWitnessV0
} from "./voiceTranscriptWitnessPipelineV0.js";
