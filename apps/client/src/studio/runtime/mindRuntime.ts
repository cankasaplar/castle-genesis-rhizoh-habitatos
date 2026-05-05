import type { MindInstance, RSKMindRuntimeState, Soul } from "../types/rskOntology";

export function defaultMindRuntimeState(): RSKMindRuntimeState {
  const now = Date.now();
  return {
    internal: {
      mood: 0,
      focus: 0.72,
      energy: 0.85,
      load: 0.08,
      entropy: 0.12
    },
    cognition: {
      lastThoughtAt: now,
      currentTask: undefined,
      thoughtBuffer: []
    },
    perception: {
      inputs: [],
      lastInputAt: now,
      signalStrength: 0.35
    }
  };
}

export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32 — deterministic from numeric seed */
export function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildTickSeed(params: {
  continuityHash: string;
  explicitSeed?: string;
  tickIndex: number;
  timeBucketMs?: number;
}): string {
  const bucket = params.timeBucketMs ?? Math.floor(Date.now() / 60_000);
  return `${params.continuityHash}|${bucket}|${params.explicitSeed ?? ""}|${params.tickIndex}`;
}

/**
 * Deterministic cognitive tick: same seed + same prev → same next (shadow-safe).
 */
export function computeMindTick(
  prev: RSKMindRuntimeState,
  instance: MindInstance,
  soul: Soul | undefined,
  opts: { context?: unknown; seed: string; tickIndex: number; nowMs?: number }
): RSKMindRuntimeState {
  const rng = mulberry32(hashSeed(opts.seed));
  const wall = opts.nowMs ?? Date.now();
  const dna = instance.dna;
  const drift = (rng() - 0.5) * 0.06;
  const entropyNext = Math.max(0, Math.min(1, prev.internal.entropy + drift * 0.35 + prev.internal.load * 0.02));

  const energy = Math.max(0, Math.min(1, prev.internal.energy - entropyNext * 0.04 + dna.stability * 0.01));
  const focus = Math.max(0, Math.min(1, prev.internal.focus - entropyNext * 0.035 + dna.curiosity * 0.008));
  const mood = Math.max(-1, Math.min(1, prev.internal.mood + Math.sin(entropyNext * Math.PI) * 0.04 + (dna.empathy - 0.5) * 0.02));
  const load = Math.max(0, Math.min(1, prev.internal.load * 0.92 + rng() * 0.06));

  const thoughtLine =
    typeof opts.context === "string" && opts.context.trim()
      ? `tick:${opts.tickIndex} · ${opts.context.slice(0, 120)}`
      : `tick:${opts.tickIndex} · pulse`;

  const buf = [...prev.cognition.thoughtBuffer, thoughtLine].slice(-5);

  const inputs =
    typeof opts.context === "string" && opts.context.trim()
      ? [...prev.perception.inputs, opts.context.slice(0, 64)].slice(-8)
      : prev.perception.inputs;

  return {
    internal: { mood, focus, energy, load, entropy: entropyNext },
    cognition: {
      lastThoughtAt: wall,
      currentTask: prev.cognition.currentTask,
      thoughtBuffer: buf
    },
    perception: {
      inputs,
      lastInputAt: wall,
      signalStrength: Math.max(0, Math.min(1, prev.perception.signalStrength * 0.97 + rng() * 0.04))
    }
  };
}
