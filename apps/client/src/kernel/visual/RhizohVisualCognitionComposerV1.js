const clamp01 = (v) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));

const normalizeCount = (value, max = 32) => clamp01((value ?? 0) / max);

const riskToGovernanceState = (governanceState) => {
  if (governanceState === "FROZEN") return { tone: "red-hard", pulseSpeed: 0.2 };
  if (governanceState === "RECOVERY") return { tone: "purple-oscillation", pulseSpeed: 0.65 };
  if (governanceState === "DEGRADED") return { tone: "amber-flicker", pulseSpeed: 0.45 };
  return { tone: "green-soft", pulseSpeed: 0.9 };
};

const composeSwarmField = (snapshot, events, launchExtra = 0) => {
  const activeTasks = snapshot?.taskCounts?.running ?? snapshot?.taskCounts?.queued ?? 0;
  const eventRate = events?.length ?? 0;
  const intensity = clamp01(0.65 * normalizeCount(activeTasks, 16) + 0.35 * normalizeCount(eventRate, 16) + clamp01(launchExtra) * 0.55);
  const level = intensity > 0.66 ? "high" : intensity > 0.33 ? "medium" : "low";
  const palette = level === "high" ? "orange-red" : level === "medium" ? "neon-cyan" : "cool-blue";
  return {
    intensity,
    level,
    palette,
    pulseWave: "sin",
    directionalFlow: eventRate > 0
  };
};

const composeHeroAgents = (snapshot) => {
  const recent = snapshot?.recentTasks ?? [];
  const uniqueAgents = [];
  for (const task of recent) {
    if (!task?.agentId) continue;
    if (uniqueAgents.includes(task.agentId)) continue;
    uniqueAgents.push(task.agentId);
    if (uniqueAgents.length >= 7) break;
  }
  return uniqueAgents.map((agentId, i) => ({
    agentId,
    stance: i === 0 ? "critical" : "active",
    orbitParticles: true
  }));
};

export function composeRhizohVisualCognitionStateV1(input) {
  const snapshot = input?.snapshot ?? null;
  const events = input?.events ?? [];
  const governanceState = input?.governanceState ?? "NORMAL";
  const dormantAgents = input?.dormantAgents ?? 0;
  const launchSwarm = clamp01(input?.launchSwarmIntensityBoost ?? 0);
  const launchMem = clamp01(input?.launchMemoryEchoBoost ?? 0);
  const baseLinks = input?.memoryLinks ?? 0;
  const displayLinks = Math.max(0, Math.round(baseLinks + launchMem * 22));
  const swarmField = composeSwarmField(snapshot, events, launchSwarm);

  return {
    surface: {
      anchor: "istanbul",
      mode: "earth",
      fallback: "abstract-globe"
    },
    swarmField,
    agents: composeHeroAgents(snapshot),
    humanPresence: {
      participantNode: true,
      userBeacon: true,
      personalCastleAura: true,
      voiceRingPulse:
        input?.rhizohFieldState === "LISTENING" ||
        input?.rhizohFieldState === "INTERPRETING" ||
        input?.rhizohFieldState === "SPEAKING",
      deviceMeshLinks: input?.deviceMeshLinks ?? 2,
      dormantAgents
    },
    memoryEcho: {
      links: displayLinks,
      baseLinks,
      unfinishedJourneys: input?.unfinishedJourneys ?? 0,
      replayGhostActive: input?.demoLoopState === "REPLAYED"
    },
    governancePulse: {
      state: governanceState,
      ...riskToGovernanceState(governanceState)
    },
    futureHorizon: {
      orbitalNodes: true,
      marsReadySignal: input?.lastIntentRaw?.toLowerCase().includes("mars") ?? false
    },
    rhizohCorePresence: {
      breathingCore: true,
      hum: "low",
      thinkingOrbits: input?.rhizohFieldState === "GENERATING",
      routingBeam: input?.rhizohFieldState === "EXECUTING"
    },
    explainabilityBreadcrumbs: {
      enabled: true,
      confidenceHalo: input?.eventConfidence ?? 0,
      path: input?.lastWhy ?? []
    },
    /** Collective / “50k” görsel alan — HUD aura için */
    collectiveField: {
      density: swarmField.intensity,
      heat: clamp01(swarmField.intensity * 0.88 + launchMem * 0.28 + launchSwarm * 0.12),
      threads: clamp01(0.22 + swarmField.intensity * 0.58 + (launchSwarm > 0.35 ? 0.12 : 0)),
      flowActive: Boolean(swarmField.directionalFlow || swarmField.intensity > 0.42),
      breathMs: Math.round(2600 + (1 - swarmField.intensity) * 2600)
    }
  };
}
