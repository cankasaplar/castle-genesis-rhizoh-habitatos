# Rhizoh Go-Live Cohort Simulation v1.0

**Status:** ACTIVE · interpretation-only  
**Engine:** `apps/client/src/rhizoh/ingress/goLiveCohortSimulationV0.js`

---

## 1. Purpose

Plan closed beta capacity and stress-class balance **before** opening `rhizoh.com` — not a mailing list generator.

---

## 2. Run

```bash
npm run legal:go-live-cohort-sim
# or
node scripts/run-go-live-cohort-simulation.mjs --nodes 50 --seed 42
```

**Outputs** (gitignored optional):

- `docs/exports/ops/go_live_cohort_simulation_v1.0.json`
- `docs/exports/ops/go_live_cohort_simulation_v1.0_summary.md`

---

## 3. Decision thresholds (default)

| Decision | Conditions |
|----------|------------|
| **PROCEED** | `admitRate ≥ 0.55`, `rejectRate ≤ 0.08`, ≥2 stress classes represented, no class >65% of cohort |
| **HOLD** | Between proceed and abort bands, or spread/dominance soft fail |
| **ABORT** | `rejectRate > 0.12` OR `admitRate < 0.40` |

Override: `--min-admit 0.5` etc. (see script `--help`).

---

## 4. Legal freeze

While [`LEGAL_FREEZE_SPEC_V1.0.md`](LEGAL_FREEZE_SPEC_V1.0.md) is active, simulation may run; **open signup** may not until decision = PROCEED **and** legal thaw.

---

## Related

- [`RHIZOH_CLOSED_USER_ADMISSION_V0.1.md`](RHIZOH_CLOSED_USER_ADMISSION_V0.1.md)
- [`RHIZOH_GO_LIVE_ACTIVATION_PROTOCOL_V1.md`](RHIZOH_GO_LIVE_ACTIVATION_PROTOCOL_V1.md)
