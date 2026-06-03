# Rhizoh Identity Consistency Layer (ICL) v0

**Status:** ACTIVE  
**SPECFLOW:** `RESEARCH-ONLY`  
**Modül:** `rhizohIdentityConsistencyLayerV0.js`

---

## Rol

**Functional correctness → identity continuity.**  
ICL answers: *"Is it still the same world?"* — not whether the engine runs, but whether live, WAL, and replay states are **equivalent**.

```text
GENERATION → INHABITANCE → ORGANISM → MEMORY → IDENTITY → CONSISTENCY (ICL)
```

---

## Drift classification

| Class | Meaning |
|--------|---------|
| `none` | Same world — live, WAL, replay aligned |
| `soft` | Projection-only mismatch (pet seq, breathe, minor) |
| `structural` | Coherence / episode / experiential_now drift |
| `identity_break` | Chain hash or identity graph break |

---

## API

- `snapshotLiveWorldForConsistencyV0()` — SSOT slice for diff
- `diffLiveSnapshotVsWalEntryV0(live, entry)`
- `verifyWalChainConsistencyV0(entries)`
- `classifyWorldDriftV0(ctx)`
- `runWorldIdentityConsistencyHarnessV0({ skipReplay: true })` — sync, post-replay attach
- `runWorldIdentityConsistencyHarnessAsyncV0()` — full live → replay → restore round-trip

Replay auto-runs ICL (`skipReplay: true` path) unless `runIcl: false`.

---

## Equivalence proof

```javascript
report.equivalence = {
  same_world,
  chain_ok,
  identity_ok,
  live_matches_wal,
  replay_matches_wal,
  live_replay_equivalent
}
```

---

## SSOT

```javascript
window.__rhizoh.worldIdentityConsistency
window.__rhizoh.iclLastHarness
window.__rhizoh.replayedWorldState.icl_report
```

Event: `rhizoh:identity-consistency-v0`

---

## CI / ops

```bash
npm run ops:world-identity-consistency-v0
```

---

## Stack (kilit)

```text
Engine produces world
SCR synchronizes world
Pet inhabits world
Studio organizes world
WAL remembers world
ICL ensures it is still the same world
```

Bkz. [`RHIZOH_WORLD_WAL_PERSISTENCE_B2_V0.md`](RHIZOH_WORLD_WAL_PERSISTENCE_B2_V0.md) · [`RHIZOH_WORLD_REPLAY_V0.md`](RHIZOH_WORLD_REPLAY_V0.md)

---

## Sıra (post-ICL)

1. ~~ICL v0~~ ✔  
2. Organism stabilization (loop determinism, pet motion, SCR timing)  
3. Studio polish
