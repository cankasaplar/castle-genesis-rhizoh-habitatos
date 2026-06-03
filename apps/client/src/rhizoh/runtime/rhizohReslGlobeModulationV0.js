/**
 * RESL → Three.js globe presence (existence surface, not chat).
 * Temporal authority: window.__rhizoh.presenceFrame (unified clock).
 */
import { readLastT0PresenceFrameV0, sampleT0PresenceFrameV0 } from "./rhizohT0UnifiedPresenceFrameV0.js";
import { readCesiumSurfaceProjectionV0 } from "./rhizohSurfaceBindingLayerV0.js";

const DEFAULT_ORB = Object.freeze({
  breathe: false,
  intensity01: 0.65,
  rotationScale: 1,
  emissiveScale: 1,
  opacityTarget: 0.9
});

/**
 * @returns {typeof DEFAULT_ORB}
 */
export function readReslOrbModulationV0() {
  if (typeof window === "undefined") return DEFAULT_ORB;
  const orb = window.__rhizoh?.reslPresentation?.orbModulation;
  if (!orb || typeof orb !== "object") return DEFAULT_ORB;
  return Object.freeze({
    breathe: orb.breathe === true,
    intensity01: Math.max(0, Math.min(1, Number(orb.intensity01) || 0.65)),
    rotationScale: Math.max(0.2, Math.min(2.5, Number(orb.rotationScale) || 1)),
    emissiveScale: Math.max(0.5, Math.min(2.2, Number(orb.emissiveScale) || 1)),
    opacityTarget: Math.max(0.35, Math.min(0.98, Number(orb.opacityTarget) || 0.9)),
    breathPeriodMs: Math.max(1800, Number(orb.breathPeriodMs) || 4200)
  });
}

/**
 * @param {THREE.Mesh | null | undefined} globe
 * @param {number} simTime
 */
export function applyReslGlobeTickV0(globe, simTime = 0) {
  const orb = readReslOrbModulationV0();
  const mat = globe?.material;
  if (!mat || Array.isArray(mat)) return orb;

  const rsbl = readCesiumSurfaceProjectionV0();
  const frame = sampleT0PresenceFrameV0(Date.now()) || readLastT0PresenceFrameV0();
  const breathWave =
    Number(rsbl?.breathe01) ||
    (frame?.surfaces?.orb?.breathe01 ?? (orb.breathe ? 0.5 : 0));
  void simTime;

  if (typeof mat.emissiveIntensity === "number") {
    const base = 1.05 * orb.emissiveScale;
    mat.emissiveIntensity = orb.breathe ? base * (0.82 + breathWave * 0.28 * orb.intensity01) : base * 0.75;
  }

  if (typeof mat.opacity === "number") {
    const target = orb.breathe
      ? orb.opacityTarget * (0.9 + breathWave * 0.1)
      : orb.opacityTarget * 0.82;
    mat.opacity += (target - mat.opacity) * 0.04;
  }

  return orb;
}

/**
 * @param {THREE.Mesh | null | undefined} globe
 * @param {number} [baseRotationDelta]
 */
export function reslGlobeRotationDeltaV0(globe, baseRotationDelta = 0.0003) {
  const orb = readReslOrbModulationV0();
  if (!orb.breathe) return baseRotationDelta * 0.65;
  return baseRotationDelta * orb.rotationScale * (0.85 + orb.intensity01 * 0.35);
}
