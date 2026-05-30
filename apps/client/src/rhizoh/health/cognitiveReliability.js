/**
 * Bilişsel güvenilirlik: gateway telemetry → healthState, healthInfluence (delta katmanı),
 * histerezisli kesinti episodları, LLM özeti, recommendedTone → ilişkisel ton harmanı.
 */

import { clampEmotion } from "../emotion/emotionState.js";

/** @typedef {"CONNECTED"|"DEGRADED_LLM"|"DEGRADED_STORAGE"|"DEGRADED"|"OFFLINE_DNS"|"OFFLINE"|"MAINTENANCE"|"CONNECTING"|"UNCONFIGURED"} RhizohConnectivity */

export const RELIABILITY_BAD_OUTAGE_PHASES = new Set(["offline", "offline_dns", "maintenance"]);

const MIN_BAD_DWELL_MS = 20_000;
const CONNECTED_POLLS_TO_RECOVER = 2;

/**
 * @param {string} phase
 */
export function isReliabilityOutagePhase(phase) {
  return RELIABILITY_BAD_OUTAGE_PHASES.has(String(phase || ""));
}

/**
 * @param {{
 *   gatewayPhase?: string,
 *   healthDeps?: Record<string, unknown> | null,
 *   mapSurfaceActive?: boolean
 * }} input
 */
export function buildRhizohHealthState(input = {}) {
  const phase = String(input.gatewayPhase || "initializing");
  const deps = input.healthDeps && typeof input.healthDeps === "object" ? input.healthDeps : null;
  const mapSurfaceActive = !!input.mapSurfaceActive;

  const latencyRaw = deps != null ? Number(deps.latencyMs) : NaN;
  const latencyMs = Number.isFinite(latencyRaw) ? latencyRaw : null;

  const llmOk = deps == null || deps.llm !== false;
  const firestoreOk = deps == null || deps.persistence !== "firebase" || deps.firestore !== false;
  const depsOverallOk = deps == null || deps.ok !== false;

  /** @type {RhizohConnectivity} */
  let connectivity = "CONNECTING";
  const symptoms = [];
  let confidence = 0.82;

  if (phase === "unconfigured") {
    connectivity = "UNCONFIGURED";
    confidence = 0.5;
    symptoms.push("gateway_unconfigured");
  } else if (phase === "maintenance") {
    connectivity = "MAINTENANCE";
    confidence = 0.35;
    symptoms.push("gateway_maintenance");
  } else if (phase === "offline_dns") {
    connectivity = "OFFLINE_DNS";
    confidence = 0.2;
    symptoms.push("dns_unresolved");
  } else if (phase === "offline") {
    connectivity = "OFFLINE";
    confidence = 0.18;
    symptoms.push("gateway_unreachable");
  } else if (phase === "degraded_llm" || (phase === "connected" && deps && deps.llm === false)) {
    connectivity = "DEGRADED_LLM";
    confidence = 0.72;
    symptoms.push("remote_llm_unreachable");
  } else if (
    phase === "degraded_storage" ||
    (phase === "connected" && deps && deps.persistence === "firebase" && deps.firestore === false)
  ) {
    connectivity = "DEGRADED_STORAGE";
    confidence = 0.62;
    symptoms.push("remote_storage_degraded");
  } else if (phase === "degraded") {
    connectivity = "DEGRADED";
    confidence = 0.58;
    if (!depsOverallOk) symptoms.push("deps_degraded");
  } else if (phase === "uncertain") {
    connectivity = "DEGRADED";
    confidence = 0.6;
    symptoms.push("gateway_health_uncertain");
    if (deps && !depsOverallOk) symptoms.push("deps_partial");
  } else if (phase === "connected") {
    if (!depsOverallOk) {
      connectivity = "DEGRADED";
      confidence = 0.55;
      symptoms.push("deps_partial");
    } else {
      connectivity = "CONNECTED";
      confidence = Math.min(0.98, 0.88 + (latencyMs != null && latencyMs < 200 ? 0.06 : 0));
    }
  } else {
    connectivity = "CONNECTING";
    confidence = 0.45;
    symptoms.push("gateway_handshake");
  }

  if (latencyMs != null && latencyMs > 600) {
    if (!symptoms.includes("high_neural_latency")) symptoms.push("high_neural_latency");
    confidence = Math.max(0.25, confidence - 0.08);
  }

  const memoryRead = phase !== "offline" && phase !== "offline_dns";
  const memoryWrite =
    phase !== "maintenance" && phase !== "offline" && phase !== "offline_dns" && firestoreOk;
  const remoteReasoning =
    phase === "connected" && llmOk && phase !== "maintenance" && phase !== "offline" && phase !== "offline_dns";

  /** @type {string} — blendRelationalToneWithHealthRecommended için anahtar */
  let recommendedToneHealthKey = "neutral";
  if (connectivity === "MAINTENANCE" || connectivity === "OFFLINE" || connectivity === "OFFLINE_DNS") {
    recommendedToneHealthKey = "repair_and_comfort";
  } else if (symptoms.includes("high_neural_latency")) {
    recommendedToneHealthKey = "patient_and_direct";
  } else if (connectivity === "DEGRADED_STORAGE") {
    recommendedToneHealthKey = "cautious";
  } else if (connectivity === "DEGRADED_LLM" || connectivity === "DEGRADED") {
    recommendedToneHealthKey = "containment";
  } else if (connectivity === "CONNECTED") {
    recommendedToneHealthKey = "neutral";
  } else {
    recommendedToneHealthKey = "steady";
  }

  return {
    connectivity,
    confidence: Math.round(confidence * 1000) / 1000,
    symptoms,
    capabilities: {
      memoryRead,
      memoryWrite,
      remoteReasoning,
      mapSurface: mapSurfaceActive
    },
    recommendedTone: recommendedToneHealthKey,
    recommendedToneHealthKey,
    latencyMs,
    gatewayPhase: phase
  };
}

/**
 * Tek duygu otoritesi: altyapı etkisi yalnız delta — meta.emotions üzerine yazılmaz.
 * @param {ReturnType<typeof buildRhizohHealthState> | null | undefined} healthState
 */
export function computeRhizohHealthInfluence(healthState) {
  const now = Date.now();
  if (!healthState || typeof healthState !== "object") {
    return {
      trustDelta: 0,
      tensionDelta: 0,
      wonderDelta: 0,
      careDelta: 0,
      ruptureDelta: 0,
      repairDelta: 0,
      familiarityDelta: 0,
      updatedAt: now
    };
  }
  const cap = healthState.capabilities && typeof healthState.capabilities === "object" ? healthState.capabilities : {};
  let trustDelta = 0;
  let tensionDelta = 0;
  let wonderDelta = 0;
  let careDelta = 0;
  let ruptureDelta = 0;
  let repairDelta = 0;
  let familiarityDelta = 0;

  if (cap.remoteReasoning === false) {
    careDelta += 0.12;
    repairDelta += 0.18;
    wonderDelta -= 0.04;
  }
  if (cap.memoryWrite === false) {
    ruptureDelta += 0.15;
    tensionDelta += 0.08;
  }
  const sy = Array.isArray(healthState.symptoms) ? healthState.symptoms : [];
  if (sy.includes("high_neural_latency")) {
    tensionDelta += 0.05;
    trustDelta -= 0.02;
  }

  return {
    trustDelta,
    tensionDelta,
    wonderDelta,
    careDelta,
    ruptureDelta,
    repairDelta,
    familiarityDelta,
    updatedAt: now
  };
}

const HEALTH_TONE_PRESETS = {
  neutral: { warmth: 0.7, directness: 0.65, patience: 0.7, depth: 0.55 },
  containment: { warmth: 0.62, directness: 0.82, patience: 0.55, depth: 0.48 },
  cautious: { warmth: 0.68, directness: 0.71, patience: 0.74, depth: 0.58 },
  patient_and_direct: { warmth: 0.66, directness: 0.8, patience: 0.88, depth: 0.45 },
  repair_and_comfort: { warmth: 0.86, directness: 0.54, patience: 0.91, depth: 0.72 },
  steady: { warmth: 0.7, directness: 0.65, patience: 0.72, depth: 0.55 },
  hold: { warmth: 0.75, directness: 0.5, patience: 0.85, depth: 0.6 },
  repair: { warmth: 0.86, directness: 0.54, patience: 0.91, depth: 0.72 }
};

/**
 * Duygudan gelen ton + sağlık önerilen ton (varsayılan %25 sağlık).
 * @param {Record<string, number>} emotionalTone — deriveRelationalTone çıktısı
 * @param {ReturnType<typeof buildRhizohHealthState> | null | undefined} healthState
 * @param {number} [healthWeight]
 */
export function blendRelationalToneWithHealthRecommended(emotionalTone, healthState, healthWeight = 0.25) {
  if (!emotionalTone || typeof emotionalTone !== "object") return emotionalTone;
  if (!healthState || typeof healthState !== "object") return emotionalTone;
  const key = String(healthState.recommendedToneHealthKey || healthState.recommendedTone || "neutral");
  const preset = HEALTH_TONE_PRESETS[key] || HEALTH_TONE_PRESETS.neutral;
  const w = Math.max(0, Math.min(0.45, healthWeight));
  const e = 1 - w;
  const blend = (a, b) => clampEmotion(Number(a) * e + Number(b) * w);
  return {
    warmth: Number(blend(emotionalTone.warmth, preset.warmth).toFixed(3)),
    directness: Number(blend(emotionalTone.directness, preset.directness).toFixed(3)),
    patience: Number(blend(emotionalTone.patience, preset.patience).toFixed(3)),
    depth: Number(blend(emotionalTone.depth, preset.depth).toFixed(3))
  };
}

/**
 * Gecikme için ek mikro-ayar (blend sonrası, hâlâ >600 ms).
 * @param {Record<string, number>} tone
 * @param {ReturnType<typeof buildRhizohHealthState> | null | undefined} hs
 */
export function adjustRelationalToneForHealthLatency(tone, hs) {
  if (!tone || !hs || typeof hs !== "object") return tone;
  const lat = hs.latencyMs;
  if (lat == null || !Number.isFinite(Number(lat)) || Number(lat) <= 600) return tone;
  const out = { ...tone };
  out.directness = clampEmotion(Number(out.directness) + 0.06);
  out.depth = clampEmotion(Number(out.depth) - 0.08);
  out.patience = clampEmotion(Number(out.patience) + 0.06);
  return {
    warmth: Number(Number(out.warmth).toFixed(3)),
    directness: Number(out.directness.toFixed(3)),
    patience: Number(out.patience.toFixed(3)),
    depth: Number(out.depth.toFixed(3))
  };
}

/**
 * Histerezis: kötü faz ≥20s kesintisiz → episod aç; iyileşme → ardışık 2 sağlık poll’u connected.
 * @param {Record<string, unknown>} meta
 * @param {string} rawPhase
 * @param {number} now
 * @param {number} healthPollSerial
 */
export function stepReliabilityEpisodesMeta(meta, rawPhase, now, healthPollSerial) {
  const episodes = Array.isArray(meta.rhizohReliabilityEpisodes) ? meta.rhizohReliabilityEpisodes.slice() : [];
  const prevFsm = meta.rhizohReliabilityFsm && typeof meta.rhizohReliabilityFsm === "object" ? meta.rhizohReliabilityFsm : {};

  const fsm = {
    badEnteredAt: prevFsm.badEnteredAt ?? null,
    outageOpenFor: prevFsm.outageOpenFor ?? null,
    connectedStreak: Number(prevFsm.connectedStreak) || 0,
    lastPollSerial: Number(prevFsm.lastPollSerial) ?? -1
  };

  const raw = String(rawPhase || "");
  const isBad = isReliabilityOutagePhase(raw);

  if (isBad) {
    if (fsm.badEnteredAt == null) fsm.badEnteredAt = now;
  } else {
    fsm.badEnteredAt = null;
  }

  let newPoll = false;
  if (healthPollSerial !== fsm.lastPollSerial) {
    fsm.lastPollSerial = healthPollSerial;
    newPoll = true;
    if (raw === "connected") {
      fsm.connectedStreak = (fsm.connectedStreak || 0) + 1;
    } else {
      fsm.connectedStreak = 0;
    }
  }

  const openIdx = episodes.findIndex((e) => e && typeof e === "object" && e.recoveredAt == null);

  if (isBad && fsm.badEnteredAt != null && now - fsm.badEnteredAt >= MIN_BAD_DWELL_MS && !fsm.outageOpenFor) {
    episodes.push({
      phase: raw,
      startedAt: fsm.badEnteredAt,
      recoveredAt: null,
      durationMs: null
    });
    fsm.outageOpenFor = raw;
  }

  if (
    !isBad &&
    raw === "connected" &&
    openIdx >= 0 &&
    fsm.connectedStreak >= CONNECTED_POLLS_TO_RECOVER &&
    newPoll
  ) {
    const e = episodes[openIdx];
    if (e && typeof e === "object") {
      const started = Number(e.startedAt) || now;
      episodes[openIdx] = {
        ...e,
        recoveredAt: now,
        durationMs: Math.max(0, now - started)
      };
    }
    fsm.connectedStreak = 0;
    fsm.outageOpenFor = null;
  }

  if (isBad && openIdx >= 0 && fsm.outageOpenFor && episodes[openIdx] && String(episodes[openIdx].phase) !== raw) {
    episodes[openIdx] = { ...episodes[openIdx], phase: raw };
  }

  return {
    rhizohReliabilityEpisodes: episodes.slice(-24),
    rhizohReliabilityFsm: fsm
  };
}

/** @deprecated histerezis için stepReliabilityEpisodesMeta kullanın */
export function appendReliabilityEpisode(prev, transition) {
  const list = Array.isArray(prev) ? prev.slice() : [];
  const { prevPhase, nextPhase, now } = transition;
  const prevBad = isReliabilityOutagePhase(prevPhase);
  const nextBad = isReliabilityOutagePhase(nextPhase);
  const openIdx = list.findIndex((e) => e && typeof e === "object" && !e.recoveredAt);
  if (nextBad && !prevBad) {
    list.push({ phase: nextPhase, startedAt: now, recoveredAt: null, durationMs: null });
    return list.slice(-24);
  }
  if (nextBad && prevBad && openIdx >= 0) {
    const cur = list[openIdx];
    if (cur && typeof cur === "object" && String(cur.phase) !== String(nextPhase)) {
      list[openIdx] = { ...cur, phase: nextPhase };
    }
    return list.slice(-24);
  }
  if (!nextBad && prevBad && openIdx >= 0) {
    const e = list[openIdx];
    if (e && typeof e === "object") {
      const started = Number(e.startedAt) || now;
      list[openIdx] = { ...e, recoveredAt: now, durationMs: Math.max(0, now - started) };
    }
    return list.slice(-24);
  }
  return list.slice(-24);
}

/**
 * @param {unknown} episodes
 * @param {string} [locale]
 */
export function formatReliabilityEpisodesSummaryForLlm(episodes, locale = "tr") {
  return summarizeRecentEpisodes(episodes, locale);
}

/**
 * @param {unknown} episodes
 * @param {string} [locale]
 */
export function summarizeRecentEpisodes(episodes, locale = "tr") {
  const arr = Array.isArray(episodes) ? episodes : [];
  const open = [...arr].reverse().find((e) => e && typeof e === "object" && e.recoveredAt == null);
  if (open) {
    const ph = String(open.phase || "outage");
    if (locale === "tr") {
      return `Şu an [${ph}] fazındayız. Bilişsel yeteneklerim kısıtlı olabilir; kısa ve net kalacağım.`;
    }
    return `Currently in [${ph}] — capabilities may be limited.`;
  }
  const closed = arr.filter(
    (e) => e && typeof e === "object" && e.recoveredAt != null && Number(e.durationMs) >= 25_000
  );
  if (!closed.length) {
    if (locale === "tr") return "Sistem bağlantısı bu oturumda stabil görünüyor.";
    return "Connection stability looks good this session.";
  }
  const last = closed[closed.length - 1];
  const ms = Number(last.durationMs) || 0;
  const mins = Math.max(1, Math.round(ms / 60_000));
  const phase = String(last.phase || "outage");
  const phaseTr =
    phase === "offline_dns"
      ? "DNS/bağlantı"
      : phase === "offline"
        ? "çevrimdışı"
        : phase === "maintenance"
          ? "bakım"
          : phase;
  if (locale === "tr") {
    return `Son oturumda yaklaşık ${mins} dakikalık bağlantı kopması (${phaseTr}) yaşandı; sistem geri kazanıldı.`;
  }
  return `Session had ~${mins} min outage (${phase}); system recovered.`;
}
