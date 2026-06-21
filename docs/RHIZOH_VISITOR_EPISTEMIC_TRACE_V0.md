# Rhizoh Visitor Epistemic Trace v0

**Status:** DRAFT · `RESEARCH-ONLY`  
**Spine:** Echo trace ≠ memory ≠ identity · Validated observer node

## Purpose

Record **anonymous observation path** for invitation study — what surfaces were visited, cross-session return, coherence with the three epistemic coordinates.

**Not** user memory. **Not** `epi_id`. **Not** WAL.

## Output shape

```json
{
  "visitor_id": "anon",
  "sessions": 2,
  "visited_surfaces": ["map", "chess"],
  "path": ["invite", "chat", "map", "chess"],
  "coherence_alignment": 0.71,
  "return_vector": "weak_identity_resonance",
  "engagement_vector": 0.43,
  "return_probability": 0.61,
  "isMemory": false,
  "isIdentity": false,
  "isEchoTrace": true
}
```

| Field | Meaning |
|-------|---------|
| `coherence_alignment` | Fraction of {map, chess, castle} visited (0–1) |
| `return_vector` | `none` · `weak_identity_resonance` · `moderate_co_observation` · `strong_return_echo` |
| `sessions` | Cross-browser-tab echo count (localStorage) |

## Console API

```javascript
window.__rhizoh.visitorTrace.snapshot()
window.__rhizoh.visitorTrace.record("map")
```

## Related

- [`RHIZOH_RETURN_BEHAVIOR_TRACE_V0.md`](RHIZOH_RETURN_BEHAVIOR_TRACE_V0.md)
- [`RHIZOH_OBSERVER_NODE_SPEC.md`](RHIZOH_OBSERVER_NODE_SPEC.md)
- Runtime: `apps/client/src/rhizoh/ingress/visitorEpistemicTraceV0.js`
