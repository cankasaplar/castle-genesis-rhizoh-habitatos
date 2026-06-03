/**
 * Agent Cognition Boundary v0 — golden rule enforcement.
 * Agents can interpret, cannot originate world state (no SCR bypass / MCIB origination).
 * @see docs/RHIZOH_AGENT_COGNITION_BOUNDARY_V0.md
 */

export const AGENT_COGNITION_BOUNDARY_SCHEMA_V0 = "castle.rhizoh.agent_cognition_boundary.v0";

export const AGENT_GOLDEN_RULE_V0 =
  "agents_can_interpret_cannot_originate_world_state";

export const RHIZOH_AGENT_COGNITION_BOUNDARY_EVENT_V0 = "rhizoh:agent-cognition-boundary-v0";

/** SSOT keys agents must never author (world origination). */
export const AGENT_FORBIDDEN_WORLD_SSOT_KEYS_V0 = Object.freeze([
  "presenceFrame",
  "t0UnifiedFrame",
  "worldEpisode",
  "worldActionLog",
  "surfaceCitizenship",
  "surfaceBindings",
  "surfaceSingularity",
  "worldIdentity",
  "worldWalPersistence",
  "replayMode",
  "replayedWorldState"
]);

/** @type {ReturnType<typeof evaluateAgentCognitionBoundaryV0> | null} */
let lastBoundaryReport = null;

/**
 * @param {object} agentInhabitant
 */
export function assertAgentInterpretOnlyV0(agentInhabitant) {
  if (!agentInhabitant || agentInhabitant.kind !== "agent") {
    return Object.freeze({ ok: true, code: "not_agent" });
  }
  if (agentInhabitant.originate_world_state === true) {
    return Object.freeze({ ok: false, code: "agent_originate_forbidden" });
  }
  if (agentInhabitant.scr_bypass === true || agentInhabitant.mcib_origin === true) {
    return Object.freeze({ ok: false, code: "scr_bypass_forbidden" });
  }
  if (agentInhabitant.interpret_only !== true) {
    return Object.freeze({ ok: false, code: "interpret_only_required" });
  }
  return Object.freeze({ ok: true, code: "interpret_only" });
}

/**
 * @param {string} ssotKey
 */
export function isAgentForbiddenWorldSsotKeyV0(ssotKey) {
  return AGENT_FORBIDDEN_WORLD_SSOT_KEYS_V0.includes(String(ssotKey || ""));
}

/**
 * @param {{ agent_id: string, label?: string, originate_world_state?: boolean, mcib_origin?: boolean, scr_bypass?: boolean }} spec
 */
export function validateCastleAgentRegistrationV0(spec) {
  if (spec?.originate_world_state === true) {
    return Object.freeze({ ok: false, code: "registration_originate_forbidden" });
  }
  if (spec?.mcib_origin === true || spec?.scr_bypass === true) {
    return Object.freeze({ ok: false, code: "registration_scr_bypass_forbidden" });
  }
  return Object.freeze({ ok: true, code: "registration_ok" });
}

/**
 * Stamp required boundary flags on agent inhabitant records.
 * @param {object} agent
 */
export function stampAgentBoundaryFlagsV0(agent) {
  return Object.freeze({
    ...agent,
    interpret_only: true,
    originate_world_state: false,
    scr_bypass_forbidden: true,
    mcib_origin: false,
    wal_authority: false,
    owns_state: false,
    golden_rule: AGENT_GOLDEN_RULE_V0
  });
}

/**
 * @param {object[]} agentInhabitants
 * @param {object} [rhWindow]
 */
export function evaluateAgentCognitionBoundaryV0(agentInhabitants, rhWindow = null) {
  const rh = rhWindow || (typeof window !== "undefined" ? window.__rhizoh || {} : {});
  /** @type {object[]} */
  const violations = [];

  for (const agent of agentInhabitants || []) {
    const check = assertAgentInterpretOnlyV0(agent);
    if (!check.ok) {
      violations.push(
        Object.freeze({
          code: check.code,
          inhabitant_id: agent.inhabitant_id,
          rule: AGENT_GOLDEN_RULE_V0
        })
      );
    }
  }

  if (rh.agentWorldStateOrigin === true) {
    violations.push(
      Object.freeze({
        code: "agent_world_state_origin_flag",
        rule: AGENT_GOLDEN_RULE_V0
      })
    );
  }

  const report = Object.freeze({
    schema: AGENT_COGNITION_BOUNDARY_SCHEMA_V0,
    atMs: Date.now(),
    golden_rule: AGENT_GOLDEN_RULE_V0,
    agent_count: (agentInhabitants || []).length,
    violations: Object.freeze(violations),
    ok: violations.length === 0
  });

  lastBoundaryReport = report;
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.agentCognitionBoundary = report;
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_AGENT_COGNITION_BOUNDARY_EVENT_V0, {
          detail: Object.freeze({ report })
        })
      );
    } catch {
      /* noop */
    }
  }
  return report;
}

export function readAgentCognitionBoundaryReportV0() {
  return (
    lastBoundaryReport ||
    (typeof window !== "undefined" ? window.__rhizoh?.agentCognitionBoundary : null) ||
    null
  );
}

export function resetRhizohAgentCognitionBoundaryForTestV0() {
  lastBoundaryReport = null;
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.agentCognitionBoundary;
    delete window.__rhizoh.agentWorldStateOrigin;
  }
}
