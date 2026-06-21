# Rhizoh Return Behavior Trace v0

**Status:** DRAFT · `RESEARCH-ONLY`  
**Extends:** [`RHIZOH_INVITATION_STUDY_V0.md`](RHIZOH_INVITATION_STUDY_V0.md) · [`RHIZOH_VISITOR_EPISTEMIC_TRACE_V0.md`](RHIZOH_VISITOR_EPISTEMIC_TRACE_V0.md)

---

## Purpose

Measure **return behavior** without user memory or identity SSOT — echo trace only.

Answers: *Does the observer come back? Do they align with the three epistemic surfaces?*

---

## Record shape

```json
{
  "visitor_id": "anon",
  "sessions": 2,
  "visited_surfaces": ["map", "chess"],
  "coherence_alignment": 0.71,
  "return_vector": "weak_identity_resonance",
  "engagement_vector": 0.43,
  "return_probability": 0.61,
  "isMemory": false,
  "isEchoTrace": true
}
```

---

## `return_vector` enum

| Value | Heuristic |
|-------|-----------|
| `none` | First session, low engagement |
| `weak_identity_resonance` | 2+ sessions OR engagement ≥ 0.3 |
| `moderate_co_observation` | 2+ sessions AND coherence ≥ 0.33 |
| `strong_return_echo` | 3+ sessions AND coherence ≥ 0.66 |

**Not ML** — deterministic heuristics for invitation study v0.

---

## `coherence_alignment`

Fraction of epistemic surfaces visited: `{map, chess, castle}` → 0.0 … 1.0

---

## Collection

```javascript
window.__rhizoh.visitorTrace.snapshot()
```

Cross-session: `localStorage` echo aggregate · per-session path: `sessionStorage`

---

## Publication use

Workshop / position paper **Section 6 — Results** (when N≥15 anonymized cohort records):

- stable identity continuity (`epi_id` repro)
- reproducible causal graphs
- observer consistency scoring (`coherence_alignment` distribution)

---

## Related

- [`RHIZOH_EPISTEMIC_DASHBOARD_V1.md`](RHIZOH_EPISTEMIC_DASHBOARD_V1.md)
- [`academic/RHIZOH_RESEARCH_PREPRINT_V1.md`](academic/RHIZOH_RESEARCH_PREPRINT_V1.md)
