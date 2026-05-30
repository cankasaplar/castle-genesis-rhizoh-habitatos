/**
 * Tiny locomotion FSM — discrete states, deterministic transitions, speed scalar out.
 */

export type LocomotionFsmStateIdV0 = "idle" | "seek" | "arrive";

export type LocomotionFsmRuntimeV0 = {
  state: LocomotionFsmStateIdV0;
  enteredAtMs: number;
};

export function createLocomotionFsmRuntimeV0(nowMs: number): LocomotionFsmRuntimeV0 {
  return { state: "idle", enteredAtMs: nowMs };
}

export function tickLocomotionFsmGraphV0(
  rt: LocomotionFsmRuntimeV0,
  distToGoal: number,
  nowMs: number,
  opts: { seekSpeed: number; arriveRadius: number; idleRadius: number }
): { next: LocomotionFsmRuntimeV0; speed: number } {
  let state = rt.state;
  if (distToGoal > opts.arriveRadius * 2.2) state = "seek";
  else if (distToGoal > opts.idleRadius) state = "arrive";
  else state = "idle";

  const enteredAtMs = state === rt.state ? rt.enteredAtMs : nowMs;
  const next: LocomotionFsmRuntimeV0 = { state, enteredAtMs };

  let speed = 0;
  if (state === "seek") speed = opts.seekSpeed;
  else if (state === "arrive")
    speed = opts.seekSpeed * Math.min(1, distToGoal / Math.max(1e-6, opts.arriveRadius));

  return { next, speed };
}

export function velocityTowardPointV0(
  from: { x: number; z: number },
  to: { x: number; z: number },
  speed: number
): { x: number; z: number } {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const d = Math.hypot(dx, dz);
  if (d < 1e-6) return { x: 0, z: 0 };
  return { x: (dx / d) * speed, z: (dz / d) * speed };
}
