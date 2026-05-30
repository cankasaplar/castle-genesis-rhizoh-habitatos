# Rhizoh TLA+ — Phase B minimal core

**Route (locked):** `RhizohCore.tla` → TLC → violation traces → **then** O1 thaw. No new formal metaphysics layers.

| Artifact | Role |
|----------|------|
| `RhizohCore.tla` | Phase 0.5: `DataPlaneActive` implicit FALSE, T1 = `CoreUnchanged` |
| `RhizohCore.cfg` | Finite `Packets`, invariants, `tick` bound |
| Sketch | [`docs/RHIZOH_TLA_EXECUTION_CORE_SKETCH_V1.0.md`](../../docs/RHIZOH_TLA_EXECUTION_CORE_SKETCH_V1.0.md) |

## Run TLC

Install [TLA+ tools](https://github.com/tlaplus/tlaplus) (`tlc` on PATH), then:

```bash
cd spec/tla
tlc -config RhizohCore.cfg RhizohCore.tla
```

Expected: **no invariant violation** on Phase 0.5 instance.

## What this does not claim

- Machine proof of production deployment
- Full adversary / OOM / gateway model
- Phase 1 O1 witness module (separate extension after B is green)

## Next (Phase C)

1. Save TLC stdout / error trace to `docs/exports/ops/tlc_rhizoh_core_v1.0.txt`
2. Align `npm run ops:o1-violation-harness` rows with invariant names
3. Phase 1: `RhizohObs.tla` — `AppendObs` only; keep `CoreUnchanged`
