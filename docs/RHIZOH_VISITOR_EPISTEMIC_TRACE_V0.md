# Rhizoh Visitor Epistemic Trace v0

**Status:** DRAFT · `RESEARCH-ONLY`  
**Spine:** Trace ≠ memory · Observation ≠ Execution

## Purpose

Record **anonymous session path** for invited observers — what surfaces they touched (invite, chat, map, chess, castle) — without writing to identity event log or WAL.

This is **not** user memory. It is an interpretation-only engagement trace for invitation study (`RHIZOH_INVITATION_STUDY_V0.md`).

## Output shape

```json
{
  "schema": "castle.rhizoh.visitor_epistemic_trace.v0",
  "visitor_session": "anonymous",
  "path": ["invite", "chat", "map", "chess"],
  "engagement_vector": 0.43,
  "return_probability": 0.61,
  "interpretationOnly": true,
  "isMemory": false
}
```

| Field | Meaning |
|-------|---------|
| `engagement_vector` | Heuristic 0–1 from path diversity + visit depth |
| `return_probability` | Heuristic 0–1 — **not** a production ML model |
| `cohortId` | From opaque invite token when present |

## Console API

```javascript
window.__rhizoh.visitorTrace.snapshot()
window.__rhizoh.visitorTrace.record("map")
```

## Wiring (automatic)

- Invite proceed → `chat`
- Map camera feedback → `map`
- Chess arena open → `chess`
- Castle init gate → `castle`
- `/world` path → `map`

## Related

- [`RHIZOH_MEANING_LAYER_V0.md`](RHIZOH_MEANING_LAYER_V0.md)
- [`RHIZOH_INVITATION_STUDY_V0.md`](RHIZOH_INVITATION_STUDY_V0.md)
- Runtime: `apps/client/src/rhizoh/ingress/visitorEpistemicTraceV0.js`
