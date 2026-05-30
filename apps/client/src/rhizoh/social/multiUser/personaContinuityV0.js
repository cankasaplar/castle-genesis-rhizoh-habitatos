/**
 * SPECFLOW: RESEARCH-ONLY — **Persona continuity**: Rhizoh “kimlik hissi” için HOST / INTERPRETER /
 * OBSERVER bantları üzerinden süreklilik (CSIL `rhizohRuntimeRole` + social mode izi).
 *
 * `socialCoherenceKernelV0` `snapshotForLlm.personaContinuity` ile LLM omurgasına bağlanır;
 * `selectPersonaV0` davranış vektörünü ayrıca üretmeye devam eder — bu katman **rol hatırlığı**dır.
 */

export const PERSONA_CONTINUITY_SCHEMA_V0 = "castle.rhizoh.persona_continuity.v0";

/**
 * @param {string|null|undefined} rhizohRuntimeRole — CSIL kernel role
 * @returns {"HOST"|"INTERPRETER"|"OBSERVER"|"BRIDGE"|""}
 */
export function mapRuntimeRoleToPersonaContinuityBandV0(rhizohRuntimeRole) {
  const r = String(rhizohRuntimeRole || "").toUpperCase().trim();
  if (!r) return "";
  if (r === "INTERPRETER") return "INTERPRETER";
  if (r === "ARBITER" || r === "AMBIENT_PRESENCE") return "OBSERVER";
  if (r === "MEDIATOR") return "BRIDGE";
  if (r === "GUIDE" || r === "CONDUCTOR") return "HOST";
  return "HOST";
}

/** @returns {Record<string, unknown>} */
export function createInitialPersonaContinuityStateV0() {
  return {
    schema: PERSONA_CONTINUITY_SCHEMA_V0,
    band: "",
    ticksInBand: 0,
    continuityStrength01: 0,
    lastRuntimeRole: "",
    socialModeEcho: ""
  };
}

/**
 * @param {Record<string, unknown>|null|undefined} prev
 * @param {{ rhizohRuntimeRole?: string, socialMode?: string }} input
 */
export function advancePersonaContinuityV0(prev, input) {
  const i = input && typeof input === "object" ? input : {};
  const p = prev && typeof prev === "object" ? prev : createInitialPersonaContinuityStateV0();
  const role = String(i.rhizohRuntimeRole || "").trim();
  const mode = String(i.socialMode || "").trim().slice(0, 48);
  const band = mapRuntimeRoleToPersonaContinuityBandV0(role);
  const prevBand = String(p.band || "");
  const prevTicks = Math.max(0, Math.floor(Number(p.ticksInBand) || 0));
  const prevStr = Math.min(1, Math.max(0, Number(p.continuityStrength01) || 0));

  if (!band) {
    return {
      ...p,
      schema: PERSONA_CONTINUITY_SCHEMA_V0,
      ticksInBand: Math.max(0, Math.floor(prevTicks * 0.92)),
      continuityStrength01: Math.round(Math.min(1, Math.max(0, prevStr * 0.96)) * 1000) / 1000,
      socialModeEcho: mode || String(p.socialModeEcho || "")
    };
  }

  const sameBand = band === prevBand && prevBand.length > 0;
  const ticksInBand = sameBand ? prevTicks + 1 : 1;
  const bump = sameBand ? 0.085 : 0.038;
  const continuityStrength01 = Math.min(1, Math.round((prevStr * 0.91 + bump) * 1000) / 1000);

  const directorBrief = (() => {
    const b = band === "INTERPRETER" ? "Interpreter" : band === "OBSERVER" ? "Observer" : band === "BRIDGE" ? "Bridge" : "Host";
    return `${b} continuity · ${ticksInBand} tick${ticksInBand === 1 ? "" : "s"} · strength ${continuityStrength01}`;
  })();

  return {
    schema: PERSONA_CONTINUITY_SCHEMA_V0,
    band,
    ticksInBand,
    continuityStrength01,
    lastRuntimeRole: role,
    socialModeEcho: mode,
    directorBrief
  };
}
