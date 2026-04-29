/**
 * Physics mode selector — gecikme düzeltmesi: EMA(p95) + histerezis (frame flicker önleme).
 * Cooldown: bir sonraki step’te başlar (orijinal sözleşme); hard lock + decay tail.
 */

import { NEIGHBOR_POLICY, resolveNeighborPolicy } from "./rhizohExecutionRoadmap.js";

export function createNeighborPolicySmoother(opts = {}) {
  const alpha = opts.emaAlpha ?? NEIGHBOR_POLICY.smoothing?.emaAlpha ?? 0.22;
  const needStable = opts.hysteresisStableFrames ?? NEIGHBOR_POLICY.smoothing?.hysteresisStableFrames ?? 8;
  const cooldownFrames =
    opts.cooldownFramesAfterSwitch ?? NEIGHBOR_POLICY.smoothing?.cooldownFramesAfterSwitch ?? 12;
  const cooldownHardFrames = Math.min(
    opts.cooldownHardFrames ?? NEIGHBOR_POLICY.smoothing?.cooldownHardFrames ?? 8,
    cooldownFrames
  );
  const unlockDecayAlpha =
    opts.unlockDecayAlpha ?? NEIGHBOR_POLICY.smoothing?.unlockDecayAlpha ?? 0.32;

  let emaP95 = 0;
  let lockedMode = null;
  let pendingMode = null;
  let pendingFrames = 0;
  let cooldownHardRemaining = 0;
  let cooldownSoftScalar = 0;
  /** Switch tamamlandıktan sonra bir sonraki step’te hard kilit başlar (orijinal davranış). */
  let cooldownKickoffHard = 0;

  return {
    step(densityStats) {
      if (cooldownKickoffHard > 0) {
        cooldownHardRemaining = cooldownKickoffHard;
        cooldownKickoffHard = 0;
        cooldownSoftScalar = 0;
      }

      const rawP95 = densityStats?.p95 ?? 0;
      emaP95 = emaP95 === 0 ? rawP95 : alpha * rawP95 + (1 - alpha) * emaP95;

      if (cooldownHardRemaining > 0) {
        cooldownHardRemaining -= 1;
        if (cooldownHardRemaining === 0 && cooldownFrames > cooldownHardFrames) {
          cooldownSoftScalar = 1;
        }
      }

      if (cooldownHardRemaining > 0) {
        const policy = resolveNeighborPolicy({ ...densityStats, p95: emaP95 });
        return {
          rawP95,
          smoothedP95: emaP95,
          mode: lockedMode ?? policy.mode,
          policy: { ...policy, mode: lockedMode ?? policy.mode },
          rawPolicy: resolveNeighborPolicy(densityStats),
          hysteresisPending: false,
          pendingFrames: 0,
          cooldownRemaining: cooldownHardRemaining,
          cooldownHardRemaining,
          cooldownSoftScalar: 0,
          cooldownPhase: "hard",
          lockedDuringCooldown: true
        };
      }

      if (cooldownSoftScalar > 0.015) {
        cooldownSoftScalar *= 1 - unlockDecayAlpha;
        if (cooldownSoftScalar < 0.02) cooldownSoftScalar = 0;
        const policy = resolveNeighborPolicy({ ...densityStats, p95: emaP95 });
        return {
          rawP95,
          smoothedP95: emaP95,
          mode: lockedMode ?? policy.mode,
          policy: { ...policy, mode: lockedMode ?? policy.mode },
          rawPolicy: resolveNeighborPolicy(densityStats),
          hysteresisPending: false,
          pendingFrames: 0,
          cooldownRemaining: Math.ceil(cooldownSoftScalar * 8),
          cooldownHardRemaining: 0,
          cooldownSoftScalar,
          cooldownPhase: "decay",
          lockedDuringCooldown: true
        };
      }
      cooldownSoftScalar = 0;

      const candidate = resolveNeighborPolicy({ ...densityStats, p95: emaP95 });

      if (lockedMode === null) {
        lockedMode = candidate.mode;
        pendingMode = null;
        pendingFrames = 0;
        return {
          rawP95,
          smoothedP95: emaP95,
          mode: lockedMode,
          policy: resolveNeighborPolicy({ ...densityStats, p95: emaP95 }),
          rawPolicy: resolveNeighborPolicy(densityStats),
          hysteresisPending: false,
          pendingFrames: 0,
          cooldownRemaining: 0,
          cooldownHardRemaining: 0,
          cooldownSoftScalar: 0,
          cooldownPhase: null,
          lockedDuringCooldown: false
        };
      }

      if (candidate.mode === lockedMode) {
        pendingMode = null;
        pendingFrames = 0;
        return {
          rawP95,
          smoothedP95: emaP95,
          mode: lockedMode,
          policy: candidate,
          rawPolicy: resolveNeighborPolicy(densityStats),
          hysteresisPending: false,
          pendingFrames: 0,
          cooldownRemaining: 0,
          cooldownHardRemaining: 0,
          cooldownSoftScalar: 0,
          cooldownPhase: null,
          lockedDuringCooldown: false
        };
      }

      if (pendingMode !== candidate.mode) {
        pendingMode = candidate.mode;
        pendingFrames = 1;
      } else {
        pendingFrames += 1;
      }

      if (pendingFrames >= needStable) {
        lockedMode = pendingMode;
        pendingMode = null;
        pendingFrames = 0;
        cooldownKickoffHard = cooldownHardFrames;
      }

      const frozenPolicy = resolveNeighborPolicy({ ...densityStats, p95: emaP95 });
      return {
        rawP95,
        smoothedP95: emaP95,
        mode: lockedMode,
        policy: { ...frozenPolicy, mode: lockedMode },
        rawPolicy: resolveNeighborPolicy(densityStats),
        hysteresisPending: pendingMode !== null,
        pendingSwitchTo: pendingMode,
        pendingFrames,
        cooldownRemaining: 0,
        cooldownHardRemaining: 0,
        cooldownSoftScalar: 0,
        cooldownPhase: null,
        lockedDuringCooldown: false
      };
    },
    reset() {
      emaP95 = 0;
      lockedMode = null;
      pendingMode = null;
      pendingFrames = 0;
      cooldownHardRemaining = 0;
      cooldownSoftScalar = 0;
      cooldownKickoffHard = 0;
    }
  };
}
