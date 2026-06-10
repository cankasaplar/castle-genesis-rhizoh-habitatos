/**
 * RHIZOH_DIALOGUE_THREAD_V1 — Rhizoh dialogue continuity engine.
 *
 * Design lock:
 *   Fox konuşmayı üretmez; konuşmanın ritmini ve derinliğini belirler (context physics).
 *   Rhizoh cevap üretmez; konuşma akışını üretir (dialogue continuity).
 *
 * Holds: previous turn · emotional trajectory · narrative slope · unresolved semantic tension
 */

export const RHIZOH_DIALOGUE_THREAD_SCHEMA_V1 = "castle.rhizoh.dialogue_thread.v1";
export const RHIZOH_DIALOGUE_ENGINE_ROLE_V1 = "dialogue_continuity_engine";
export const FOX_CONTEXT_PHYSICS_ROLE_V1 = "context_physics_engine";

const TRAJECTORY_MAX_SAMPLES_V1 = 12;
const TENSION_ITEMS_MAX_V1 = 8;

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function round3(n) {
  return Math.round(clamp01(n) * 1000) / 1000;
}

function trimText(s, max) {
  return String(s || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/**
 * @param {unknown} prev
 */
export function coalesceRhizohDialogueThreadV1(prev) {
  const p = prev && typeof prev === "object" ? prev : {};
  return Object.freeze({
    schema: RHIZOH_DIALOGUE_THREAD_SCHEMA_V1,
    role: RHIZOH_DIALOGUE_ENGINE_ROLE_V1,
    turnIndex: Math.max(0, Math.floor(Number(p.turnIndex) || 0)),
    previousTurn:
      p.previousTurn && typeof p.previousTurn === "object"
        ? Object.freeze({
            user: trimText(p.previousTurn.user, 500),
            assistant: trimText(p.previousTurn.assistant, 900),
            intent: String(p.previousTurn.intent || "CHAT").slice(0, 32),
            atMs: Number(p.previousTurn.atMs) || 0,
            turnIndex: Math.max(0, Math.floor(Number(p.previousTurn.turnIndex) || 0))
          })
        : null,
    emotionalTrajectory: normalizeEmotionalTrajectoryV1(p.emotionalTrajectory),
    narrativeSlope: normalizeNarrativeSlopeV1(p.narrativeSlope),
    unresolvedSemanticTension: normalizeSemanticTensionV1(p.unresolvedSemanticTension),
    dialogueCurve: normalizeDialogueCurveV1(p.dialogueCurve),
    updatedAt: Number(p.updatedAt) || 0
  });
}

function normalizeEmotionalTrajectoryV1(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const samples = Array.isArray(r.samples)
    ? r.samples.slice(-TRAJECTORY_MAX_SAMPLES_V1).map((s) =>
        Object.freeze({
          turnIndex: Math.max(0, Math.floor(Number(s?.turnIndex) || 0)),
          tension: round3(s?.tension),
          repair: round3(s?.repair),
          care: round3(s?.care),
          trust: round3(s?.trust),
          atMs: Number(s?.atMs) || 0
        })
      )
    : [];
  return Object.freeze({
    samples,
    slope: round3(r.slope),
    direction: String(r.direction || "steady").slice(0, 32),
    tensionEma: round3(r.tensionEma),
    repairEma: round3(r.repairEma)
  });
}

function normalizeNarrativeSlopeV1(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  return Object.freeze({
    direction: trimText(r.direction, 120) || "steady_presence",
    steepness: round3(r.steepness),
    phase: trimText(r.phase, 32) || "stabilize"
  });
}

function normalizeSemanticTensionV1(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const items = Array.isArray(r.items)
    ? r.items.slice(-TENSION_ITEMS_MAX_V1).map((it) =>
        Object.freeze({
          id: String(it?.id || "").slice(0, 48),
          label: trimText(it?.label, 160),
          weight: round3(it?.weight),
          source: String(it?.source || "turn").slice(0, 32)
        })
      )
    : [];
  return Object.freeze({
    items,
    aggregate: round3(r.aggregate)
  });
}

function normalizeDialogueCurveV1(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  return Object.freeze({
    continuity: round3(r.continuity),
    tension: round3(r.tension),
    momentum: String(r.momentum || "opening").slice(0, 24)
  });
}

/**
 * @param {Record<string, number>} emotions
 */
function emotionSampleFromStateV1(emotions, turnIndex, atMs) {
  const em = emotions && typeof emotions === "object" ? emotions : {};
  return Object.freeze({
    turnIndex,
    tension: round3(em.tension),
    repair: round3(em.repair),
    care: round3(em.care),
    trust: round3(em.trust),
    atMs
  });
}

/**
 * @param {ReturnType<typeof normalizeEmotionalTrajectoryV1>["samples"]} samples
 */
function computeTrajectoryMetricsV1(samples) {
  if (!samples.length) {
    return Object.freeze({ slope: 0, direction: "steady", tensionEma: 0.2, repairEma: 0.2 });
  }
  const first = samples[0];
  const last = samples[samples.length - 1];
  const slope = round3(last.tension - first.tension);
  const tensionEma = round3(
    samples.reduce((acc, s) => acc + s.tension, 0) / samples.length
  );
  const repairEma = round3(
    samples.reduce((acc, s) => acc + s.repair, 0) / samples.length
  );

  let direction = "steady";
  if (slope > 0.12 && tensionEma > 0.38) direction = "rising_tension";
  else if (repairEma > 0.35 && tensionEma < 0.32) direction = "repairing";
  else if (last.care > first.care + 0.08 || last.trust > first.trust + 0.06) direction = "deepening";

  return Object.freeze({ slope, direction, tensionEma, repairEma });
}

/**
 * @param {Record<string, unknown> | null} narrativeArc
 * @param {Record<string, unknown> | null} narrativeThread
 */
function computeNarrativeSlopeV1(narrativeArc, narrativeThread) {
  const arc = narrativeArc && typeof narrativeArc === "object" ? narrativeArc : {};
  const thread = narrativeThread && typeof narrativeThread === "object" ? narrativeThread : {};
  const chain = Array.isArray(thread.intentChain) ? thread.intentChain.map(String) : [];
  const intentFocus =
    chain.length >= 2 ? chain.filter((x) => x === chain[chain.length - 1]).length / chain.length : 0;
  const bondTrend = Math.abs(Number(arc.bondTrend) || 0);
  const steepness = round3(Math.min(1, intentFocus * 0.55 + bondTrend * 0.45 + (chain.length >= 4 ? 0.12 : 0)));
  return Object.freeze({
    direction: trimText(arc.trajectory || arc.direction, 120) || "steady_presence",
    steepness,
    phase: trimText(arc.phase, 32) || "stabilize"
  });
}

/**
 * @param {{
 *   userMessage?: string,
 *   narrativeThread?: Record<string, unknown> | null,
 *   narrativeArc?: Record<string, unknown> | null,
 *   memoryEpisodes?: unknown[],
 *   previousTurn?: { user?: string, assistant?: string } | null
 * }} input
 */
function collectSemanticTensionItemsV1(input) {
  /** @type {Array<{ id: string, label: string, weight: number, source: string }>} */
  const items = [];
  const user = trimText(input.userMessage, 500);
  const prev = input.previousTurn && typeof input.previousTurn === "object" ? input.previousTurn : null;

  if (user.includes("?")) {
    items.push({
      id: "open_question",
      label: user.slice(0, 160),
      weight: 0.62,
      source: "user_question"
    });
  }
  if (prev?.user && !prev?.assistant) {
    items.push({
      id: "unanswered_user",
      label: trimText(prev.user, 160),
      weight: 0.55,
      source: "prior_turn_gap"
    });
  }

  const thread = input.narrativeThread && typeof input.narrativeThread === "object" ? input.narrativeThread : {};
  if (thread.focusIntent && String(thread.focusIntent) !== "CHAT") {
    items.push({
      id: `intent_${String(thread.focusIntent).slice(0, 16)}`,
      label: `devam eden niyet: ${String(thread.focusIntent)}`,
      weight: 0.42,
      source: "intent_chain"
    });
  }

  const arc = input.narrativeArc && typeof input.narrativeArc === "object" ? input.narrativeArc : {};
  if (arc.phase === "repair" || arc.trajectory === "crisis_or_stress") {
    items.push({
      id: "arc_stress",
      label: trimText(arc.direction || "stres hattı açık", 160),
      weight: 0.68,
      source: "narrative_arc"
    });
  }

  const episodes = Array.isArray(input.memoryEpisodes) ? input.memoryEpisodes : [];
  if (episodes.length) {
    const ep = episodes[episodes.length - 1];
    if (ep && typeof ep === "object" && (ep.summary || ep.text)) {
      items.push({
        id: "episode_tail",
        label: trimText(ep.summary || ep.text, 160),
        weight: 0.36,
        source: "memory_episode"
      });
    }
  }

  return items.slice(-TENSION_ITEMS_MAX_V1);
}

/**
 * @param {Array<{ weight: number }>} items
 * @param {number} tensionEma
 */
function aggregateSemanticTensionV1(items, tensionEma) {
  if (!items.length) return round3(tensionEma * 0.35);
  const top = items.reduce((acc, it) => acc + clamp01(it.weight), 0) / items.length;
  return round3(Math.min(1, top * 0.72 + tensionEma * 0.28));
}

/**
 * @param {ReturnType<typeof coalesceRhizohDialogueThreadV1>} thread
 * @param {string} [intent]
 */
function computeDialogueCurveV1(thread, intent) {
  const traj = thread.emotionalTrajectory;
  const slope = thread.narrativeSlope;
  const tension = thread.unresolvedSemanticTension.aggregate;
  const turns = thread.turnIndex;
  const continuity = round3(
    Math.min(1, 0.25 + turns * 0.025 + slope.steepness * 0.35 + (thread.previousTurn ? 0.18 : 0))
  );

  let momentum = "opening";
  if (intent === "CONCLUDE" || String(intent).includes("CONCLUDE")) momentum = "closing";
  else if (turns >= 8 && traj.direction === "deepening") momentum = "deepening";
  else if (traj.direction === "rising_tension") momentum = "stalled";
  else if (turns >= 3) momentum = "sustaining";

  return Object.freeze({ continuity, tension: round3(tension), momentum });
}

/**
 * Pre-turn snapshot — read continuity, do not mutate store.
 * @param {{
 *   prev?: Record<string, unknown> | null,
 *   narrativeThread?: Record<string, unknown> | null,
 *   narrativeArc?: Record<string, unknown> | null,
 *   memoryEpisodes?: unknown[],
 *   recentTurns?: Array<{ user?: string, assistant?: string, ts?: number }>,
 *   emotions?: Record<string, number> | null,
 *   userTurnCount?: number,
 *   atMs?: number
 * }} input
 */
export function buildRhizohDialogueThreadSnapshotV1(input = {}) {
  const atMs = Number(input.atMs) || Date.now();
  const prev = coalesceRhizohDialogueThreadV1(input.prev);
  const turns = Array.isArray(input.recentTurns) ? input.recentTurns : [];
  const last = turns.length ? turns[turns.length - 1] : prev.previousTurn;
  const turnIndex = Math.max(prev.turnIndex, Math.floor(Number(input.userTurnCount) || 0));

  const previousTurn =
    last && (last.user || last.assistant)
      ? Object.freeze({
          user: trimText(last.user, 500),
          assistant: trimText(last.assistant, 900),
          intent: String(prev.previousTurn?.intent || input.narrativeThread?.focusIntent || "CHAT").slice(
            0,
            32
          ),
          atMs: Number(last.ts || prev.previousTurn?.atMs) || atMs,
          turnIndex: Math.max(0, turnIndex - 1)
        })
      : prev.previousTurn;

  const sample = emotionSampleFromStateV1(input.emotions, turnIndex, atMs);
  const samples =
    prev.emotionalTrajectory.samples.length > 0
      ? prev.emotionalTrajectory.samples
      : sample.tension + sample.repair + sample.care > 0
        ? [sample]
        : [];
  const trajectoryMetrics = computeTrajectoryMetricsV1(samples);
  const emotionalTrajectory = Object.freeze({
    samples,
    ...trajectoryMetrics
  });

  const narrativeSlope = computeNarrativeSlopeV1(input.narrativeArc, input.narrativeThread);
  const tensionItems = collectSemanticTensionItemsV1({
    userMessage: "",
    narrativeThread: input.narrativeThread,
    narrativeArc: input.narrativeArc,
    memoryEpisodes: input.memoryEpisodes,
    previousTurn
  });
  const unresolvedSemanticTension = Object.freeze({
    items: tensionItems.map((it) => Object.freeze(it)),
    aggregate: aggregateSemanticTensionV1(tensionItems, trajectoryMetrics.tensionEma)
  });

  const draft = coalesceRhizohDialogueThreadV1({
    ...prev,
    turnIndex,
    previousTurn,
    emotionalTrajectory,
    narrativeSlope,
    unresolvedSemanticTension,
    dialogueCurve: computeDialogueCurveV1(
      coalesceRhizohDialogueThreadV1({
        turnIndex,
        previousTurn,
        emotionalTrajectory,
        narrativeSlope,
        unresolvedSemanticTension
      }),
      input.narrativeThread?.focusIntent
    ),
    updatedAt: atMs
  });

  return draft;
}

/**
 * Post-turn advance — Rhizoh produces dialogue flow state.
 * @param {ReturnType<typeof buildRhizohDialogueThreadSnapshotV1>} prev
 * @param {{
 *   userMessage?: string,
 *   assistantMessage?: string,
 *   intent?: string,
 *   emotions?: Record<string, number> | null,
 *   narrativeThread?: Record<string, unknown> | null,
 *   narrativeArc?: Record<string, unknown> | null,
 *   memoryEpisodes?: unknown[],
 *   outcomeResonance?: number | null,
 *   turnIndex?: number,
 *   atMs?: number
 * }} input
 */
export function advanceRhizohDialogueThreadV1(prev, input = {}) {
  const base = coalesceRhizohDialogueThreadV1(prev);
  const atMs = Number(input.atMs) || Date.now();
  const turnIndex = Math.max(base.turnIndex + 1, Math.floor(Number(input.turnIndex) || base.turnIndex + 1));
  const intent = String(input.intent || "CHAT").slice(0, 32);

  const previousTurn = Object.freeze({
    user: trimText(input.userMessage, 500),
    assistant: trimText(input.assistantMessage, 900),
    intent,
    atMs,
    turnIndex
  });

  const sample = emotionSampleFromStateV1(input.emotions, turnIndex, atMs);
  const samples = [...base.emotionalTrajectory.samples, sample].slice(-TRAJECTORY_MAX_SAMPLES_V1);
  const trajectoryMetrics = computeTrajectoryMetricsV1(samples);

  const narrativeSlope = computeNarrativeSlopeV1(input.narrativeArc, input.narrativeThread);
  const tensionItems = collectSemanticTensionItemsV1({
    userMessage: input.userMessage,
    narrativeThread: input.narrativeThread,
    narrativeArc: input.narrativeArc,
    memoryEpisodes: input.memoryEpisodes,
    previousTurn: base.previousTurn
  });
  if (input.outcomeResonance != null && Number(input.outcomeResonance) < 0.35) {
    tensionItems.push({
      id: "low_resonance",
      label: "son yanıt düşük rezonans — konuşma eğrisi onarım gerektirebilir",
      weight: 0.48,
      source: "outcome_resonance"
    });
  }

  const unresolvedSemanticTension = Object.freeze({
    items: tensionItems.slice(-TENSION_ITEMS_MAX_V1).map((it) => Object.freeze(it)),
    aggregate: aggregateSemanticTensionV1(tensionItems, trajectoryMetrics.tensionEma)
  });

  const next = coalesceRhizohDialogueThreadV1({
    turnIndex,
    previousTurn,
    emotionalTrajectory: Object.freeze({ samples, ...trajectoryMetrics }),
    narrativeSlope,
    unresolvedSemanticTension,
    dialogueCurve: computeDialogueCurveV1(
      coalesceRhizohDialogueThreadV1({
        turnIndex,
        previousTurn,
        emotionalTrajectory: Object.freeze({ samples, ...trajectoryMetrics }),
        narrativeSlope,
        unresolvedSemanticTension
      }),
      intent
    ),
    updatedAt: atMs
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.rhizohDialogueThread = next;
  }

  return next;
}

/**
 * Fox reads dialogue thread and outputs continuity pressure only (context physics).
 * @param {ReturnType<typeof coalesceRhizohDialogueThreadV1>} dialogueThread
 */
export function computeFoxContinuityPressureV1(dialogueThread) {
  const t = coalesceRhizohDialogueThreadV1(dialogueThread);
  const tension = t.unresolvedSemanticTension.aggregate;
  const steepness = t.narrativeSlope.steepness;
  const curve = t.dialogueCurve.continuity;
  const dir = t.emotionalTrajectory.direction;

  let pressure = 0.18 + curve * 0.28 + steepness * 0.22 + tension * 0.32;
  if (dir === "deepening") pressure += 0.08;
  if (dir === "rising_tension") pressure += 0.1;
  if (t.previousTurn?.user && !t.previousTurn?.assistant) pressure += 0.06;

  return Object.freeze({
    schema: "castle.rhizoh.fox_continuity_pressure.v1",
    role: FOX_CONTEXT_PHYSICS_ROLE_V1,
    pressure: round3(pressure),
    inputs: Object.freeze({
      dialogueContinuity: curve,
      narrativeSteepness: steepness,
      semanticTension: tension,
      emotionalDirection: dir
    })
  });
}

/**
 * @param {ReturnType<typeof coalesceRhizohDialogueThreadV1>} thread
 */
export function buildRhizohDialogueThreadPromptBlockV1(thread) {
  const t = coalesceRhizohDialogueThreadV1(thread);
  const prev = t.previousTurn;
  const items = t.unresolvedSemanticTension.items.slice(0, 4).map((it) => it.label);
  return [
    "## Rhizoh dialogue thread (continuity engine — produce flow, not isolated answers)",
    `turnIndex: ${t.turnIndex} · momentum: ${t.dialogueCurve.momentum} · continuity: ${t.dialogueCurve.continuity}`,
    prev
      ? `previousTurn: user="${trimText(prev.user, 120)}" | assistant="${trimText(prev.assistant, 140)}" | intent=${prev.intent}`
      : "previousTurn: (session opening)",
    `emotionalTrajectory: direction=${t.emotionalTrajectory.direction} slope=${t.emotionalTrajectory.slope} tensionEma=${t.emotionalTrajectory.tensionEma}`,
    `narrativeSlope: phase=${t.narrativeSlope.phase} steepness=${t.narrativeSlope.steepness} direction=${trimText(t.narrativeSlope.direction, 80)}`,
    items.length
      ? `unresolvedSemanticTension: ${items.join(" · ")} (aggregate=${t.unresolvedSemanticTension.aggregate})`
      : `unresolvedSemanticTension: aggregate=${t.unresolvedSemanticTension.aggregate}`,
    "Sustain the conversation curve: callback prior turn, carry emotional cadence, resolve or name open tension — do not reset to generic chatbot replies."
  ].join("\n");
}

/**
 * Snapshot emotional trajectory for proactive outcome baseline / delta.
 * @param {unknown} thread
 */
export function snapshotEmotionalTrajectoryFromThreadV1(thread) {
  const t = coalesceRhizohDialogueThreadV1(thread);
  const traj = t.emotionalTrajectory;
  return Object.freeze({
    direction: String(traj.direction || "steady"),
    slope: round3(traj.slope),
    tensionEma: round3(traj.tensionEma),
    repairEma: round3(traj.repairEma),
    sampleCount: traj.samples.length
  });
}

/**
 * Detect meaningful emotional trajectory shift after proactive speech.
 * @param {ReturnType<typeof snapshotEmotionalTrajectoryFromThreadV1>} baseline
 * @param {ReturnType<typeof snapshotEmotionalTrajectoryFromThreadV1>} current
 */
export function detectRhizohEmotionalShiftV1(baseline, current) {
  const b = baseline && typeof baseline === "object" ? baseline : {};
  const c = current && typeof current === "object" ? current : {};
  const tensionDelta = Math.abs(clamp01(c.tensionEma) - clamp01(b.tensionEma));
  const repairDelta = Math.abs(clamp01(c.repairEma) - clamp01(b.repairEma));
  const slopeDelta = Math.abs(Number(c.slope) - Number(b.slope));
  const directionChange =
    String(b.direction || "steady") !== String(c.direction || "steady") &&
    String(c.direction || "steady") !== "steady";
  return (
    tensionDelta >= 0.08 ||
    repairDelta >= 0.1 ||
    slopeDelta >= 0.12 ||
    directionChange
  );
}
