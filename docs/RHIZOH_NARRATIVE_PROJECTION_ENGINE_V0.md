# Rhizoh Narrative Projection Engine v0

**Status:** DRAFT · `RESEARCH-ONLY`  
**Spine:** Observer traces recorded **without** causal or semantic coupling to generative narrative — until this engine **grounds** read-only descriptions.

---

## What this is NOT

| Claim | Status |
|-------|--------|
| Epistemic resonance | ❌ not measured |
| Bidirectional coupling | ❌ |
| Causal write | ❌ |
| Learning / adaptation input | ❌ |

**Statistical familiarity ≠ epistemic resonance.**

---

## Pipeline

```
observerTrace
   ↓
attention salience (intensity)
   ↓
semantic lookup (pin registry + runtime inspectMapPinOwner)
   ↓
narrative projection (plane C)
   ↓
read-only epistemic response
```

---

## API

```javascript
window.__rhizoh.narrativePlane.resolve({ locale: "en" });
// or
window.__rhizoh.narrativeProjectionEngine.resolve({ locale: "en" });

window.__rhizoh.narrativePlane.build({ locale: "en" });
// → entityNarrative, groundedNarratives, semanticCoupling: false
```

### Example — registered pin

```json
{
  "primaryFocus": {
    "entityId": "origin_home_serencebey",
    "title": "Serencebey origin seed",
    "description": "Permanent bootstrap observation window…",
    "grounded": true,
    "epistemicResonance": false
  }
}
```

### Example — unregistered pin_42 (console test)

```json
{
  "entityId": "42",
  "grounded": false,
  "description": "No semantic registry entry for pin_42 — attention logged, epistemic resonance not measured."
}
```

---

## Academic claim (corrected)

**Wrong:** *"observer is in epistemic resonance with system"*

**Right:** *"observer traces are recorded; narrative layer may ground them as read-only semantic projection without causal or bidirectional coupling."*

---

## Modules

| File | Role |
|------|------|
| `epistemicPinSemanticRegistryV0.js` | Static + runtime pin lookup |
| `narrativeProjectionEngineV0.js` | `resolve(observerTrace)` |
| `narrativePlaneProjectionV0.js` | Plane C `build()` + `resolve()` |

---

## Related

- [`RHIZOH_READ_ONLY_HOOK_V0.md`](RHIZOH_READ_ONLY_HOOK_V0.md)
- [`RHIZOH_EPISTEMIC_SOFT_IDENTITY_V0.md`](RHIZOH_EPISTEMIC_SOFT_IDENTITY_V0.md)
- [`RHIZOH_MEANING_LAYER_V0.md`](RHIZOH_MEANING_LAYER_V0.md)
