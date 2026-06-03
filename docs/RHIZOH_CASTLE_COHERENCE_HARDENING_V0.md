# Rhizoh Castle Coherence Hardening v0

**Status:** ACTIVE · **SPECFLOW:** `RESEARCH-ONLY`  
**Modül:** `rhizohCastleCoherenceHardeningV0.js`

---

## Rol

Perception drift control on **Castle = shared now surface**.

Answers:
- Does everyone see the same world?
- Is Castle forking?
- Are agent interpretations bleeding into projection authority?

---

## Perception drift classes

| Class | Meaning |
|--------|---------|
| `none` | Shared now intact |
| `fork_risk` | Castle vs SCR coherence split |
| `agent_projection_bleed` | Agent boundary violation |
| `castle_surface_split` | Studio→Castle unbound surfaces |
| `icl_structural` | ICL structural drift signal |

---

## API

- `detectPerceptionDivergenceV0(ctx)`
- `evaluateCastleCoherenceLockV0(ctx)` — ICL + perception + co-presence + agent boundary
- `publishCastleCoherenceHardeningV0(ctx)`
- `runCastleCoherenceStressHarnessV0(ctx)`

Studio loop stages: `castle_coherence_hardening`

---

## SSOT

```javascript
window.__rhizoh.castleCoherenceHardening
window.__rhizoh.castleCoherenceLock
window.__rhizoh.castleCoherenceStressHarness
```

CI: `npm run ops:castle-coherence-hardening-v0`

---

## Sıra

1. ~~Castle co-presence~~ ✔  
2. **Coherence hardening** ✔ (this doc)  
3. Organism stabilization  
4. Externalization (export snapshot, not world duplication)
