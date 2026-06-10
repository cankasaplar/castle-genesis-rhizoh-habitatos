/**
 * FOX axis policy — Sprint 5 guardrail.
 * New data sources may feed existing axes; axis count must NOT grow.
 */

export const FOX_AXIS_POLICY_SCHEMA_V1 = "castle.rhizoh.fox_axis_policy.v1";

/** Frozen attention axes (v1). Do not add calendarWeight, socialWeight, etc. */
export const FOX_ATTENTION_AXIS_KEYS_V1 = Object.freeze([
  "userSignal",
  "continuitySignal",
  "emotionalSignal",
  "noveltySignal",
  "worldSignal"
]);

export const FOX_ATTENTION_AXIS_COUNT_V1 = FOX_ATTENTION_AXIS_KEYS_V1.length;

/**
 * @param {Record<string, unknown>} field
 */
export function validateFoxAttentionFieldAxesV1(field) {
  const f = field && typeof field === "object" ? field : {};
  const keys = Object.keys(f).filter((k) => k.endsWith("Signal") && k !== "dominantSource");
  const extra = keys.filter((k) => !FOX_ATTENTION_AXIS_KEYS_V1.includes(k));
  return Object.freeze({
    valid: extra.length === 0,
    axisCount: FOX_ATTENTION_AXIS_COUNT_V1,
    extraAxes: extra,
    message:
      extra.length === 0
        ? "axis_policy_ok"
        : `forbidden_attention_axes:${extra.join(",")}`
  });
}
