import { computeLaunchSceneDirectorOverlayV1 } from "./RhizohLaunchSceneDirectorV1.js";

export const RHIZOH_CINEMATIC_PHASE = {
  BOOT_DARK: "BOOT_DARK",
  WORLD_PULSE: "WORLD_PULSE",
  HERO_WAKE: "HERO_WAKE",
  ANCHOR_REVEAL: "ANCHOR_REVEAL",
  VOICE_INVITE: "VOICE_INVITE",
  SEMANTIC_READY: "SEMANTIC_READY"
};

const FULL_PHASES = [
  { phase: RHIZOH_CINEMATIC_PHASE.BOOT_DARK, untilMs: 2000 },
  { phase: RHIZOH_CINEMATIC_PHASE.WORLD_PULSE, untilMs: 5000 },
  { phase: RHIZOH_CINEMATIC_PHASE.HERO_WAKE, untilMs: 8000 },
  { phase: RHIZOH_CINEMATIC_PHASE.ANCHOR_REVEAL, untilMs: 12000 },
  { phase: RHIZOH_CINEMATIC_PHASE.VOICE_INVITE, untilMs: 15000 },
  { phase: RHIZOH_CINEMATIC_PHASE.SEMANTIC_READY, untilMs: Number.POSITIVE_INFINITY }
];

const SHORT_PHASES = [
  { phase: RHIZOH_CINEMATIC_PHASE.BOOT_DARK, untilMs: 800 },
  { phase: RHIZOH_CINEMATIC_PHASE.WORLD_PULSE, untilMs: 1800 },
  { phase: RHIZOH_CINEMATIC_PHASE.ANCHOR_REVEAL, untilMs: 3200 },
  { phase: RHIZOH_CINEMATIC_PHASE.VOICE_INVITE, untilMs: 5000 },
  { phase: RHIZOH_CINEMATIC_PHASE.SEMANTIC_READY, untilMs: Number.POSITIVE_INFINITY }
];

export function resolveAdaptiveIntroRouteV1(input) {
  const governanceState = input?.governanceState ?? "NORMAL";
  const returningUser = Boolean(input?.returningUser);
  const safeMode = governanceState === "RECOVERY";
  const emergencyTone = governanceState === "DEGRADED" || governanceState === "FROZEN";
  return {
    mode: safeMode ? "safe" : emergencyTone ? "altered" : returningUser ? "returning" : "full",
    phases: returningUser ? SHORT_PHASES : FULL_PHASES,
    governanceState
  };
}

const voiceByPhaseFull = {
  [RHIZOH_CINEMATIC_PHASE.WORLD_PULSE]: "Istanbul ankoru aciliyor. Sinir hatlari nefes aliyor.",
  [RHIZOH_CINEMATIC_PHASE.HERO_WAKE]: "Hos geldin. Sehir, swarm ve hafiza ayni anda uyandi.",
  [RHIZOH_CINEMATIC_PHASE.VOICE_INVITE]: "Mikrofon veya yazi — alani birlikte sekillendirelim."
};

const voiceByPhaseShort = {
  [RHIZOH_CINEMATIC_PHASE.WORLD_PULSE]: "Tekrar buradasin; ankor stabil.",
  [RHIZOH_CINEMATIC_PHASE.ANCHOR_REVEAL]: "Alan acildi; swarm ve hafiza eslik ediyor.",
  [RHIZOH_CINEMATIC_PHASE.VOICE_INVITE]: "Bir sey soyle; devam edelim."
};

export function computeRhizohCinematicOutputV1(input) {
  const route = input?.route ?? resolveAdaptiveIntroRouteV1(input);
  const elapsedMs = Math.max(0, input?.elapsedMs ?? 0);
  const phaseEntry = route.phases.find((p) => elapsedMs < p.untilMs) ?? route.phases[route.phases.length - 1];
  const phase = phaseEntry.phase;

  const calm = route.mode === "safe";
  const altered = route.mode === "altered";
  const returning = route.mode === "returning";
  const voiceTable = returning ? voiceByPhaseShort : voiceByPhaseFull;

  const launch = computeLaunchSceneDirectorOverlayV1(elapsedMs, route);
  const swarmBoost =
    phase === RHIZOH_CINEMATIC_PHASE.HERO_WAKE
      ? (calm ? 0.25 : 0.55) + launch.swarmIntensityDelta * 0.35
      : 0.1 + launch.swarmIntensityDelta * 0.5;
  const memoryEchoBoost =
    phase === RHIZOH_CINEMATIC_PHASE.HERO_WAKE ? (calm ? 0.2 : 0.5) + launch.launchMemoryEchoBoost * 0.25 : 0.08 + launch.launchMemoryEchoBoost * 0.35;

  return {
    phase,
    voiceLine: voiceTable[phase] ?? "",
    cameraDirective:
      phase === RHIZOH_CINEMATIC_PHASE.ANCHOR_REVEAL
        ? "HUMAN_CENTER_ANCHOR"
        : phase === RHIZOH_CINEMATIC_PHASE.HERO_WAKE
          ? "HERO_FOCUS"
          : phase === RHIZOH_CINEMATIC_PHASE.WORLD_PULSE
            ? "ORBIT_CITY_WIDE"
            : "HOLD",
    swarmBoost: Math.min(0.95, swarmBoost),
    memoryEchoBoost: Math.min(0.95, memoryEchoBoost),
    showMicPulse: phase === RHIZOH_CINEMATIC_PHASE.VOICE_INVITE || phase === RHIZOH_CINEMATIC_PHASE.SEMANTIC_READY,
    revealMap: phase !== RHIZOH_CINEMATIC_PHASE.BOOT_DARK,
    showSemanticHints: phase === RHIZOH_CINEMATIC_PHASE.SEMANTIC_READY,
    tone: altered ? "alert" : calm ? "calm" : "default",
    launch
  };
}
