/**
 * Phase 2 — Cognitive birth. Lifecycle: active → warm → hibernating → archived.
 * Prompt uses conductor (single chorus). Embodiment via embodimentGate (separate seals).
 */

import { evaluateEmbodiment } from "./embodimentGate.js";
import { formatCognitiveChorusForPrompt } from "./cognitiveConductor.js";

export const COGNITIVE_BIRTH_THRESHOLD = 0.995;
/** Prompt / chorus cap */
export const MAX_ACTIVE_IN_CHORUS = 3;
/** @deprecated use MAX_ACTIVE_IN_CHORUS */
export const MAX_ACTIVE_COGNITIVE_THREADS = MAX_ACTIVE_IN_CHORUS;
/** Stored threads (active + warm + hibernating) */
export const MAX_STORED_COGNITIVE_THREADS = 8;
export const COGNITIVE_THREAD_PROMPT_CHARS = 400;
export const COGNITIVE_THREAD_TTL_MS = 900_000;

const ACTIVE_TO_WARM_MS = 120_000;
const WARM_TO_HIBERNATE_MS = 420_000;
const HIBERNATE_TO_ARCHIVE_MS = 720_000;

const EMBODIMENT_U = 0.34;
const EMBODIMENT_V = 0.38;
const EMBODIMENT_W = 0.28;

/** @param {number} x */
function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

function pushLifecycleImprint(timeline, row) {
  if (!timeline || typeof timeline !== "object") return;
  const arr = Array.isArray(timeline.cognitiveLifecycleImprints)
    ? timeline.cognitiveLifecycleImprints
    : [];
  timeline.cognitiveLifecycleImprints = [...arr, { ...row, at: Date.now() }].slice(-36);
}

function buildMissionSummary(env) {
  const role = String(env.semanticRoleHint || "listener");
  const temp = String(env.temperamentBias || "neutral");
  const mix = env.sourceIntentMix && typeof env.sourceIntentMix === "object" ? env.sourceIntentMix : {};
  const mStr = `B${Number(mix.BUILD).toFixed(2)} C${Number(mix.CRISIS).toFixed(2)} P${Number(mix.PLAY).toFixed(2)} O${Number(mix.OBSERVE).toFixed(2)}`;
  const base = `${role} · ${temp} · intents[${mStr}] · seed=${String(env.seedEntityId || "").slice(0, 18)}`;
  return base.slice(0, 280);
}

/**
 * @param {Record<string, unknown>} env
 * @param {number} now
 */
export function cognitiveSubThreadFromEnvelope(env, now) {
  const t = Number(now) || Date.now();
  const id = String(env.id || `cog_${t}`);
  return {
    id,
    role: String(env.semanticRoleHint || "listener"),
    temperamentBias: String(env.temperamentBias || "neutral"),
    seedEntityId: String(env.seedEntityId || ""),
    missionSummary: buildMissionSummary(env),
    sourceIntentMix:
      env.sourceIntentMix && typeof env.sourceIntentMix === "object" ? { ...env.sourceIntentMix } : {},
    bornAt: t,
    lastActivatedAt: t,
    ttlMs: COGNITIVE_THREAD_TTL_MS,
    embodimentScore: 0,
    utilityAccumulator: 0,
    activationCount: 1,
    status: "active",
    protoEnvelopeId: env.id || null,
    birthMitosisConfidence: clamp01(Number(env.mitosisConfidence) || 1),
    lastEmbodimentGate: null
  };
}

/**
 * @param {unknown[]} threads
 * @param {{
 *   now: number,
 *   routerIntent?: string,
 *   seedMaxRaw?: number,
 *   timeline?: Record<string, unknown> | null,
 *   trust?: number,
 *   familiarity?: number,
 *   bondScore?: number,
 *   socialPhysics?: Record<string, unknown> | null,
 *   fieldTheory?: Record<string, unknown> | null,
 *   tsge?: Record<string, unknown> | null,
 *   manualEmbodimentAuthority?: boolean,
 *   identityCoherenceHint?: number
 * }} opts
 */
export function stepCognitiveSubThreads(threads, opts) {
  const now = Number(opts.now) || Date.now();
  const raw = Array.isArray(threads)
    ? threads.map((x) => (x && typeof x === "object" ? { ...x } : null)).filter(Boolean)
    : [];
  const ri = String(opts.routerIntent || "").trim().toUpperCase();
  const load = Number(opts.seedMaxRaw) || 0;
  const signal = load > 1.16 || !!ri;
  const tl = opts.timeline && typeof opts.timeline === "object" ? opts.timeline : null;

  const trust = Number.isFinite(Number(opts.trust)) ? clamp01(Number(opts.trust)) : 0.45;
  const fam = Number.isFinite(Number(opts.familiarity)) ? clamp01(Number(opts.familiarity)) : 0.35;
  const bondScore = Number.isFinite(Number(opts.bondScore)) ? Number(opts.bondScore) : (trust + fam) / 2;

  const archivedOut = [];
  const next = [];

  for (const th of raw) {
    if (String(th.status || "") === "archived") continue;

    if (now - Number(th.bornAt || 0) > Number(th.ttlMs || COGNITIVE_THREAD_TTL_MS)) {
      archivedOut.push({ ...th, archiveReason: "ttl_cap" });
      continue;
    }

    let status = String(th.status || "active");
    const lastAct = Number(th.lastActivatedAt) || 0;
    const idleMs = Math.max(0, now - lastAct);

    if (status === "active") {
      if (signal) {
        th.lastActivatedAt = now;
        const utilBump = 0.045 + (load > 1.22 ? 0.035 : 0) + (ri ? 0.025 : 0);
        th.utilityAccumulator = clamp01(Number(th.utilityAccumulator || 0) + utilBump);
        th.activationCount = Number(th.activationCount || 0) + 1;
      } else if (idleMs > ACTIVE_TO_WARM_MS) {
        status = "warm";
      }
    } else if (status === "warm") {
      if (signal) {
        status = "active";
        th.lastActivatedAt = now;
        th.activationCount = Number(th.activationCount || 0) + 1;
      } else if (idleMs > WARM_TO_HIBERNATE_MS) {
        status = "hibernating";
      }
    } else if (status === "hibernating") {
      if (signal) {
        status = "warm";
        th.lastActivatedAt = now;
      } else if (idleMs > HIBERNATE_TO_ARCHIVE_MS) {
        archivedOut.push({ ...th, archiveReason: "cold_storage" });
        continue;
      }
    }

    const persist = Math.min(1, (now - Number(th.bornAt || now)) / 600_000);
    const bond = clamp01(th.utilityAccumulator || 0);
    th.embodimentScore = clamp01(
      EMBODIMENT_U * bond +
        EMBODIMENT_V * persist +
        EMBODIMENT_W * Math.min(1, Number(th.activationCount || 0) / 12)
    );

    th.status = status;

    next.push(th);
  }

  for (const th of next) {
    const peerRoles = next.filter((x) => x && x.id !== th.id).map((x) => String(x.role || ""));
    th.lastEmbodimentGate = evaluateEmbodiment(th, {
      now,
      routerIntent: ri,
      bondScore,
      trust,
      familiarity: fam,
      socialPhysics: opts.socialPhysics,
      socialFieldTheory: opts.fieldTheory,
      tsge: opts.tsge,
      peerRoles,
      identityCoherenceHint: Number(opts.identityCoherenceHint ?? 0.72),
      manualAuthorityGranted: !!opts.manualEmbodimentAuthority
    });
  }

  for (const a of archivedOut) {
    pushLifecycleImprint(tl, {
      kind: "cognitive_archived",
      threadId: a.id,
      role: a.role,
      seedEntityId: a.seedEntityId,
      reason: a.archiveReason || "unknown",
      utility: Number(a.utilityAccumulator) || 0,
      intentMix:
        a.sourceIntentMix && typeof a.sourceIntentMix === "object" ? { ...a.sourceIntentMix } : null
    });
  }

  next.sort((a, b) => Number(b.utilityAccumulator || 0) - Number(a.utilityAccumulator || 0));
  return next.slice(0, MAX_STORED_COGNITIVE_THREADS);
}

/**
 * @param {unknown[]} queue
 * @param {unknown[]} cognitiveThreads
 * @param {unknown} timeline
 * @param {Record<string, unknown>} opts
 */
export function graduateEmbryosToCognitiveThreads(queue, cognitiveThreads, timeline, opts) {
  const now = Number(opts.now) || Date.now();
  const q = Array.isArray(queue)
    ? queue.map((e) => (e && typeof e === "object" ? { ...e } : null)).filter(Boolean)
    : [];

  const baseOpts = { ...opts, now, timeline };
  let threads = stepCognitiveSubThreads(Array.isArray(cognitiveThreads) ? cognitiveThreads : [], baseOpts);

  const kept = [];
  for (const env of q) {
    if (env.status !== "gestating") continue;

    const m = clamp01(Number(env.mitosisConfidence) || 0);
    if (m < COGNITIVE_BIRTH_THRESHOLD) {
      kept.push(env);
      continue;
    }

    const dupThread = threads.some(
      (t) =>
        t.protoEnvelopeId === env.id ||
        (t.seedEntityId === env.seedEntityId &&
          t.role === env.semanticRoleHint &&
          now - Number(t.bornAt) < 120_000)
    );
    if (dupThread) {
      kept.push({ ...env, mitosisConfidence: 0.98 });
      continue;
    }

    threads.push(cognitiveSubThreadFromEnvelope(env, now));
  }

  threads = stepCognitiveSubThreads(threads, baseOpts);
  return { queue: kept, cognitiveThreads: threads };
}

/**
 * @param {unknown[]} threads
 * @param {Record<string, unknown>} [context] — bondScore, trust, familiarity, routerIntent for future MutationBias hooks
 */
export function formatCognitiveSubThreadsForPrompt(threads, context = {}) {
  return formatCognitiveChorusForPrompt(threads, context);
}
