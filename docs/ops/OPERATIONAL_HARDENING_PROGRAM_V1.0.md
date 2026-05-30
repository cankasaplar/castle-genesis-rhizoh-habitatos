# Operational Hardening Program v1.0

**Status:** ACTIVE (counsel paralel)  
**Mental model:** Launch beklenmiyor — **operational hardening devam ediyor.**

Counsel OK = yasal mühür (bekleniyor).  
Bu program = **hukuk dışı** omurga: containment, observability, survivability.

---

## Paralel kanallar

| Kanal | Durum | Sahip |
|-------|--------|--------|
| **Counsel** | PRIMARY PDF gönderildi / onay bekleniyor | Hukuk |
| **Ops hardening** | Gateway v0 modülleri | Mühendislik |
| **Controlled exposure** | Static deploy + signal OFF | Ops |

**Yapılmayacak (counsel öncesi risk):** public claims değişikliği, retention politikası genişletme, international availability iddiası, autonomous agent dili.

---

## 1. Agent containment (gateway)

**Modül:** `apps/gateway/src/ops/agentContainmentV0.js`  
**Wire:** `rhizohGatewayTurn.js` — her `/rhizoh/llm` turu

| Mekanizma | Env |
|-----------|-----|
| Max iteration / session | `CASTLE_AGENT_MAX_ITERATIONS` (default 12) |
| Turn timeout | `CASTLE_AGENT_TURN_TIMEOUT_MS` (default 120000) |
| Session token ceiling | `CASTLE_AGENT_SESSION_TOKEN_CEILING` (default 32000) |
| Recursive tool lock | `CASTLE_AGENT_RECURSIVE_TOOL_DEPTH` (default 3) |
| Emergency disable | `CASTLE_AGENT_EMERGENCY_DISABLE=1` |

---

## 2. Observability

**Modül:** `apps/gateway/src/ops/agentObservabilityV0.js`

- Agent state snapshots (ring buffer)
- Context fingerprint (ham mesaj yok)
- Admin: `GET /rhizoh/ops/agent-snapshots` + `X-Castle-Moderation-Key`
- Opsiyonel audit chain: `CASTLE_AGENT_SNAPSHOT_AUDIT_CHAIN=1`

---

## 3. Cost containment + Global Cost Ledger (GCL)

**Modül:** `costContainmentV0.js` (sync facade) · **`globalCostLedgerV0.js`** (financial truth)  
**L3 strategy (proposals only):** `economicStrategyEngineL3V0.js` · See [`GLOBAL_COST_LEDGER_V1.0.md`](GLOBAL_COST_LEDGER_V1.0.md)

| Mekanizma | Env |
|-----------|-----|
| Daily token budget | `CASTLE_LLM_DAILY_TOKEN_BUDGET` (default 200k) |
| **Global USD cap (enforced)** | `CASTLE_LLM_DAILY_SPEND_LIMIT_USD` |
| GCL backend | `CASTLE_GCL_BACKEND=redis` + `REDIS_URL` (multi-instance) |
| USD estimate rate | `CASTLE_GCL_USD_PER_1M_TOKENS` (default 0.35) |
| Soft downgrade | `CASTLE_LLM_SOFT_BUDGET_RATIO` → `FAST_DIALOGUE` |
| Downgrade model | `CASTLE_LLM_DOWNGRADE_MODEL` |
| Queue fallback flag | `CASTLE_LLM_QUEUE_FALLBACK=1` |

`GET /rhizoh/ops/hardening/status` → `gcl.snapshot`, `economicStrategyL3` (feedsExecution: false).

---

## 4. Moderation MVP

**Modül:** `apps/gateway/src/ops/moderationMvpV0.js`

| Endpoint | Method |
|----------|--------|
| `/rhizoh/ops/abuse-report` | POST (auth optional) |
| `/rhizoh/ops/moderation/queue` | GET (admin key) |
| `/rhizoh/ops/moderation/soft-block` | POST (admin) |
| `/rhizoh/ops/moderation/soft-unblock` | POST (admin) |

Admin: `CASTLE_MODERATION_ADMIN_KEY` → header `X-Castle-Moderation-Key`

Prompt abuse → otomatik report + 403.

---

## 5. Phased rollout

**Modül:** `apps/gateway/src/ops/phasedRolloutV0.js`

`CASTLE_PHASED_ROLLOUT_TIER` = `off` | `50` | `200` | `1000` | `5000`  
Eşzamanlı gateway LLM tur sayısını sınırlar (viral test fazları).

---

## 6. Status endpoint

`GET /rhizoh/ops/hardening/status` — containment + cost config + phased stats (auth varsa principal cost).

---

## Synthetic Crisis Week (counsel paralel)

**Containment before activation** — Cognitive Infrastructure Stress Testing.

```bash
npm run ops:synthetic-crisis-phase1   # Control — agent kırılıyor mu?
npm run ops:synthetic-crisis-phase2   # Forensics — anlayabiliyor muyuz? (Phase 3 gate)
```

Bkz. [`SYNTHETIC_CRISIS_WEEK_V1.0.md`](SYNTHETIC_CRISIS_WEEK_V1.0.md) · Phase 1 · Phase 2: [`SYNTHETIC_CRISIS_PHASE2_OBSERVABILITY_V1.0.md`](SYNTHETIC_CRISIS_PHASE2_OBSERVABILITY_V1.0.md)

---

## Sıra (onaylı)

1. Counsel written OK (paralel) + **Phase 1 harness green**  
2. Staging: hardening status + abuse-report smoke  
3. `CASTLE_PHASED_ROLLOUT_TIER=50` staging  
4. Cookie / ingress smoke  
5. READY/HOLD  
6. En son signal thaw  

---

## İlgili

- [`GLOBAL_LAUNCH_RISK_AUDIT_MATRIX_V1.0.md`](GLOBAL_LAUNCH_RISK_AUDIT_MATRIX_V1.0.md)
- [`CONTROLLED_EXPOSURE_FRAMEWORK_V1.0.md`](CONTROLLED_EXPOSURE_FRAMEWORK_V1.0.md)
- [`COUNSEL_OK_DEFINITION_V1.0.md`](../legal/COUNSEL_OK_DEFINITION_V1.0.md)

---

*Operational hardening v1.0 — May 2026.*
