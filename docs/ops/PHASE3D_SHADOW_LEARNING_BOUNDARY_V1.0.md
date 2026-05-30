# Phase 3D — Shadow Learning Boundary v1.0

**Status:** FROZEN (design) · **Complements:** [`PHASE3_CONTROL_OBSERVATION_FIREWALL_V1.0.md`](PHASE3_CONTROL_OBSERVATION_FIREWALL_V1.0.md)

---

## The tension (acknowledged)

| Risk if firewall is strict | Symptom |
|---------------------------|---------|
| Control learns nothing from observation | **Over-stabilization** — gates frozen, reality drifts |
| Observation grows without closure | **Beautiful ineffective atlas** — rich maps, no operational effect |

The firewall blocks **runtime backflow**. It does **not** block **offline internal representation**.

---

## Answer: yes — “learn without affecting control” is possible

**Condition:** learning writes only to **shadow stores** and **human-gated config versions** — never to `executeOrContain`, gate thresholds, or live reflex in the same process / same request.

```
Live path:     observed → control gates → execution
Shadow path:   observed → representation update → export / review → (later) config bump
```

No edge from shadow path → live path except **explicit human-approved schema/config publish**.

---

## What “internal representation” means (engineering, not narrative)

Allowed shadow artifacts (non-semantic, bounded):

| Artifact | Updates from | Feeds control? |
|----------|--------------|----------------|
| Attractor basin histogram | trajectory ring buffer | No |
| Transition count matrix \(P(to \mid from)\) | observed transitions | No |
| Perturbation sensitivity rankings | stressor exits | No |
| Divergence / entropy shadow p95 | live samples | No |
| **Threshold proposal** JSON | calibration job | No (until approved) |

Forbidden as automatic control inputs:

- `primaryAttractor`, `fragilityScore`, `influenceScore` → gate threshold
- `phase3dObservationGate` → `phase3ExecutionGate`
- Any “softening” of G2/G4 from atlas proximity

---

## Allowed learning surfaces (`SHADOW_LEARNING_SURFACE_V0`)

1. **Append-only observation log** — WAL-like, read by offline jobs only  
2. **Ring-buffer trajectory** — fixed N cycles, export weekly  
3. **Empirical basin centroids** — drift vs design catalog; alert only  
4. **Proposal queue** — `entropyLimit`, divergence bands, schema bump — status `pending_human`  

---

## The only legal bridge to control (slow, audited)

```
shadow proposal → ops review → config version tag → Phase 3 DEFAULT_CONFIG bump
```

Requirements:

- New config key in schema version (e.g. `rhizoh.phase3.config.v0.2`)  
- Audit log entry (who, when, which export id)  
- Re-run `ops:phase3-execution-runtime` on **control harness only** before deploy  

This is **not** learning in the loop; it is **governance of change**.

---

## How rich can observation get?

**As rich as needed** inside shadow, if:

| Rule | Rationale |
|------|-----------|
| No imports from observation → `phase3ControlledDivergenceRuntimeV0` | Firewall |
| No gate input keys from `FORBIDDEN_CONTROL_GATE_INPUTS_V0` | CI grep |
| Exports tagged `feedsExecution: false` | Contract |
| Richness = more dimensions **derived from same primitives** (u,s,g, D, entropy axes) | No new sensors |
| New **views** OK; new **authorities** not OK | Atlas ≠ steering wheel |

Practical ceiling before atlas feels “ineffective”: when shadow proposals are never reviewed — fix is **process**, not coupling.

---

## Twin failure modes (long-term watch)

| Signal | Interpretation | Response (no auto-couple) |
|--------|----------------|---------------------------|
| Control pass rate ↑, shadow optimal drift ↑ | Over-stabilization | Human review threshold proposal |
| Observation export size ↑, proposal queue empty | Ineffective atlas | Ops cadence for shadow review |
| `blind_exposure` in trajectory, control still pass | Firewall working; drills stale | Tighten **control** drills, not attractor import |

---

## Evolution (atlas vs semi-actuator)

Shadow is **not** locked to atlas forever. Allowed upgrade path:

- **Mode A (now):** observing atlas  
- **Mode B (when mature):** human-approved **proposal** semi-actuator — still no runtime backflow  

See [`PHASE3D_SHADOW_EVOLUTION_V1.0.md`](PHASE3D_SHADOW_EVOLUTION_V1.0.md).

## Code

`phase3DShadowLearningBoundaryV0.js` — surfaces, forbidden backflow channels, export validator.

```bash
npm run ops:phase3-control-observation-firewall
```

---

*Shadow learning v1.0 — representation may grow; authority may not leak.*
