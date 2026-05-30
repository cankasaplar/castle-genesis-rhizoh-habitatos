# Authority Perception Failure Modes — UX / Legal Mitigation Matrix v1.0

**Status:** FROZEN · **Code:** `authorityPerceptionFailureModesV0.js`  
**Verify:** `npm run ops:phase3-exposure-behavior-boundaries`

---

## Primary risk domain (SSOT closure)

> Rhizoh is a bounded observability system whose primary risk domain is not execution failure, but **authority misattribution** under high-coherence observational outputs.

---

## Cross-layer rules

| Layer | Rule |
|-------|------|
| Engineering | No output may contain **actionable authority semantics** |
| UX | No output may be interpreted as **instruction** |
| Legal | No output may imply **advisory responsibility** or **intent** |

System export: `NO_ACTION_CLAIM_MODE`

---

## Failure modes M0–M7

| ID | Failure | UX mitigation (summary) | System mitigation (summary) |
|----|---------|-------------------------|----------------------------|
| **M0** | System as decision maker | Passive framing; “observational, not instruction” | `NO_ACTION_CLAIM_MODE`; forbid imperative |
| **M1** | Attractor = intent | Display “cluster centroid state”; no pulls/prefers | No intentionality vocabulary in export |
| **M2** | Proposal = recommendation | “non-executable configuration hypothesis” | `feedsExecution: false`, `cannotBeInterpretedAsGuidance: true` |
| **M3** | Telemetry = surveillance | Aggregated system observation; no “you” | No identity inference; no Phase 3D personalization |
| **M4** | Coherence = truth | “stability ≠ correctness guarantee” | Truth semantics explicitly absent |
| **M5** | Agency projection | “System does not form intent or goals” | No first-person export language |
| **M6** | Proposal = hidden steering | UI zones: OBSERVATION / PROPOSAL / EXECUTION | Proposal not adjacent to execution in same context |
| **M7** | Completeness illusion | “Partial observability system” | `unobserved_residual_always_exists: true` |

Full records: `AUTHORITY_PERCEPTION_FAILURE_MODES_V0` in code export.

---

## What this is NOT

| Not the risk | Actual risk |
|--------------|-------------|
| Wrong calculation | Interpretation collapse |
| Runtime bug | User turns observation into authority |

---

## Export contract

`phase3Observation.authorityPerception` + `authorityPerceptionValidation`

Required flags:

- `noActionClaimMode`: `NO_ACTION_CLAIM_MODE`
- `cannotBeInterpretedAsInstruction`: true
- `cannotBeInterpretedAsGuidance`: true
- `unobservedResidualAlwaysExists`: true
- `stabilityNotTruthGuarantee`: true

---

## Related

- [`RHIZOH_INTERPRETATION_LAYER_BOUNDARY_V1.0.md`](RHIZOH_INTERPRETATION_LAYER_BOUNDARY_V1.0.md)
- [`PHASE3D_OPEN_EXPOSURE_BEHAVIOR_BOUNDARIES_V1.0.md`](PHASE3D_OPEN_EXPOSURE_BEHAVIOR_BOUNDARIES_V1.0.md)

---

*Authority perception v1.0 — counsel + UX matrix, engineering-enforced export contract.*
