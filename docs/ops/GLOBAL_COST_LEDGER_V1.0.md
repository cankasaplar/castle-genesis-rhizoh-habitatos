# Global Cost Ledger (GCL) v1.0 — Fail-Closed Financial Truth

**Status:** IMPLEMENTED · **Schema:** `rhizoh.global_cost_ledger.v0`  
**Code:** `globalCostLedgerV0.js` · **Audit:** `globalCostAuditTrailV0.js`

---

## Mühür cümlesi (execution contract)

> **GCL artık optional observability layer değil; execution için fail-closed financial truth layer olmalıdır.**

`GCL_EXECUTION_CONTRACT_V0` — kodda donmuş.

---

## A1 — Redis fail-closed

| Env | Davranış |
|-----|----------|
| `NODE_ENV=production` | `requireRedis=true` (varsayılan) |
| `CASTLE_GCL_REQUIRE_REDIS=1` | Redis yok → **`cost_ledger_unavailable`** (turn durur) |
| `CASTLE_GCL_ALLOW_MEMORY_FALLBACK=1` | Yalnızca dev/test |
| `CASTLE_GCL_ALLOW_MEMORY_FALLBACK=0` | Memory fallback **yasak** |

Production’da sessiz memory fallback **yok**.

---

## A2 — Audit trail (accounting stream)

Append-only olaylar (`castle:gcl:v1:audit:day:YYYY-MM-DD` Redis LIST):

- `assess_pre` / `assess_deny`
- `record_post` / `record_fail`
- `drift_detected` / `drift_enforced`
- `ledger_unavailable`
- `provider_reconcile`

`GET /rhizoh/ops/hardening/status` → `gcl.snapshot.auditRecent`

---

## A3 — Drift enforcement

| Env | Davranış |
|-----|----------|
| `CASTLE_GCL_ENFORCE_DRIFT=1` (prod default) | `estimate` vs `providerUsd` sapması → **`cost_ledger_drift_enforced`** |
| `CASTLE_GCL_DRIFT_WARN_RATIO` | Uyarı eşiği (default 0.25) |

Sessiz sapma yok: audit + visible failure.

---

## Production checklist

```bash
REDIS_URL=redis://...
CASTLE_GCL_REQUIRE_REDIS=1
CASTLE_GCL_ALLOW_MEMORY_FALLBACK=0
CASTLE_LLM_DAILY_SPEND_LIMIT_USD=15
CASTLE_GCL_ENFORCE_DRIFT=1
```

---

## Layer boundary

| Katman | Rol |
|--------|-----|
| GCL | Financial truth + enforcement |
| L3 strategy | Proposals only (`feedsExecution: false`) |
| UX economy | Davranış simülasyonu — GCL’den **bağımsız** |

---

## Next: B phase (capacity)

[CAPACITY_10K_100K_REALITY_CURVE_V1.0.md](CAPACITY_10K_100K_REALITY_CURVE_V1.0.md) — throughput, cost spikes, Redis, rollout stability.

---

*GCL v1.0 — fail-closed cluster ledger; audit stream; drift visible.*
