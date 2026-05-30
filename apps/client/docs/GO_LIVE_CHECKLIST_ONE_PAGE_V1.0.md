# Go-Live Checklist — One Page v1.0

**Tag:** `CORE-ELIGIBLE` · **Production launch gate (summary)**  
**Full legal + activation SSOT remains:** [`docs/RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md`](../../../docs/RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md) · [`docs/RHIZOH_GO_LIVE_ACTIVATION_PROTOCOL_V1.md`](../../../docs/RHIZOH_GO_LIVE_ACTIVATION_PROTOCOL_V1.md)

| Single-file refs | |
|------------------|--|
| Deploy | [`DEPLOY_MATRIX_V1.0.md`](./DEPLOY_MATRIX_V1.0.md) |
| Edges | [`EDGE_CASE_SURVIVAL_KIT_V1.0.md`](./EDGE_CASE_SURVIVAL_KIT_V1.0.md) |

---

## Before ship (must)

- [ ] **READY / HOLD** logged — copy [`activation_decision_LOG.template.json`](../../../docs/ops/activation_decision_LOG.template.json) → `docs/exports/ops/activation_decision_YYYY-MM-DD.json` (see activation checklist)
- [ ] **Deploy matrix** row **E2** matches actual Hosting env (no drift vs [`DEPLOY_MATRIX_V1.0.md`](./DEPLOY_MATRIX_V1.0.md))
- [ ] `VITE_DEBUG=0` on production host
- [ ] `VITE_CASTLE_AUTHORITY_PROFILE=production` on production host
- [ ] `VITE_GATEWAY_HTTP` / `VITE_LIVE_GATEWAY_BASE` / `VITE_GATEWAY_WS` — **one origin**; token matches gateway
- [ ] `VITE_RHIZOH_PHASE1_SIGNAL` **not** `1` unless signed Phase-1 ops procedure completed
- [ ] DNS + TLS smoke — activation checklist A1–A2
- [ ] Firestore rules reviewed — activation A4
- [ ] `npm run activation:readiness-check` **green** + export archived
- [ ] `npm run ci:enforce-client` **green** (or equivalent CI green on merge commit)
- [ ] `npm run spiral:validate-rhizoh-boundary` **green**

## After deploy (smoke)

- [ ] Open prod URL: canonical entry loads; **no** raw `wi_` in first-time HEL surface
- [ ] Observe → `/academy/observe` loads (hub)
- [ ] Hard refresh: continuity behaves per [`EDGE_CASE_SURVIVAL_KIT_V1.0.md`](./EDGE_CASE_SURVIVAL_KIT_V1.0.md) if storage cleared

## Rollback trigger (any → execute)

- [ ] User-visible seal / authority regression → [`DEPLOY_MATRIX_V1.0.md`](./DEPLOY_MATRIX_V1.0.md) §3 Rollback

## Commands (copy-paste)

```bash
npm run activation:readiness-check
npm run stabilization:validate-client-boundaries-quick
npm run spiral:validate-rhizoh-boundary
npm run build -w apps/client
```

---

## NO-GO (one line each)

| Condition | Action |
|-----------|--------|
| AUTO fail | Fix or HOLD |
| MANUAL unchecked | HOLD |
| DNS live treated as activation | **HOLD** |
| READY unsigned | **HOLD** |

---

*v1.0 — one-page launch summary; not a replacement for activation v1.0 SSOT.*
