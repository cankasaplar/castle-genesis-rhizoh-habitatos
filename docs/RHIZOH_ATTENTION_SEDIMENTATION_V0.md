# Rhizoh Attention Sedimentation v0 (shadow-D)

**Status:** DRAFT · `RESEARCH-ONLY` · PATH B habitat layer

---

## Position in the stack

| Plane | Role | Accumulates? | Authority |
|-------|------|--------------|-----------|
| A — Causal | Chess engine truth, system of record | No | **HARD** |
| B — Observation | Map trace, interaction | Ephemeral trace only | Read |
| C — Narrative | Stateless projection, temporal-aware labels | No | Read-only |
| **D-shadow** — Attention sediment | Frequency · co-occurrence · salience decay | **Yes** | SOFT |
| D-ledger — Meaning resonance | Bridge-validated co-occurrence events | Event log | SOFT |
| Paper | Reads A+B+C+D, reports, never shapes habitat | No | Observer |

**Tagline:** *Attention sedimentation, not meaning memory.*

---

## What shadow-D is

The **observation → persistence transition layer** that was missing:

- Görüyorsun (B) ✔
- Yorumluyorsun (C) ✔
- **İz birikiyor (shadow-D)** ✔ — without becoming truth or identity

This is **not** `meaningGraph.append()`. It is **attention sediment**: statistical residue of passive observation.

---

## Three input types (habitat strength)

| Input | Field | Effect |
|-------|-------|--------|
| **(A) Map** | `mapField` — pin density, hover repetition, cluster density | Attention field stabilizes |
| **(B) Video** | `videoField` — trajectory hint (frame span) | Temporal causal hint (strongest future upgrade) |
| **(C) Chess** | `chessField` — deterministic constraint anchor | Reality stabilizer, not learning |

Video is spec-ready (`trajectoryHint`) — ingest wire is future work.

---

## Pipeline (PATH B)

```
passive observerTrace (B)
  → attentionSediment.refresh()   [consume-only, single pass]
  → narrative.resolve()           [reads temporalSediment hints — does NOT re-rank]
  → narrativeBridge.propose()     [optional, bridge gate]
  → meaningLedger.record()        [validated co-occurrence only]
Paper.build()                     [reads all, shapes nothing]
```

---

## Hard constraints (non-negotiable)

- `influencesCausalGraph: false`
- `influencesIdentity: false`
- `influencesNarrativeSelection: false` — sediment annotates, does not pick primary focus
- `learns: false` — frequency accumulation ≠ learning
- No `observe()` during refresh (invocation asymmetry)

---

## Browser API

```javascript
// After passive session (map hovers, chess moves — real user/wire only)
window.__rhizoh.attentionSediment.refresh();
window.__rhizoh.attentionSediment.snapshot();

// Narrative picks up temporalSediment hints (read-only label)
window.__rhizoh.narrativePlane.resolve({ locale: "tr" });
```

---

## Paper vs Habitat

| Mode | Truth type |
|------|------------|
| **Paper** | Static — separationHolds, repeatable, no accumulation required |
| **Habitat** | Dynamic — internal coherence over time (stable patterns) |

**Rule:** Habitat → produces sediment. Paper → observes and freezes. Paper never shapes habitat.

---

## Related

- [`RHIZOH_MEANING_RESONANCE_LEDGER_V0.md`](RHIZOH_MEANING_RESONANCE_LEDGER_V0.md)
- [`RHIZOH_NARRATIVE_PROJECTION_ENGINE_V0.md`](RHIZOH_NARRATIVE_PROJECTION_ENGINE_V0.md)
- [`RHIZOH_EPISTEMIC_SEPARATION_PROOF_V0.md`](RHIZOH_EPISTEMIC_SEPARATION_PROOF_V0.md)
