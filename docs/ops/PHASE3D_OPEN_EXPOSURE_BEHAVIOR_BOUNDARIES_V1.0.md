# Open Exposure — Behavior Boundaries & Remaining Risks v1.0

**Status:** FROZEN · **Verify:** `npm run ops:phase3-exposure-behavior-boundaries`

When users see the system — what is stable, what stays open, what to test next.

---

## 1. On open — realistic behavior

### Stable (by design)

| Behavior | Guarantee |
|----------|-----------|
| Phase 3 runtime | Deterministic G1–G5 + WAL |
| Phase 3D | Observation only |
| Mode B | Proposals only (`feedsExecution: false`) |
| Execution | Never fed from shadow in-process |

### User experience (expected)

- Feels like **interpreting but not intervening** observer
- Some outputs “feel right” — **nothing auto-changes**
- Long-run perception: **transparent passive intelligence** (emergent)

---

## 2. Open areas (productization limits, not bugs)

| ID | Risk | Type | Mitigation |
|----|------|------|------------|
| **A** | Feedback loop leakage `observation→proposal→config→execution` | Technical/process | Firewall + human-only `apply_config` + verify script |
| **B** | Human bottleneck — proposal pile-up, frozen evolution | Operational | Ops cadence, TTL, supersede |
| **C** | Proposal quality drift — SNR collapse | Operational | Rank + reject + monitoring_hold cap |
| **D** | Interpretive leakage — authority feeling | Product/legal | Interpretation boundary + misunderstanding tests |
| **E** | Schema inflation — new metrics/proposal types | Long-term arch | Minimal primitive discipline |

### A — Feedback loop (critical)

Control question: **Does user telemetry indirectly bias shadow toward soft steering?**

- Allowed: telemetry → **control** gates (Phase 3)
- Watch: telemetry → **shadow evidence** → proposals that track cohort behavior
- Test: `feedback_loop_human_only` in behavior harness

### B — Human gate

Only `approved` → `applied_config` → published config changes control. Scale = ops risk.

### C — Proposal SNR

Shadow growth → mix of good/noise proposals. Track `stats` by state; reject path required.

### D — “System tells me what to do”

Reality: **state display**. Test: `misunderstanding_authority` scenarios.

### E — Primitive drift

New Phase 3D metrics / proposal kinds require explicit schema version — no ad-hoc fields.

---

## 3. Technical vs epistemic posture

| Outside | Inside |
|---------|--------|
| Passive, observational | Rich attractor/trajectory/perturbation maps |
| No auto mutation | Dense internal representation |

**Emergent:** users anthropomorphize → Counsel question:

> What **decision-influence feeling** does this create?

---

## 4. Recommended next work (no new layer)

| Activity | Purpose |
|----------|---------|
| User simulation / adversarial usage | Misread patterns |
| Misunderstanding scenarios | Authority confusion |
| Feedback loop verify | Human-only closure |
| Counsel on UX copy | Zone A vs C |

---

## Related

- [`PHASE3_CONTROL_OBSERVATION_FIREWALL_V1.0.md`](PHASE3_CONTROL_OBSERVATION_FIREWALL_V1.0.md)
- [`RHIZOH_INTERPRETATION_LAYER_BOUNDARY_V1.0.md`](RHIZOH_INTERPRETATION_LAYER_BOUNDARY_V1.0.md)
- [`CONTROLLED_EXPOSURE_FRAMEWORK_V1.0.md`](CONTROLLED_EXPOSURE_FRAMEWORK_V1.0.md)

---

*Exposure behavior boundaries v1.0 — architecture largely closed; perception risks open.*
