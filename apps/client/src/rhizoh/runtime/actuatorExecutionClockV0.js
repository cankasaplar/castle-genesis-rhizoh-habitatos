/**
 * PR-3.4 — Ordered actuator execution timeline (command vs ACK ordering).
 * SPECFLOW: **RESEARCH-ONLY**
 *
 * Holds monotonic logical ticks + append-only events for audits, replay manifests,
 * and temporal guards (`staleAckRejectorV0`).
 */

import { deriveExecutionSequenceIdV0 } from "./executionSequenceIdV0.js";

/**
 * @returns {{
 *   recordCommandSent: (io: { atMs: number, lane?: string, executionId: string, commandHash: string, actuator: string }) => Readonly<{ sequenceId: string, atMs: number, kind: 'COMMAND_SENT', executionId: string, commandHash: string, actuator: string }>,
 *   recordAckReceived: (io: { atMs: number, executionId: string, commandHash: string, actuator: string, sequenceId?: string }) => Readonly<{ sequenceId: string, atMs: number, kind: 'ACK_RECEIVED', executionId: string, commandHash: string, actuator: string }>,
 *   lastCommandSentFor: (executionId: string) => null | Readonly<{ sequenceId: string, atMs: number, kind: 'COMMAND_SENT', executionId: string, commandHash: string, actuator: string }>,
 *   snapshot: () => readonly unknown[],
 *   reset: () => void,
 *   getLogicalTick: () => number
 * }}
 */
export function createActuatorExecutionClockV0() {
  let logicalTick = 0;
  /** @type {Array<{ sequenceId: string, atMs: number, kind: 'COMMAND_SENT' | 'ACK_RECEIVED', executionId: string, commandHash: string, actuator: string }>} */
  const events = [];

  return {
    getLogicalTick: () => logicalTick,
    reset() {
      logicalTick = 0;
      events.length = 0;
    },
    recordCommandSent(io) {
      logicalTick++;
      const sequenceId = deriveExecutionSequenceIdV0({
        lane: io.lane,
        logicalTick,
        actuator: io.actuator,
        executionId: io.executionId
      });
      const ev = Object.freeze({
        sequenceId,
        atMs: io.atMs,
        kind: /** @type {const} */ ("COMMAND_SENT"),
        executionId: String(io.executionId ?? ""),
        commandHash: String(io.commandHash ?? ""),
        actuator: String(io.actuator ?? "")
      });
      events.push(ev);
      return ev;
    },
    recordAckReceived(io) {
      const sequenceId = String(io.sequenceId ?? "");
      const ev = Object.freeze({
        sequenceId,
        atMs: io.atMs,
        kind: /** @type {const} */ ("ACK_RECEIVED"),
        executionId: String(io.executionId ?? ""),
        commandHash: String(io.commandHash ?? ""),
        actuator: String(io.actuator ?? "")
      });
      events.push(ev);
      return ev;
    },
    lastCommandSentFor(executionId) {
      const id = String(executionId ?? "");
      for (let i = events.length - 1; i >= 0; i--) {
        const e = events[i];
        if (e.executionId === id && e.kind === "COMMAND_SENT") return e;
      }
      return null;
    },
    snapshot() {
      return Object.freeze(events.map((e) => Object.freeze({ ...e })));
    }
  };
}
