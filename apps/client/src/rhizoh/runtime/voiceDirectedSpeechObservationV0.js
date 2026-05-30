/**
 * Directed speech observation — label only (Faz 1).
 * No turn authority; bands: ambient | unknown | directed_candidate.
 */

import { isSuspiciousWhisperArtifactV3 } from "./voiceEngineV3/voiceTranscriptSanityV3.js";
import {
  observeAmbientEnergyV0,
  VOICE_AMBIENT_ENERGY_TIER
} from "./voiceAmbientEnergyWitnessV0.js";

export const VOICE_DIRECTED_SPEECH_OBSERVATION_SCHEMA = "castle.rhizoh.voice_directed_speech_observation.v0";

export const VOICE_DIRECTED_SPEECH_BAND = Object.freeze({
  AMBIENT: "ambient",
  UNKNOWN: "unknown",
  DIRECTED_CANDIDATE: "directed_candidate"
});

/** TV / room / broadcast / system-echo patterns (witness only). */
const AMBIENT_PHRASE_PATTERNS_V0 = [
  /herkese\s+iyi\s+gec/i,
  /afiyet\s+olsun/i,
  /allah[a']?ya\s+emanet/i,
  /sağ\s*ol(un)?\s+amca/i,
  /görüşmek\s+üzere/i,
  /mikrofona\s+tekrar\s+bas/i,
  /en\s+az\s+bir\s+saniye\s+konuş/i,
  /teşekkür\s+ederim\s+.*hoşça/i,
  /iyi\s+akşamlar/i,
  /iyi\s+günler/i,
  /sunucu|yayıncı|kanal\s+\d/i,
  /seyirciler|izleyiciler/i
];

const DIRECTED_WAKE_PATTERNS_V0 = [
  /^(rhizoh|rizo|riza|rizoh)\b/i,
  /^dostum\b/i,
  /^hey\s+(rhizoh|rizo)\b/i
];

const DIRECTED_ADDRESS_PATTERNS_V0 = [
  /\b(rhizoh|rizo|riza)\b/i,
  /beni\s+duy/i,
  /duyabiliyor\s+musun/i,
  /indirebiliyor\s+musun/i,
  /burada\s+mısın/i,
  /şimdi\s+beni\s+duy/i,
  /bana\s+(söyle|anlat|cevap)/i,
  /nas[ıi]ls[ıi]n/i,
  /sohbet\s+et/i,
  /biraz\s+sohbet/i
];

function normalizeWitnessTextV0(text) {
  return String(text || "")
    .normalize("NFKC")
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, " ")
    .replace(/[""''`.,!?]/g, "")
    .trim();
}

/**
 * @param {string} norm
 */
function scoreAmbientV0(norm) {
  if (!norm) return { score: 0, hints: [] };
  const hints = [];
  let score = 0;
  if (isSuspiciousWhisperArtifactV3(norm, 0.5)) {
    score += 2;
    hints.push("whisper_artifact_phrase");
  }
  for (const re of AMBIENT_PHRASE_PATTERNS_V0) {
    if (re.test(norm)) {
      score += 1;
      hints.push(`ambient:${re.source.slice(0, 24)}`);
    }
  }
  if (/^(hoşça\s*kal|iyi\s+geceler|güle\s+güle)$/.test(norm)) {
    score += 2;
    hints.push("closing_salutation");
  }
  return { score, hints };
}

/**
 * @param {string} norm
 */
function scoreDirectedV0(norm) {
  if (!norm) return { score: 0, hints: [] };
  const hints = [];
  let score = 0;
  for (const re of DIRECTED_WAKE_PATTERNS_V0) {
    if (re.test(norm)) {
      score += 2;
      hints.push(`wake:${re.source.slice(0, 20)}`);
    }
  }
  for (const re of DIRECTED_ADDRESS_PATTERNS_V0) {
    if (re.test(norm)) {
      score += 1;
      hints.push(`address:${re.source.slice(0, 20)}`);
    }
  }
  if (/\?\s*$/.test(norm) && score > 0) {
    score += 1;
    hints.push("question_to_agent");
  }
  return { score, hints };
}

/**
 * @param {{
 *   text?: string,
 *   confidence?: number,
 *   strategy?: string,
 *   maxRms?: number,
 *   source?: string
 * }} [meta]
 */
export function classifyVoiceDirectedSpeechBandV0(meta = {}) {
  const text = String(meta.text || "").trim();
  const norm = normalizeWitnessTextV0(text);
  if (!norm) {
    const energy = observeAmbientEnergyV0(meta);
    return Object.freeze({
      band: VOICE_DIRECTED_SPEECH_BAND.UNKNOWN,
      hints: ["empty", ...energy.hints],
      ambientScore: 0,
      directedScore: 0,
      energyTier: energy.tier,
      energyRatio: energy.ratio,
      roomBaselineRms: energy.baseline
    });
  }

  const ambient = scoreAmbientV0(norm);
  const directed = scoreDirectedV0(norm);

  /** @type {string} */
  let band = VOICE_DIRECTED_SPEECH_BAND.UNKNOWN;
  if (directed.score >= 2 && directed.score > ambient.score) {
    band = VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE;
  } else if (directed.score >= 1 && ambient.score === 0) {
    band = VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE;
  } else if (ambient.score >= 2) {
    band = VOICE_DIRECTED_SPEECH_BAND.AMBIENT;
  } else if (ambient.score >= 1 && directed.score === 0) {
    band = VOICE_DIRECTED_SPEECH_BAND.AMBIENT;
  } else if (directed.score >= 1 && ambient.score >= 1) {
    band =
      directed.score >= ambient.score
        ? VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE
        : VOICE_DIRECTED_SPEECH_BAND.AMBIENT;
  }

  const energy = observeAmbientEnergyV0(meta);
  const hints = [...directed.hints, ...ambient.hints, ...energy.hints];

  if (
    band === VOICE_DIRECTED_SPEECH_BAND.UNKNOWN &&
    directed.score === 0 &&
    energy.tier === VOICE_AMBIENT_ENERGY_TIER.DISTANT
  ) {
    band = VOICE_DIRECTED_SPEECH_BAND.AMBIENT;
    hints.push("energy_distant_to_ambient_witness");
  }

  return Object.freeze({
    band,
    hints,
    ambientScore: ambient.score,
    directedScore: directed.score,
    energyTier: energy.tier,
    energyRatio: energy.ratio,
    roomBaselineRms: energy.baseline,
    clipMaxRms: energy.maxRms,
    preview: text.slice(0, 96),
    confidence: Number.isFinite(Number(meta.confidence)) ? Number(meta.confidence) : undefined,
    strategy: meta.strategy ? String(meta.strategy) : undefined,
    source: meta.source ? String(meta.source) : undefined
  });
}
