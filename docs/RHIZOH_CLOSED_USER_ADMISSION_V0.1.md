# Rhizoh Closed User Admission v0.1

**Status:** DRAFT · interpretation-only · non-executive  
**Layer:** Product ingress / cohort planning (not GEJ admission law)

## 1. Terminology correction (critical)

| Wrong framing | Correct framing |
|---------------|-----------------|
| “Invite list” of famous researchers | **Epistemic stress archetypes** (A–D axes) |
| First users = named individuals | **First reality test vectors** = behavior models |
| Direct world access to labs | **Role-gated, score-gated** closed cohort |

Named references (e.g. in founder notes) are **illustrative stress classes only**. Production code and ops **must not** encode personal names, institutional access claims, or reputational dependencies.

## 2. Four-axis stress model (CLOSED SYSTEM v0.1 FINAL)

| Gate ID | Stress class | Primary failure mode under test |
|---------|--------------|--------------------------------|
| `invariant_keeper` | Invariant Keeper | Formal correctness / proof drift |
| `systems_engineer` | Systems Engineer | Execution + infra / replay stress |
| `edge_builder` | Edge Builder | Physical-world coupling / sovereign node |
| `human_explorer` | Human Explorer | Interpretation / narrative misuse |

Rollout order (recommended): **math/formal → infra → edge → human** — not “who we know” but **which failure geometry** we need next.

## 3. Epistemic Stress Profile Registry

Each subject (opaque `subjectRef`, no PII in engine) maps to:

```json
{
  "invariant_resistance_score": 0.0,
  "boundary_break_probability": 0.0,
  "reproducibility_interaction_score": 0.0,
  "causal_disruption_index": 0.0
}
```

All scores ∈ [0, 1]. Derived deterministically from **observed signals** (telemetry buckets, self-assessment questionnaire, lab harness results) — never from a name lookup table.

## 4. Role Gate System (v0.2 operational model)

Each gate defines minimum profile thresholds + risk veto flags:

- **Invariant Keeper Gate** — high `invariant_resistance_score`, low `causal_disruption_index`
- **Systems Engineer Gate** — high `reproducibility_interaction_score`
- **Edge Builder Gate** — high `boundary_break_probability` (controlled)
- **Human Explorer Gate** — bounded `causal_disruption_index`, explicit ack flags

Admission verdict: `admit` | `hold` | `reject` + `primaryStressClass` + `gateId`.

## 5. Real-world constraints (why not “invite Jeff Dean”)

- Access = institution / lab / funding / NDA — not product invite
- System stage = legal-reviewable prototype, not research celebrity rollout
- Risk = reputational + legal + academic misrepresentation if names appear in ops

## 6. Implementation

| Artifact | Path |
|----------|------|
| Engine | `apps/client/src/rhizoh/ingress/closedUserAdmissionEngineV0.js` |
| Ingress metadata | `ingress_router.js` (`closedAdmission` block when env on) |
| Tests | `apps/client/src/rhizoh/ingress/__tests__/closedUserAdmissionEngineV0.test.js` |

**Env flags**

- `VITE_RHIZOH_CLOSED_ADMISSION=1` — expose admission status on ingress resolve
- `VITE_RHIZOH_CLOSED_ADMISSION_ENFORCE=1` — route `closed_admission_hold` until admit (UI TBD)

## 7. Invariants

- `interpretationOnly: true` — does not grant IAM, billing, or execution authority
- `nonExecutive: true` — Observation ≠ Execution
- No named dependency in code paths
- Invite tokens are opaque cohort handles, not personal identifiers

## 8. Go-live cohort simulation

`simulateGoLiveCohortV0({ nodeCount: 50, seed })` produces stress-class histogram + gate pass rates for capacity planning — not a mailing list.

---

*Rhizoh Systems — Closed User Admission v0.1 — 2026-05-19*
