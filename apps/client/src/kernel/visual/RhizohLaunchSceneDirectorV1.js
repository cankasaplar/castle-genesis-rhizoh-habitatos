/**
 * Launch Scene Director — ilk 0–15 sn “orkestra”: kamera / ses / swarm / bellek / kahraman / ses daveti.
 * Medya kalitesi için cinematic phase ile paralel; görsel katmana boost üretir.
 */

const clamp01 = (v) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));

/**
 * @param {number} elapsedMs
 * @param {{ mode?: string }} route — resolveAdaptiveIntroRouteV1 çıktısı
 */
export function computeLaunchSceneDirectorOverlayV1(elapsedMs, route) {
  const e = Math.max(0, elapsedMs);
  const returning = route?.mode === "returning";
  const gov = route?.governanceState ?? "NORMAL";
  const altered = gov === "DEGRADED" || gov === "FROZEN";
  const calm = gov === "RECOVERY";

  if (returning) {
    const swarmIntensityDelta = e < 500 ? 0.12 : e < 1400 ? 0.32 : e < 3200 ? 0.48 : 0.22;
    const launchMemoryEchoBoost = e < 900 ? 0.2 : e < 2800 ? 0.45 : 0.25;
    return {
      label: "LAUNCH_DIRECTOR_V1_SHORT",
      swarmIntensityDelta: altered ? swarmIntensityDelta * 0.65 : swarmIntensityDelta,
      launchMemoryEchoBoost: calm ? launchMemoryEchoBoost * 0.75 : launchMemoryEchoBoost,
      ambientWeight: e < 1600 ? 0.55 : 0.85,
      simultaneousCitySwarmHero: e >= 400 && e < 3400,
      oneShotSwarmIgnite: e >= 900 && e < 1100,
      rhizohHeartPulse: e > 200 && e < 5000,
      densityFieldVisible: e > 350 && e < 4200,
      voiceOrchestration: "tight"
    };
  }

  let swarmIntensityDelta = 0.1;
  let launchMemoryEchoBoost = 0.12;
  let ambientWeight = 0.5;
  let simultaneousCitySwarmHero = false;
  let oneShotSwarmIgnite = false;
  let densityFieldVisible = false;

  if (e < 3000) {
    swarmIntensityDelta = 0.14 + (e / 3000) * 0.18;
    launchMemoryEchoBoost = 0.15 + (e / 3000) * 0.22;
    ambientWeight = 0.45 + (e / 3000) * 0.25;
    simultaneousCitySwarmHero = e > 800;
    densityFieldVisible = e > 400;
  } else if (e < 5500) {
    swarmIntensityDelta = 0.32 + ((e - 3000) / 2500) * 0.14;
    launchMemoryEchoBoost = 0.37 + ((e - 3000) / 2500) * 0.18;
    ambientWeight = 0.72;
    simultaneousCitySwarmHero = true;
    densityFieldVisible = true;
  } else if (e < 8500) {
    swarmIntensityDelta = 0.46 + ((e - 5500) / 3000) * 0.12;
    launchMemoryEchoBoost = 0.55 + ((e - 5500) / 3000) * 0.12;
    ambientWeight = 0.88;
    simultaneousCitySwarmHero = true;
    oneShotSwarmIgnite = e >= 6500 && e < 7200;
    densityFieldVisible = true;
  } else if (e < 12000) {
    swarmIntensityDelta = 0.58 - ((e - 8500) / 3500) * 0.08;
    launchMemoryEchoBoost = 0.67 - ((e - 8500) / 3500) * 0.1;
    ambientWeight = 0.92;
    simultaneousCitySwarmHero = true;
    densityFieldVisible = e < 11000;
  } else {
    swarmIntensityDelta = 0.38;
    launchMemoryEchoBoost = 0.42;
    ambientWeight = 0.85;
    simultaneousCitySwarmHero = false;
  }

  if (altered) {
    swarmIntensityDelta *= 0.7;
    launchMemoryEchoBoost *= 0.8;
  }
  if (calm) {
    swarmIntensityDelta *= 0.75;
    launchMemoryEchoBoost *= 0.85;
  }

  return {
    label: "LAUNCH_DIRECTOR_V1_FULL",
    swarmIntensityDelta: clamp01(swarmIntensityDelta),
    launchMemoryEchoBoost: clamp01(launchMemoryEchoBoost),
    ambientWeight: clamp01(ambientWeight),
    simultaneousCitySwarmHero,
    oneShotSwarmIgnite,
    rhizohHeartPulse: e > 1200 && e < 14500,
    densityFieldVisible,
    voiceOrchestration: "full"
  };
}
