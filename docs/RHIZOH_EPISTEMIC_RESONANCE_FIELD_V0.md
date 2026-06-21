# Rhizoh Epistemic Resonance Field v0

**Status:** DRAFT · `RESEARCH-ONLY` · **measurement only**

---

## Critical boundary

**Resonance field measures observational geometry — it does NOT modulate the system.**

| | Narrative plane | Resonance field |
|--|-----------------|-----------------|
| `epistemicResonance` flag | always `false` | N/A |
| `resonance_coefficient` | not computed | computed read-only |
| Influences narrative | ❌ | ❌ |
| Influences causal graph | ❌ | ❌ |

Statistical familiarity (`epistemicReturnField`) ≠ epistemic resonance coefficient.

---

## API

```javascript
window.__rhizoh.epistemicResonanceField.measure({ locale: "en" });
```

Output per entity:

```json
{
  "entity": "origin_home_serencebey",
  "attention_duration": 1200,
  "semantic_alignment": 0.73,
  "revisit_probability_delta": 0.09,
  "resonance_coefficient": 0.61,
  "measurementOnly": true,
  "influencesNarrative": false
}
```

---

## CI

`epistemicResonanceFieldV0.js` must include `measurementOnly: true` and `influencesNarrative: false`.

---

## Related

- [`RHIZOH_EPISTEMIC_RETURN_FIELD_V0.md`](RHIZOH_EPISTEMIC_RETURN_FIELD_V0.md)
- [`RHIZOH_EPISTEMIC_SEPARATION_PROOF_V0.md`](RHIZOH_EPISTEMIC_SEPARATION_PROOF_V0.md)
