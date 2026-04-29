/**
 * Cyber-Physical kapalı döngü: dijital ikiz doğrulama + toparlanma (Recover).
 * Recover: actuator / ağ kaybı / sensör halüsinasyonu sonrası güvenli duruma dönüş.
 */

export const RoboticsPhase = {
  OBSERVE: "observe",
  INFER: "infer",
  PLAN: "plan",
  SIMULATE: "simulate",
  VERIFY: "verify",
  AUTHORIZE: "authorize",
  EXECUTE: "execute",
  TELEMETRY: "telemetry",
  REFLECT: "reflect",
  LEARN: "learn",
  RECOVER: "recover"
};

/** İnsan okunaklı tam döngü sırası (durum makinesi dallanmaları hariç). */
export const ROBOTICS_FLOW_ORDER = [
  RoboticsPhase.OBSERVE,
  RoboticsPhase.INFER,
  RoboticsPhase.PLAN,
  RoboticsPhase.SIMULATE,
  RoboticsPhase.VERIFY,
  RoboticsPhase.AUTHORIZE,
  RoboticsPhase.EXECUTE,
  RoboticsPhase.TELEMETRY,
  RoboticsPhase.REFLECT,
  RoboticsPhase.LEARN,
  RoboticsPhase.RECOVER
];

const LEGAL = new Map([
  [RoboticsPhase.OBSERVE, new Set([RoboticsPhase.INFER])],
  [RoboticsPhase.INFER, new Set([RoboticsPhase.PLAN])],
  [RoboticsPhase.PLAN, new Set([RoboticsPhase.SIMULATE])],
  [RoboticsPhase.SIMULATE, new Set([RoboticsPhase.VERIFY])],
  [RoboticsPhase.VERIFY, new Set([RoboticsPhase.AUTHORIZE, RoboticsPhase.PLAN])],
  [RoboticsPhase.AUTHORIZE, new Set([RoboticsPhase.EXECUTE])],
  [RoboticsPhase.EXECUTE, new Set([RoboticsPhase.TELEMETRY, RoboticsPhase.RECOVER])],
  [RoboticsPhase.TELEMETRY, new Set([RoboticsPhase.REFLECT, RoboticsPhase.RECOVER, RoboticsPhase.OBSERVE])],
  [RoboticsPhase.REFLECT, new Set([RoboticsPhase.LEARN, RoboticsPhase.RECOVER])],
  [RoboticsPhase.LEARN, new Set([RoboticsPhase.OBSERVE, RoboticsPhase.RECOVER])],
  [RoboticsPhase.RECOVER, new Set([RoboticsPhase.OBSERVE, RoboticsPhase.INFER])]
]);

export function canAdvanceRoboticsPhase(from, to) {
  return LEGAL.get(from)?.has(to) ?? false;
}

/** Basit doğrulayıcı: hız / çalışma alanı (formel SMT katmanına yer tutucu). */
export function verifyTwistCommand(cmd, bounds) {
  const b = bounds || { vMax: 35, xMax: 5000, yMax: 8000, zMax: 5000 };
  if (!cmd || typeof cmd !== "object") return { ok: false, reason: "empty_cmd" };
  const v = Number(cmd.speed ?? cmd.v ?? 0);
  if (!Number.isFinite(v) || v > b.vMax) return { ok: false, reason: "speed_cap" };
  const x = Number(cmd.x ?? 0);
  const y = Number(cmd.y ?? 0);
  const z = Number(cmd.z ?? 0);
  if (Math.abs(x) > b.xMax || Math.abs(y) > b.yMax || Math.abs(z) > b.zMax) return { ok: false, reason: "workspace" };
  return { ok: true, reason: "bounds_ok" };
}
