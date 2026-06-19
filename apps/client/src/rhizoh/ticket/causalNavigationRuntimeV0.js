/**
 * Causal Navigation Runtime V0 — four-axis descriptor + triple-separation guard.
 *
 * CNR: permission-separated causal traversal runtime.
 * perception ≠ interaction ≠ execution
 *
 * interpretationOnly · nonExecutive
 * @see docs/RHIZOH_CAUSAL_NAVIGATION_RUNTIME_V1.md
 */

export const CAUSAL_NAVIGATION_RUNTIME_SCHEMA_V0 = "castle.rhizoh.cnr.v0";

export const CNR_AXIS_V0 = Object.freeze({
  EPISTEMIC: "epistemic",
  AUTHORITY: "authority",
  TEMPORAL: "temporal",
  TRAVERSAL: "traversal"
});

export const CNR_MODE_V0 = Object.freeze({
  PERCEPTION: "perception",
  INTERACTION: "interaction",
  EXECUTION: "execution"
});

/** Axis → primary module mapping. */
export const CNR_AXIS_MODULE_MAP_V0 = Object.freeze({
  [CNR_AXIS_V0.EPISTEMIC]: "driftAnalyticsEngineV0 · traceGraphIndexOptimizerV0",
  [CNR_AXIS_V0.AUTHORITY]: "admissionCubeCommitV0 · closedUserAdmissionEngineV0",
  [CNR_AXIS_V0.TEMPORAL]: "recTombstoneQueueV0 · runRecCycleCleanupV0",
  [CNR_AXIS_V0.TRAVERSAL]: "cognitiveActionLayerV0"
});

/** Mode → primary module mapping. */
export const CNR_MODE_MODULE_MAP_V0 = Object.freeze({
  [CNR_MODE_V0.PERCEPTION]: "cognitiveVisualizationBindingV0",
  [CNR_MODE_V0.INTERACTION]: "cognitiveActionLayerV0",
  [CNR_MODE_V0.EXECUTION]: "admissionCubeCommitV0"
});

/**
 * Frozen runtime descriptor for UI boot / documentation parity.
 */
export function getCausalNavigationRuntimeDescriptorV0() {
  return Object.freeze({
    schema: CAUSAL_NAVIGATION_RUNTIME_SCHEMA_V0,
    name: "Causal Navigation Runtime",
    acronym: "CNR",
    ssotSentence:
      "permission-separated causal traversal runtime — epistemic topology becomes navigable space",
    tripleSeparation: Object.freeze({
      perception: CNR_MODE_MODULE_MAP_V0[CNR_MODE_V0.PERCEPTION],
      interaction: CNR_MODE_MODULE_MAP_V0[CNR_MODE_V0.INTERACTION],
      execution: CNR_MODE_MODULE_MAP_V0[CNR_MODE_V0.EXECUTION],
      rule: "perception ≠ interaction ≠ execution"
    }),
    axes: Object.freeze(
      Object.values(CNR_AXIS_V0).map((axis) =>
        Object.freeze({
          axis,
          module: CNR_AXIS_MODULE_MAP_V0[axis]
        })
      )
    ),
    invariants: Object.freeze(["SC-01", "SC-02", "DR-01", "DR-02", "CAL-01", "CNR-01"]),
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * CNR-01 — verify pipeline outputs respect perception / interaction / execution boundaries.
 * @param {{
 *   cognitiveBinding?: object | null,
 *   cognitiveAction?: object | null,
 *   commit?: object | null
 * }} pipeline
 */
export function assertCnrTripleSeparationV0(pipeline) {
  const violations = [];

  if (pipeline.cognitiveBinding?.push?.uiEvents) {
    for (const ev of pipeline.cognitiveBinding.push.uiEvents) {
      if (ev.executionClass !== "suggest") {
        violations.push("CNR-01: perception push must be suggest-only");
        break;
      }
    }
  }

  if (pipeline.cognitiveAction?.exploration) {
    const ex = pipeline.cognitiveAction.exploration;
    if (ex.executionClass !== "read_only" || ex.causallyInert !== true) {
      violations.push("CNR-01: interaction must be read_only and causally inert");
    }
  }

  if (pipeline.commit?.ok === true && pipeline.cognitiveAction?.cubeStateCommit === true) {
    violations.push("CNR-01: execution cannot originate from CAL");
  }

  if (violations.length > 0) {
    return Object.freeze({ ok: false, code: "CNR_01_BOUNDARY_VIOLATION", violations });
  }

  return Object.freeze({ ok: true });
}
