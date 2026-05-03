/** Geriye dönük: tüm API `rhizoh/health/cognitiveReliability.js` içinde. */
export {
  RELIABILITY_BAD_OUTAGE_PHASES,
  isReliabilityOutagePhase,
  buildRhizohHealthState,
  computeRhizohHealthInfluence,
  blendRelationalToneWithHealthRecommended,
  adjustRelationalToneForHealthLatency,
  stepReliabilityEpisodesMeta,
  appendReliabilityEpisode,
  formatReliabilityEpisodesSummaryForLlm,
  summarizeRecentEpisodes
} from "../health/cognitiveReliability.js";
