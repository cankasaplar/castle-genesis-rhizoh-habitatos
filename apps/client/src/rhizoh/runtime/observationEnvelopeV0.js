/**
 * PR-2.5 — Observation snapshot envelope (canonical shape).
 *
 * **Lane immutability:** `lane` is set only at envelope construction; returned object is `Object.freeze`d.
 * **UI contract:** consumers use `envelope.lane` + `envelope.payload` for display only — not as identity SSOT
 * (no inference of user id / session authority from `payload` internals).
 *
 * @see observationLaneResolveV0.js
 * @see observationLaneDriftV0.js
 */

/** @typedef {"guest" | "owner" | "system" | "replay"} ObservationIdentityLaneV0 */
/** @typedef {"OFF" | "PASSIVE" | "ACTIVE"} WorldExecutionModeLiteralV0 */

export const OBSERVATION_SNAPSHOT_SCHEMA_VERSION_V0 = 1;

export const OBSERVATION_PROVENANCE_SOURCE_V0 = "observer_runtime";

/**
 * @param {{
 *   lane: ObservationIdentityLaneV0,
 *   runtimeFrameId: string,
 *   replaySeed?: string | null,
 *   executionMode: WorldExecutionModeLiteralV0,
 *   payload: { state: unknown, hints: unknown, temporal: unknown }
 * }} input
 * @returns {Readonly<{
 *   lane: ObservationIdentityLaneV0,
 *   runtimeFrameId: string,
 *   replaySeed?: string,
 *   snapshotSchemaVersion: number,
 *   provenance: Readonly<{ executionMode: WorldExecutionModeLiteralV0, source: typeof OBSERVATION_PROVENANCE_SOURCE_V0 }>,
 *   payload: Readonly<{ state: unknown, hints: unknown, temporal: unknown }>
 * }>}
 */
export function buildObservationEnvelopeV0(input) {
  const LANES = /** @type {const} */ (new Set(["guest", "owner", "system", "replay"]));
  const MODES = /** @type {const} */ (new Set(["OFF", "PASSIVE", "ACTIVE"]));

  const rawLane = String(input.lane || "owner");
  const lane = /** @type {ObservationIdentityLaneV0} */ (LANES.has(rawLane) ? rawLane : "owner");

  const rawMode = String(input.executionMode || "OFF");
  const executionMode = /** @type {WorldExecutionModeLiteralV0} */ (MODES.has(rawMode) ? rawMode : "OFF");

  const runtimeFrameId = String(input.runtimeFrameId || "");
  const rs = input.replaySeed;
  const replaySeed = rs === undefined || rs === null ? undefined : String(rs);

  const provenance = Object.freeze({
    executionMode,
    source: OBSERVATION_PROVENANCE_SOURCE_V0
  });

  const p = input.payload && typeof input.payload === "object" ? input.payload : {};
  const payload = Object.freeze({
    state: "state" in p ? p.state : null,
    hints: "hints" in p ? p.hints : null,
    temporal: "temporal" in p ? p.temporal : null
  });

  const core = {
    lane,
    runtimeFrameId,
    snapshotSchemaVersion: OBSERVATION_SNAPSHOT_SCHEMA_VERSION_V0,
    provenance,
    payload
  };
  if (replaySeed !== undefined) {
    core.replaySeed = replaySeed;
  }
  return Object.freeze(core);
}
