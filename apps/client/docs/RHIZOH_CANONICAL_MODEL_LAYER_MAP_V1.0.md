# RHIZOH Canonical Model Layer Map v1.0

**Tag:** `CORE-ELIGIBLE` · **Status:** `SSOT FREEZE` (v1.0)  
**Scope:** Living world entry felt-model only — not WAL, sealer, gateway execution, or frozen `phase*.js` subgraph.

---

## Freeze declaration

| Rule | Meaning |
|------|---------|
| **Single name** | All listed capabilities live under **Rhizoh Canonical Model Layer (RCML)** — no parallel product names in UI copy or docs. |
| **Model vs UI** | **Model** = deterministic JS modules + schemas. **UI** = read-only projection from `buildRhizohLivingWorldEntryModelV0` → `RhizohLivingWorldEntryShell`. UI never owns drift math or storage keys. |
| **SSOT** | This file + module paths below. `RHIZOH_CASTLE_REALITY_OS_ARCHITECTURE_MAP.md` §12 **indexes** RCML; it does not redefine constants. |
| **Change policy** | v1.0 constants / topology: intentional PR + test green. No drive-by renames. v1.1+ requires new schema suffix or doc version bump. |
| **Enforcement** | [`RCML_FREEZE_CONTRACT_V1.0.md`](./RCML_FREEZE_CONTRACT_V1.0.md) · `npm run rcml:validate-freeze-contract` (CI + quick boundaries) |

**Umbrella schema:** `castle.rhizoh.canonical_model_layer.v1`

**RCML is not:** external oracle truth, Academy learning pipeline, exportable lesson artifacts, or synchronous multiplayer world state. Truth boundary: [`ACADEMY_REAL_SIGNAL_OUTPUT_CONNECTION_V1.0.md`](./ACADEMY_REAL_SIGNAL_OUTPUT_CONNECTION_V1.0.md).

---

## One stack — five layers (model)

Execution order on user action (`observe` | `enter_castle`):

```text
┌─────────────────────────────────────────────────────────────┐
│  RCML — Rhizoh Canonical Model Layer (felt world, v1.0)      │
├─────────────────────────────────────────────────────────────┤
│  L1  Identity binding      user (self_*) ≠ session (wi_*)   │
│  L2  Entropy economy       recharge · fatigue · attention    │
│  L3  Drift calibration     intensity cap · cumulative cap    │
│  L4  Mutation feedback     ledger · seal · return delta      │
│  L5  Coherence             cross-session · field · agree.  │
└─────────────────────────────────────────────────────────────┘
         ▲                              │
         │         Model SSOT           │  UI projection only
         │                              ▼
   recordWorldMutationV0 ──► buildRhizohLivingWorldEntryModelV0
                                      │
                                      ▼
                         RhizohLivingWorldEntryShell (3 zones)
```

| RCML layer | Model SSOT (code) | Schema id |
|------------|-------------------|-----------|
| **L1 Identity binding** | `identityDriftBindingV0.js` | `castle.rhizoh.identity_drift_binding.v0` |
| **L2 Entropy economy** | `perceptualEntropyEconomyV0.js` | `castle.rhizoh.perceptual_entropy_economy.v0` |
| **L3 Drift calibration** | `worldDriftCalibrationV0.js` | `castle.rhizoh.world_drift_calibration.v0` |
| **L4 Mutation feedback** | `worldMutationFeedbackV0.js` | `castle.rhizoh.world_mutation_feedback.v0` |
| **L5 Coherence** | see §Coherence bundle | multiple (below) |

**Orchestration entry (model composer):** `rhizohLivingWorldEntryOrchestratorV0.js`  
**Mount + action wiring:** `AppRhizoh528.jsx`  
**RLL-O tick (atmosphere only, not RCML):** `RhizohAtmospherePresenceBridge.jsx`

---

## L1 — Identity binding

| Concern | Model | UI |
|---------|-------|-----|
| User identity | `resolvePersistentSelfSignatureV0` → `self_*` (localStorage) | `continuityStrip.whyHere` · `identityBinding.selfHint` (`self · xxxx`) |
| Session identity | `resolveSessionIdentityV0` → `worldInstanceId` | `worldState.worldInstance.instanceId` (read-only label) |
| Drift bind key | `bindIdentityDriftContextV0` | never shown raw |

**Invariant:** Entropy economy and long-term anchors bind to **self**, not session.

---

## L2 — Entropy economy

| Mechanism | Model constant / fn | UI |
|-----------|---------------------|-----|
| Budget | `PERCEPTUAL_ENTROPY_BUDGET_V0` = `1.0` | not shown as number |
| Recharge | `ENTROPY_RECHARGE_PER_HOUR_V0` = `0.18` | copy on recharge only |
| Fatigue | `FATIGUE_INCREMENT_V0` · sessionStorage | `driftCalibration.fatigueTier` → tone only |
| Attention decay | `computeAttentionDecayV0` | `driftCalibration.attention01` internal; affects felt drift |
| Spend gate | `spendEntropyWithEconomyV0` | toast: *Dikkat ve entropy tükendi…* |

**Invariant:** Spend runs in `recordWorldMutationV0` before drift caps apply to proposed ledger.

---

## L3 — Drift calibration

| Control | Model constant | UI |
|---------|----------------|-----|
| Per-action cap | `DRIFT_INTENSITY_CAP_PER_ACTION_V0` = `0.14` | toast: *Değişim ölçülü…* |
| Cumulative cap | `DRIFT_CUMULATIVE_CAP_V0` = `0.72` | `driftCalibration.driftCapped` |
| Legacy session budget | `readPerceptualEntropyBudgetV0` (no identity) | fallback path only |

**Invariant:** `applyWorldDriftCalibrationV0` never advances sealer epoch or WAL.

---

## L4 — Mutation feedback

| Action | Model field delta | UI |
|--------|-------------------|-----|
| `observe` | `observationImprint` ↑ · `atmosphereShift` ↑ | toast · `mutationEcho` |
| `enter_castle` | `castleAffinity` ↑ · `atmosphereShift` ↑ | toast · castle glow (`mutationBias`) |
| Return | `diffMutationLedgersV0` sealed vs current | `returnDeltaLine` · continuity *bugün değişti* |

**Storage (model only):**

| Key pattern | Store | Purpose |
|-------------|-------|---------|
| `rhizoh.world_mutation.v0:{wi}` | sessionStorage | live ledger |
| `rhizoh.world_mutation.v0:sealed:{wi}` | sessionStorage | tab return delta |

**Invariant:** Mutation is **felt projection** — not world authority.

---

## L5 — Coherence (bundle)

Coherence is one RCML layer with three **model legs** (all read-only):

| Leg | Model SSOT | Role |
|-----|------------|------|
| **Cross-session** | `crossSessionWorldCoherenceV0.js` | localStorage anchor · days-later similar *feel* |
| **Passive perception field** | `passivePerceptionFieldCoherenceV0.js` | shared **perception** not shared **state** |
| **Agreement layer** (Spiral phase) | `spiralMMOAgreementLayerV0.js` | proto-world mesh · soft consensus |

| Leg | Store | UI zone |
|-----|-------|---------|
| Cross-session | `rhizoh.cross_session.coherence.v0:{wi}` (localStorage) | `continuityStrip.crossSessionEcho` |
| Perception field | deterministic hash | `worldState.collectiveFeeling.secondary` |
| Agreement | flag-gated | `worldState.spiralAgreement` · `perceptionField.bridge` |

**Coherence invariants (frozen):**

- `sharedState: false` always.
- `world ≠ shared state` · `world = shared perception field` (+ optional agreement layer).
- No WAL merge · no multiplayer state in v1.0.

**Flags (model gates, not UI):**

| Env | RCML leg enabled |
|-----|------------------|
| (default) | cross-session + passive field (deterministic) |
| `VITE_SPIRAL_MMO_PERCEPTION_BRIDGE=1` | perception field bridge copy |
| `VITE_SPIRAL_MMO_AGREEMENT_LAYER=1` | proto mesh + agreement layer |

---

## UI vs Model — contract (frozen)

### Model owns

- All constants in §L2–L4 tables.
- Storage keys and schemas.
- `recordWorldMutationV0` · `buildRhizohLivingWorldEntryModelV0`.
- Copy strings returned as `feedbackLine` / `*Echo` / `*Line` fields (Turkish v1.0).

### UI owns

- Layout of three zones: Continuity · World State · Action Surface.
- Presentation of model fields (no recomputation).
- `data-zone` / `data-rhizoh-*` attributes for tests.
- Navigation (`/academy/observe`, scroll `#rhizoh-castle-presence`).

### UI must not

- Write sessionStorage / localStorage for RCML keys.
- Expose numeric entropy, fatigue, or agreement scores to end users.
- Imply live player count or shared game state.

**CI:** [`RCML_FREEZE_CONTRACT_V1.0.md`](./RCML_FREEZE_CONTRACT_V1.0.md) — `npm run rcml:validate-freeze-contract` blocks model-in-UI regressions.

### Single UI shell (frozen)

| UI file | Role |
|---------|------|
| `RhizohLivingWorldEntryShell.jsx` | Only canonical entry surface for RCML |
| `AppRhizoh528.jsx` | Mount · identity bind · mutation actions · seal hooks |

**Deprecated for canonical entry:** separate ribbon / grounding / collective panels as primary entry (may exist in repo; not RCML mount path).

---

## Model output shape (orchestrator freeze)

`buildRhizohLivingWorldEntryModelV0` returns:

| Block | RCML layers represented |
|-------|-------------------------|
| `continuityStrip` | L5 cross-session · L4 mutation echo · L1 whyHere |
| `worldState` | L4 castle pulse · L5 collective/field/agreement · L2 drift meta |
| `actionSurface` | affordances only (no RCML math) |
| `identityBinding` | L1 hint |
| `mutationFeedback` | L4 full feedback object |
| `crossSessionCoherence` | L5 cross-session meta |

**Screen mode (frozen):** `living_world_entry_castle_first`

---

## Persistence adjacent (not RCML core)

| Module | Role vs RCML |
|--------|----------------|
| `livingWorldPersistenceUxV0.js` | Visit rhythm · session copy — feeds L5 continuity inputs |
| `livingWorldCollectivePulseV0.js` | Emotion pool — merged by L5 perception field |

These are **inputs** to RCML orchestrator, not replacements for RCML layers.

---

## Test SSOT (freeze)

| Test file | RCML coverage |
|-----------|---------------|
| `identityDriftBindingV0.test.js` | L1 |
| `perceptualEntropyEconomyV0.test.js` | L2 |
| `worldDriftCalibrationV0.test.js` | L3 |
| `worldMutationFeedbackV0.test.js` | L4 |
| `crossSessionWorldCoherenceV0.test.js` | L5 cross-session |
| `passivePerceptionFieldCoherenceV0.test.js` | L5 field |
| `spiralMMOAgreementLayerV0.test.js` | L5 agreement |
| `livingWorldEntrySingleFlowV0.test.js` | L1–L5 integration |

Run: `npm test -- --run src/rhizoh/experience/__tests__/`

---

## Authority boundary (epistemic)

| RCML may | RCML may not |
|--------|----------------|
| Influence **felt** continuity copy | Advance sealer epoch |
| Session/local projection storage | Write WAL authority segments |
| Deterministic multi-user **perception** | Merge shared execution state |
| Gate actions via entropy | Act as agent or observer with execution rights |

*Agents may influence interpretation, never execution.* — [`docs/OBSERVATION_FABRIC_V1.md`](../../../docs/OBSERVATION_FABRIC_V1.md)

---

## Version index

| Version | Date | Note |
|---------|------|------|
| **v1.0** | 2026-05 | Initial freeze: L1–L5 under RCML single name |

**Next doc touch:** v1.1 only with explicit version bump + changelog section below.

### v1.0 changelog

- Unified **Rhizoh Canonical Model Layer (RCML)** naming.
- Frozen UI vs Model contract for `AppRhizoh528` + `RhizohLivingWorldEntryShell`.
- Locked five layers: identity binding · entropy economy · drift calibration · mutation feedback · coherence.

---

*RCML v1.0 — SSOT for felt living-world entry. Runtime map index: [`RHIZOH_CASTLE_REALITY_OS_ARCHITECTURE_MAP.md`](./RHIZOH_CASTLE_REALITY_OS_ARCHITECTURE_MAP.md) §12.*
