# Rhizoh System Glossary v1.0

**Working vocabulary** for research, governance, simulation, and SpiralMMO framing.  
This document is **non-authoritative for runtime**: code + CI gates are truth. Use it for onboarding and cross-team language alignment.

---

## Core philosophy

| Term | Definition |
|------|------------|
| **Rhizoh** | A layered epistemic-integrity stack that separates observation, interpretation, execution boundaries, and authority. It does not replace human judgment; it structures uncertainty and multi-domain coordination. |
| **Epistemic integrity** | Outputs preserve uncertainty, context, and traceability instead of collapsing complexity into artificial certainty. |
| **Narrative layer** | Interpretive layer (headlines, summaries, cultural framing). **Non-executable** by contract. |
| **Operational reality** | Measurable state from infrastructure, telemetry, verified inputs. **Higher authority than narrative.** |

---

## Constitutional invariants (formal / spec)

These are documented and partially enforced across docs + runtime contracts; full formal closure lives in constraint / TLA tracks.

| Invariant | Meaning (summary) |
|-----------|-------------------|
| **NI2 — Non-interference** | Observation space must not directly mutate protected core state: observation does not imply execution. |
| **TI1 / TI1′ — Temporal isolation** | Internal logical time must not be driven by external traffic noise; tick coupling is internal. |
| **Execution guard** | When execution surfaces / data-plane are inactive, external inputs must not activate execution paths. |
| **Absolute invariance** | Core invariants stable under narrative pressure, amplification, or propagation. |

**Formal references:** `docs/RHIZOH_CONSTRAINT_CLOSURE_MAP_V1.0.md`, `docs/RHIZOH_TLA_EXECUTION_CORE_SKETCH_V1.0.md`

---

## System layers (RAW / DERIVED / POLICY)

| Layer | Role |
|-------|------|
| **RAW** | Direct operational measurements (rollout, GCL, coordination flags, load-test signals where present). |
| **DERIVED** | Compressed interpretation (health, narrative, validation flags). Non-authoritative. |
| **POLICY** | Human / institutional constraints; `can_execute: false`, decision owner, prohibited actions. |

---

## Governance and interpretation stack (gateway ops narrative)

Short names map to **implemented** modules under `apps/gateway/src/ops/`. Each has an ops doc under `docs/ops/`.

| Acronym | Full name | Question it answers |
|---------|------------|----------------------|
| **ASGL** | Action Semantic Governance Layer | *What does this action mean per domain?* |
| **ACRL** | Action Context Resolution Layer | *Is it valid here and now only?* |
| **ECL** | Epistemic Coherence Layer | *Which cross-layer reading is coherent?* |
| **CAB** | Coherence Authority Boundary | *Does “coherent” mean truth / policy / execution?* **No.** |
| **DLGL** | Decision Latency Governance Layer | *How do we compress operator latency without executing?* |
| **DPUB** | Decision Packet Uncertainty Boundary | *Does the packet collapse uncertainty into false certainty?* **Must not.** |
| **EDPL** | Epistemic Decision Pacing Layer | *Operational tempo* (`queue_saturation_index`, `pacing_frequency_limit`) and **temporary static posture windows** (not certainty zones). |
| **ETCL** | Epistemic Temporal Coherence Layer | *Do decisions across time windows contradict without reconcile?* |
| **RDOL** | Reality Drift Observer Layer | *What misapprehension shapes appear?* (sim vs live, propagation vs ops, robotics mismatch). |
| **DCL** | Drift Causality Layer | *Why did those shapes emerge?* (hypotheses, not blame). |

**Hard negations (CAB):** coherent ≠ executable truth; coherent ≠ policy override; coherent ≠ reality claim.

---

## Cultural and communication concepts

| Term | Definition |
|------|------------|
| **Social propagation simulation** | Deterministic model of narrative compression through channels (Slack, X, etc.); distortion and watermark survivability. |
| **Trust decay vs mythology** | Two reactions to divergence: distrust vs “hidden truth” narrative; both scored in cultural risk bundle. |
| **Screenshot economy** | Risk that visual fragments replace full operational context (watermark / scope policies mitigate). |
| **Confidence detachment** | Confidence becomes symbolic authority without epistemic grounding; tracked in validation + propagation. |

---

## SpiralMMO (research / world kernel vocabulary)

| Term | Repo anchor |
|------|-------------|
| **SpiralMMO kernel** | `apps/gateway/src/ops/spiralMMOGameKernelV0.js` — maps propagation / trust / mythology into simulation-facing game-layer signals (non-production authority). |
| **Identity OS, Ghost Pet, cognitive damping, shared memory, micro-constitutions** | **Product / design vocabulary** and broader client constitution space (`apps/client/src/rhizoh/constitution/`, kernel). There is **no** single `src/ui/cognitive_damping.js` in this monorepo; do not treat illustrative paths as SSOT. |

---

## Reality anchoring

Continuous alignment of simulation, narrative, and live telemetry / physical verification. Partially reflected in **RDOL** + divergence flags + robotics grounding; full operational program remains phase-gated per activation docs.

---

## Closing principle

**“The best ones resemble no one.”**  
Coherence is useful; creativity is protected; **authority stays bounded.**

---

## Glossary → monorepo index (verified)

Use this table instead of fictional `src/core/...` paths. Paths are relative to repo root.

### Layer partition and narrative export

| Glossary | Primary implementation |
|----------|-------------------------|
| RAW / DERIVED / POLICY | `apps/gateway/src/ops/interpretationSafetyContractV0.js` (`partitionStateLayersV0`, safety contract) |
| Unified export (stack assembly) | `apps/gateway/src/ops/unifiedStateNarrativeV0.js` |
| Tenant isolation / fingerprint | `apps/gateway/src/ops/narrativeTenantIsolationV0.js` |

### Acronym stack (order in export)

| Acronym | Module | Ops doc |
|---------|--------|---------|
| ASGL | `apps/gateway/src/ops/actionSemanticGovernanceLayerV0.js` | `docs/ops/ACTION_SEMANTIC_GOVERNANCE_V1.0.md` |
| ACRL | `apps/gateway/src/ops/actionContextResolutionLayerV0.js` | `docs/ops/ACTION_CONTEXT_RESOLUTION_V1.0.md` |
| ECL | `apps/gateway/src/ops/epistemicCoherenceLayerV0.js` | `docs/ops/EPISTEMIC_COHERENCE_V1.0.md` |
| CAB | `apps/gateway/src/ops/coherenceAuthorityBoundaryV0.js` | `docs/ops/COHERENCE_AUTHORITY_BOUNDARY_V1.0.md` |
| DLGL | `apps/gateway/src/ops/decisionLatencyGovernanceLayerV0.js` | `docs/ops/DECISION_LATENCY_GOVERNANCE_V1.0.md` |
| DPUB | `apps/gateway/src/ops/decisionPacketUncertaintyBoundaryV0.js` | `docs/ops/DECISION_PACKET_UNCERTAINTY_V1.0.md` |
| EDPL | `apps/gateway/src/ops/epistemicDecisionPacingLayerV0.js` | `docs/ops/EPISTEMIC_DECISION_PACING_V1.0.md` |
| ETCL | `apps/gateway/src/ops/epistemicTemporalCoherenceLayerV0.js` | `docs/ops/EPISTEMIC_TEMPORAL_COHERENCE_V1.0.md` |
| RDOL | `apps/gateway/src/ops/realityDriftObserverLayerV0.js` | `docs/ops/REALITY_DRIFT_OBSERVER_V1.0.md` |
| DCL | `apps/gateway/src/ops/driftCausalityLayerV0.js` | `docs/ops/DRIFT_CAUSALITY_V1.0.md` |

### Cultural / ASL bundle

| Concept | Module |
|---------|--------|
| Social propagation | `apps/gateway/src/ops/socialPropagationSimulationV0.js` |
| Trust / mythology | `apps/gateway/src/ops/trustDecayModelV0.js` |
| Applied systems (research + robotics + Spiral) | `apps/gateway/src/ops/appliedSystemsLayerV0.js` |
| Robotics grounding | `apps/gateway/src/ops/roboticsGroundingSafetyLayerV0.js` |

### CI gates (`package.json` scripts)

| Script | Runner |
|--------|--------|
| `ci:action-semantic-gate` | `apps/gateway/src/ops/runActionSemanticGovernanceGateV0.mjs` |
| `ci:action-context-gate` | `apps/gateway/src/ops/runActionContextResolutionGateV0.mjs` |
| `ci:epistemic-coherence-gate` | `apps/gateway/src/ops/runEpistemicCoherenceGateV0.mjs` |
| `ci:coherence-authority-gate` | `apps/gateway/src/ops/runCoherenceAuthorityBoundaryGateV0.mjs` |
| `ci:decision-latency-gate` | `apps/gateway/src/ops/runDecisionLatencyGovernanceGateV0.mjs` |
| `ci:decision-packet-uncertainty-gate` | `apps/gateway/src/ops/runDecisionPacketUncertaintyGateV0.mjs` |
| `ci:epistemic-decision-pacing-gate` | `apps/gateway/src/ops/runEpistemicDecisionPacingGateV0.mjs` |
| `ci:epistemic-temporal-coherence-gate` | `apps/gateway/src/ops/runEpistemicTemporalCoherenceGateV0.mjs` |
| `ci:reality-drift-observer-gate` | `apps/gateway/src/ops/runRealityDriftObserverGateV0.mjs` |
| `ci:drift-causality-gate` | `apps/gateway/src/ops/runDriftCausalityGateV0.mjs` |

Workflow: `.github/workflows/ci-enforcement.yml` (includes the gates above).

### Ops UI (hardening status panel)

| Surface | File |
|---------|------|
| Interpretation + stack summary | `apps/client/src/rhizoh/ops/RhizohInterpretationOpsPanel.jsx` |
| Hardening payload | `apps/gateway/src/server.js` (`unifiedState` compressed fields) |

---

## Anti-mythology matrix (conceptual map)

| Defense | Mechanism in repo |
|---------|-------------------|
| Semantic split | ASGL meaning vs ACRL context eligibility |
| Authority cap | CAB negations + interpretation safety contract |
| Packet honesty | DPUB invariant + SLA qualification (ack ≠ go) |
| Tempo without truth | EDPL pacing + TSPW + ETCL temporal rules |
| Drift shapes + why | RDOL + DCL |

---

*v1.0 — glossary + verified repo index. Update when adding layers or renaming exports.*
