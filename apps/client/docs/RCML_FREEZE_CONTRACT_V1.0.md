# RCML Freeze Contract v1.0 (developer + CI enforced)

**Tag:** `CORE-ELIGIBLE` · **Status:** `ENFORCED`  
**Parent SSOT:** [`RHIZOH_CANONICAL_MODEL_LAYER_MAP_V1.0.md`](./RHIZOH_CANONICAL_MODEL_LAYER_MAP_V1.0.md)

---

## Purpose

Guarantee **model logic never leaks into UI**. RCML (Rhizoh Canonical Model Layer) runs in JS model modules + mount wiring only. React surfaces **project** `buildRhizohLivingWorldEntryModelV0` output — they do not compute drift, entropy, mutation, or coherence.

**CI command:** `npm run rcml:validate-freeze-contract`

---

## Three zones (frozen)

| Zone | File(s) | May | Must not |
|------|---------|-----|----------|
| **UI membrane** | `RhizohLivingWorldEntryShell.jsx` | Render `model` · fire `onObserve` / `onEnterCastle` · layout / a11y | Import `rhizoh/experience/*` · touch storage · call RCML fns |
| **Mount** | `AppRhizoh528.jsx` | Wire RCML · call `recordWorldMutationV0` · seal hooks · compose model | Inline drift/entropy math · import low-level ledger writers |
| **Model** | `apps/client/src/rhizoh/experience/*V0.js` (+ orchestrator) | All RCML logic · storage keys · schemas | Import any `.jsx` / `.tsx` |

**Single canonical entry mount:** only `AppRhizoh528.jsx` may import `rhizoh/experience/` from React (`.jsx`/`.tsx`).

---

## RCML module registry (v1.0 lock)

These paths are the **only** authorized RCML model sources:

```
apps/client/src/rhizoh/experience/identityDriftBindingV0.js
apps/client/src/rhizoh/experience/perceptualEntropyEconomyV0.js
apps/client/src/rhizoh/experience/worldDriftCalibrationV0.js
apps/client/src/rhizoh/experience/worldMutationFeedbackV0.js
apps/client/src/rhizoh/experience/crossSessionWorldCoherenceV0.js
apps/client/src/rhizoh/experience/passivePerceptionFieldCoherenceV0.js
apps/client/src/rhizoh/experience/spiralMMOAgreementLayerV0.js
apps/client/src/rhizoh/experience/rhizohLivingWorldEntryOrchestratorV0.js
```

Adjacent (orchestrator inputs, not RCML core math):

```
apps/client/src/rhizoh/experience/livingWorldPersistenceUxV0.js
apps/client/src/rhizoh/experience/livingWorldCollectivePulseV0.js
```

---

## UI membrane — hard bans

In `RhizohLivingWorldEntryShell.jsx` the following are **forbidden** (substring + import scan):

| Category | Forbidden |
|----------|-----------|
| Imports | Any `from ".../rhizoh/experience/` |
| Storage | `sessionStorage`, `localStorage` |
| RCML APIs | `recordWorldMutationV0`, `buildRhizohLivingWorldEntryModelV0`, `spendEntropyWithEconomyV0`, `applyWorldDriftCalibrationV0`, `bindIdentityDriftContextV0`, `writeWorldMutationLedgerV0`, `readWorldMutationLedgerV0` |
| Constants | `DRIFT_INTENSITY_CAP`, `PERCEPTUAL_ENTROPY_BUDGET`, `ENTROPY_RECHARGE` |

**Allowed:** read `model.continuityStrip`, `model.worldState`, `model.actionSurface`; CSS/box-shadow from `model.worldState` values already computed by model.

---

## Mount — wiring rules

`AppRhizoh528.jsx` **may** import orchestrator + RCML wiring modules.

**Forbidden in mount** (must stay inside model stack):

- `applyWorldDriftCalibrationV0`
- `spendEntropyWithEconomyV0`
- `applyAttentionDecayToMutationV0`
- `writeWorldMutationLedgerV0`
- `applyEntropyRechargeV0`

Mount calls **`recordWorldMutationV0`** and **`buildRhizohLivingWorldEntryModelV0`** only — not internal calibration helpers.

---

## Model — upward isolation

All files under `apps/client/src/rhizoh/experience/` (excluding `__tests__/`) **must not** import:

- Any path ending in `.jsx` or `.tsx`
- `components/RhizohLivingWorldEntryShell`

Orchestrator remains pure JS composer.

---

## Developer workflow

```bash
# After RCML / entry shell / mount changes
npm run rcml:validate-freeze-contract

# Included in quick client boundary pass + full CI
npm run stabilization:validate-client-boundaries-quick
```

**Before PR touching entry UI or experience layer:** run contract + experience tests:

```bash
npm run rcml:validate-freeze-contract
npm test -w apps/client -- src/rhizoh/experience/__tests__/
```

---

## CI enforcement map

| Pipeline | Step |
|----------|------|
| `npm run rcml:validate-freeze-contract` | standalone |
| `stabilization:validate-client-boundaries-quick` | includes RCML contract |
| `.github/workflows/ci-enforcement.yml` | `RCML freeze contract v1` job step |

Exit code **1** on any violation — merge blocked.

---

## Escape hatch (intentional v1.1+ only)

1. Bump **RCML map** + **this contract** to v1.1.
2. Update `scripts/validateRcmlFreezeContractV1.mjs` allowlists explicitly.
3. Never silence with inline `rcml-freeze-ignore` without doc + reviewer sign-off.

---

## Violation examples

| Bad | Why |
|-----|-----|
| Shell imports `worldMutationFeedbackV0.js` | UI owns presentation only |
| Shell calls `sessionStorage.setItem` | storage is model layer |
| Mount imports `applyWorldDriftCalibrationV0` | bypasses `recordWorldMutationV0` pipeline |
| New `FooPanel.jsx` imports orchestrator | only `AppRhizoh528` mount allowed |
| Model imports `RhizohLivingWorldEntryShell` | upward coupling |

---

## Version

| Version | Note |
|---------|------|
| **v1.0** | Initial enforced contract + `validateRcmlFreezeContractV1.mjs` |

---

*Enforcement script:* `scripts/validateRcmlFreezeContractV1.mjs`
