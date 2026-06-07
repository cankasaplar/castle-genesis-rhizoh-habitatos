/**
 * Turn sovereignty enforcement modes — staged wire-in (log → soft → partial → full).
 * @see apps/client/docs/RHIZOH_BEHAVIORAL_TURN_SOVEREIGNTY_V0.md
 */

export const TURN_SOVEREIGNTY_ENFORCEMENT_MODE_V0 = Object.freeze({
  OFF: "off",
  LOG_ONLY: "log_only",
  SOFT: "soft",
  PARTIAL: "partial",
  FULL: "full"
});

function readEnvV0(name) {
  try {
    return String(import.meta.env?.[name] || "").trim().toLowerCase();
  } catch {
    return "";
  }
}

/**
 * @returns {keyof typeof TURN_SOVEREIGNTY_ENFORCEMENT_MODE_V0}
 */
export function readTurnSovereigntyEnforcementModeV0() {
  const raw = readEnvV0("VITE_RHIZOH_TURN_SOVEREIGNTY_MODE");
  if (!raw || raw === "0" || raw === "false" || raw === "off") {
    return TURN_SOVEREIGNTY_ENFORCEMENT_MODE_V0.LOG_ONLY;
  }
  if (raw === "1" || raw === "true" || raw === "enforce" || raw === "full") {
    return TURN_SOVEREIGNTY_ENFORCEMENT_MODE_V0.FULL;
  }
  if (raw === "soft") return TURN_SOVEREIGNTY_ENFORCEMENT_MODE_V0.SOFT;
  if (raw === "partial") return TURN_SOVEREIGNTY_ENFORCEMENT_MODE_V0.PARTIAL;
  if (raw === "log_only" || raw === "log") return TURN_SOVEREIGNTY_ENFORCEMENT_MODE_V0.LOG_ONLY;
  return TURN_SOVEREIGNTY_ENFORCEMENT_MODE_V0.LOG_ONLY;
}

export function isTurnSovereigntyEnforcementActiveV0() {
  const mode = readTurnSovereigntyEnforcementModeV0();
  return (
    mode === TURN_SOVEREIGNTY_ENFORCEMENT_MODE_V0.SOFT ||
    mode === TURN_SOVEREIGNTY_ENFORCEMENT_MODE_V0.PARTIAL ||
    mode === TURN_SOVEREIGNTY_ENFORCEMENT_MODE_V0.FULL
  );
}

export function shouldBlockOnBoundaryViolationV0() {
  const mode = readTurnSovereigntyEnforcementModeV0();
  return (
    mode === TURN_SOVEREIGNTY_ENFORCEMENT_MODE_V0.PARTIAL ||
    mode === TURN_SOVEREIGNTY_ENFORCEMENT_MODE_V0.FULL
  );
}

export function shouldLogBoundaryViolationOnlyV0() {
  return readTurnSovereigntyEnforcementModeV0() === TURN_SOVEREIGNTY_ENFORCEMENT_MODE_V0.SOFT;
}
