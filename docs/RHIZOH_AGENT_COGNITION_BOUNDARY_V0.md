# Rhizoh Agent Cognition Boundary v0

**Status:** ACTIVE · **SPECFLOW:** `RESEARCH-ONLY`  
**Modül:** `rhizohAgentCognitionBoundaryV0.js`

---

## Golden rule

```text
Agents can interpret, cannot originate world state
```

Agents are **RCAL subscribers** — not MCIB originators, not SCR bypass paths.

---

## Forbidden

- `originate_world_state: true` on registration
- `scr_bypass` / `mcib_origin` flags
- Writing SSOT keys: `presenceFrame`, `worldEpisode`, `surfaceCitizenship`, `worldIdentity`, …

---

## SSOT

```javascript
window.__rhizoh.agentCognitionBoundary
```

Co-presence field: `agent_boundary`, `rules.agent_interpret_only`

Bkz. [`RHIZOH_CASTLE_COHERENCE_HARDENING_V0.md`](RHIZOH_CASTLE_COHERENCE_HARDENING_V0.md)
