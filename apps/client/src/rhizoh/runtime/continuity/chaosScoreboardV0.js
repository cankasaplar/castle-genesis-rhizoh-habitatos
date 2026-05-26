/**
 * Deterministic Quarantine Scoreboard — invariant outcomes, not log presence.
 */

export const CHAOS_SCOREBOARD_SCHEMA_V0 = "castle.rhizoh.deterministic_quarantine_scoreboard.v0";

export const SCOREBOARD_STATUS_V0 = Object.freeze({
  PENDING: "PENDING",
  SUBSTRATE_IMMUNE: "SUBSTRATE_IMMUNE",
  BREACHED: "BREACHED"
});

/**
 * @returns {{
 *   schema: string,
 *   totalTests: number,
 *   passed: number,
 *   failed: number,
 *   status: string,
 *   immune: boolean,
 *   entries: Array<Record<string, unknown>>,
 *   logs: string[]
 * }}
 */
export function createQuarantineScoreboardV0() {
  return {
    schema: CHAOS_SCOREBOARD_SCHEMA_V0,
    totalTests: 0,
    passed: 0,
    failed: 0,
    status: SCOREBOARD_STATUS_V0.PENDING,
    immune: false,
    entries: [],
    logs: []
  };
}

/**
 * @param {ReturnType<typeof createQuarantineScoreboardV0>} board
 * @param {{
 *   anomalyId: number,
 *   name: string,
 *   breach: string,
 *   filter: string,
 *   pass: boolean,
 *   message: string,
 *   passLabel?: string
 * }} entry
 */
export function recordChaosScoreV0(board, entry) {
  board.totalTests += 1;
  if (entry.pass) board.passed += 1;
  else board.failed += 1;

  const tag = entry.pass ? "PASS" : "FAIL";
  const label = entry.passLabel || entry.message;
  const statusLine = `${entry.pass ? "✅" : "❌"} [${tag}] ${entry.name} -> ${label}`;

  const row = {
    anomalyId: entry.anomalyId,
    name: entry.name,
    breach: entry.breach,
    filter: entry.filter,
    pass: entry.pass,
    message: entry.message,
    passLabel: label,
    statusLine
  };

  board.entries.push(row);
  board.logs.push(statusLine);
  return row;
}

/**
 * @param {ReturnType<typeof createQuarantineScoreboardV0>} board
 */
export function finalizeQuarantineScoreboardV0(board) {
  board.status =
    board.failed === 0 ? SCOREBOARD_STATUS_V0.SUBSTRATE_IMMUNE : SCOREBOARD_STATUS_V0.BREACHED;
  board.immune = board.failed === 0;
  return board;
}

/**
 * @param {ReturnType<typeof createQuarantineScoreboardV0>} board
 */
export function formatQuarantineScoreboardBannerV0(board) {
  const lines = [
    "",
    "==================================================",
    "     RHIZOH DETERMINISTIC QUARANTINE SCOREBOARD     ",
    "==================================================",
    ...board.logs,
    "--------------------------------------------------",
    `STATUS: ${board.immune ? "🏆 SUBSTRATE IMMUNE" : "🚨 BREACHED"}`,
    `TOTAL: ${board.totalTests} | PASSED: ${board.passed} | FAILED: ${board.failed}`,
    "==================================================",
    ""
  ];
  return lines.join("\n");
}

/**
 * @param {ReturnType<typeof createQuarantineScoreboardV0>} board
 */
export function printQuarantineScoreboardV0(board) {
  const banner = formatQuarantineScoreboardBannerV0(board);
  if (typeof console !== "undefined") {
    console.log(banner);
  }
  return banner;
}
