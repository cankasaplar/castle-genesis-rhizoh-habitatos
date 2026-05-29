/**
 * Agent containment v0 — iteration caps, tool recursion lock, session token ceiling, timeout, emergency disable.
 * @see docs/ops/OPERATIONAL_HARDENING_PROGRAM_V1.0.md
 */

export const AGENT_CONTAINMENT_SCHEMA_V0 = "rhizoh.agent.containment.v0";

function parseIntEnv(key, fallback) {
  const n = Number(process.env[key]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export function readAgentContainmentConfigV0() {
  return Object.freeze({
    maxIterationsPerSession: parseIntEnv("CASTLE_AGENT_MAX_ITERATIONS", 12),
    turnTimeoutMs: parseIntEnv("CASTLE_AGENT_TURN_TIMEOUT_MS", 120_000),
    maxSessionTokens: parseIntEnv("CASTLE_AGENT_SESSION_TOKEN_CEILING", 32_000),
    recursiveToolLockDepth: parseIntEnv("CASTLE_AGENT_RECURSIVE_TOOL_DEPTH", 3),
    emergencyDisable: process.env.CASTLE_AGENT_EMERGENCY_DISABLE === "1"
  });
}

/** @type {Map<string, { iteration: number, tokensUsed: number, inFlight: boolean, inFlightSinceMs: number | null, toolStack: string[] }>} */
const sessions = new Map();

export function getAgentSessionKeyV0(uid, sessionId) {
  return `${String(uid || "anon")}::${String(sessionId || "default").slice(0, 128)}`;
}

export function resetAgentContainmentSessionsV0() {
  sessions.clear();
}

/**
 * @param {string} sessionKey
 * @param {{ estimatedTokens?: number }} [opts]
 */
export function beginAgentTurnV0(sessionKey, opts = {}) {
  const cfg = readAgentContainmentConfigV0();
  if (cfg.emergencyDisable) {
    return { ok: false, code: "agent_emergency_disable", reason: "CASTLE_AGENT_EMERGENCY_DISABLE=1" };
  }

  const est = Math.max(0, Math.floor(Number(opts.estimatedTokens) || 0));
  let s = sessions.get(sessionKey);
  if (!s) {
    s = { iteration: 0, tokensUsed: 0, inFlight: false, inFlightSinceMs: null, toolStack: [] };
    sessions.set(sessionKey, s);
  }

  if (s.inFlight && s.inFlightSinceMs != null) {
    const elapsed = Date.now() - s.inFlightSinceMs;
    if (elapsed < cfg.turnTimeoutMs) {
      return { ok: false, code: "agent_turn_in_flight", reason: "previous_turn_not_finished" };
    }
    s.inFlight = false;
    s.inFlightSinceMs = null;
  }

  if (s.iteration >= cfg.maxIterationsPerSession) {
    return { ok: false, code: "agent_max_iterations", reason: "session_iteration_cap" };
  }

  if (s.tokensUsed + est > cfg.maxSessionTokens) {
    return { ok: false, code: "agent_session_token_ceiling", reason: "session_token_cap" };
  }

  s.iteration += 1;
  s.inFlight = true;
  s.inFlightSinceMs = Date.now();
  return { ok: true, iteration: s.iteration, config: cfg };
}

/**
 * @param {string} sessionKey
 * @param {{ tokensUsed?: number }} [opts]
 */
export function endAgentTurnV0(sessionKey, opts = {}) {
  const s = sessions.get(sessionKey);
  if (!s) return;
  const used = Math.max(0, Math.floor(Number(opts.tokensUsed) || 0));
  s.tokensUsed += used;
  s.inFlight = false;
  s.inFlightSinceMs = null;
  s.toolStack = [];
}

/**
 * Recursive tool lock: same tool name cannot repeat on stack beyond depth without unwind.
 * @param {string} sessionKey
 * @param {string} toolName
 */
export function recordAgentToolInvocationV0(sessionKey, toolName) {
  const cfg = readAgentContainmentConfigV0();
  const name = String(toolName || "unknown").slice(0, 64);
  let s = sessions.get(sessionKey);
  if (!s) {
    s = { iteration: 0, tokensUsed: 0, inFlight: false, inFlightSinceMs: null, toolStack: [] };
    sessions.set(sessionKey, s);
  }
  s.toolStack.push(name);
  let consecutive = 0;
  for (let i = s.toolStack.length - 1; i >= 0; i--) {
    if (s.toolStack[i] === name) consecutive += 1;
    else break;
  }
  if (consecutive > cfg.recursiveToolLockDepth) {
    s.toolStack.pop();
    return { ok: false, code: "agent_recursive_tool_lock", toolName: name };
  }
  return { ok: true };
}

export function getAgentContainmentSessionStatsV0(sessionKey) {
  const s = sessions.get(sessionKey);
  if (!s) return null;
  return {
    iteration: s.iteration,
    tokensUsed: s.tokensUsed,
    inFlight: s.inFlight,
    toolStackDepth: s.toolStack.length,
    toolLineage: [...s.toolStack]
  };
}

/** Tool lineage (Flight Recorder) — read-only copy of invocation stack. */
export function getToolLineageV0(sessionKey) {
  const s = sessions.get(sessionKey);
  if (!s) return [];
  return [...s.toolStack];
}

/**
 * Simulated agent tool loop for stress tests (does not call external LLM).
 * @param {string} sessionKey
 * @param {string} toolName
 * @param {number} attempts
 */
export function simulateRecursiveToolChainV0(sessionKey, toolName, attempts) {
  const results = [];
  for (let i = 0; i < attempts; i++) {
    const r = recordAgentToolInvocationV0(sessionKey, toolName);
    results.push({ attempt: i + 1, ok: r.ok, code: r.ok ? null : r.code, toolName: r.toolName ?? toolName });
    if (!r.ok) break;
  }
  return results;
}

/**
 * @param {string} code
 * @param {string} [replyTr]
 */
export function agentContainmentErrorV0(code, replyTr) {
  const replies = {
    agent_emergency_disable: "Agent katmanı acil durumda devre dışı.",
    agent_turn_in_flight: "Önceki tur henüz tamamlanmadı.",
    agent_max_iterations: "Oturum tur sınırına ulaşıldı.",
    agent_session_token_ceiling: "Oturum token tavanına ulaşıldı.",
    agent_recursive_tool_lock: "Araç çağrısı özyinelemeli kilit nedeniyle reddedildi."
  };
  const err = new Error(code);
  err.code = code;
  err.containment = true;
  err.reply = replyTr || replies[code] || "Agent containment.";
  err.directive = "NONE";
  return err;
}
