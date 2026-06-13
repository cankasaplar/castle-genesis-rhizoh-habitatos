# Rhizoh Sprint Chain — Deploy Runbook v1.0

**SPECFLOW:** ops · Sprint 32–40 integration  
**Merge target:** `main` via PR **#43** (`cursor/sprint-40-os-stabil-release-3b5a`)

## 1. Merge (GitHub)

1. PR **#43** base → **`main`** (Edit → change base branch if still `sprint-39`)
2. Mark **Ready for review** (undraft)
3. **Merge** PR #43 → `main` (merge commit or squash — prefer **merge commit** to preserve sprint history)
4. Close **#32–#42** as superseded (do not merge separately)

Branch is already rebased on `main` (16 commits ahead).

## 2. What to deploy (single wave)

| Surface | Deploy? | Why |
|---------|---------|-----|
| **Firebase Hosting** | **YES** | All client sprint work (World Space, drawers, cluster, stabil layer) |
| **Render gateway** | **YES** | Gateway diff: LLM continuation, cloud sync vault, castle network relay |
| **Firebase Functions** | **Conditional** | No code diff vs `main` in this chain — deploy only if env/allowlist changed or never deployed |

### Functions — when required

Deploy functions if **any** of:

- `functions/` code changed (this chain: **no change**)
- `COHORT_EMAIL_ALLOWLIST` / cohort mail env updated
- `gatewayProxyV0` proxy config changed
- First-time production functions setup

```bash
cd functions && npm install
firebase deploy --only functions
```

If cohort ingress unchanged: **hosting + Render is enough** for this sprint chain.

### Hosting

```bash
# From repo root (uses build:rhizoh-production predeploy)
firebase deploy --only hosting
```

Or CI workflow if configured.

### Render

After `main` merge — trigger deploy on `castle-genesis-gateway` (branch: `main`).

Verify: `GET https://<render-host>/health/live`

## 3. Pre-deploy gates (run on `main` after merge)

```bash
npm install
cd apps/client && npm test
cd apps/client && npm run build   # or npm run build:rhizoh-production on Windows
npm run ops:production-deploy-gates-v0
```

## 4. Production env checklist

### Client build (Firebase / Vite)

| Var | Value |
|-----|-------|
| `VITE_DEBUG` | `0` |
| `VITE_GATEWAY_HTTP` | `https://<render-gateway-host>` |
| `VITE_GATEWAY_TOKEN` | same as `CASTLE_GATEWAY_TOKEN` |
| `VITE_RHIZOH_KERNEL_TRACE_DEBUG` | unset / `0` |

### Render gateway

See `render.yaml` — required secrets:

- `CASTLE_GATEWAY_TOKEN`
- `OPENAI_API_KEY` (default LLM)
- `FIREBASE_*` or `CASTLE_JWT_SECRET` (auth)
- Optional: `FOOTBALL_DATA_ORG_TOKEN`, `NEWSDATA_API_KEY`, voice keys

### Firebase Functions (if deployed)

- `COHORT_EMAIL_ALLOWLIST` (cohort gate)
- SMTP vars for feedback mail (if using mail functions)

## 5. Post-deploy smoke

1. `https://rhizoh.com/world/space` — map boots, drawer opens in-place
2. Studio drawer — export panel loads
3. Medusa — local camera channel only
4. `window.__RHIZOH_CONTEXT_INTENT__` — **undefined** in prod (invisible trace)
5. Gateway health — `/health/deps` returns ok
6. Tower workspace — save API key via `/llm/connections`

## 6. Workspace + API map (Render)

Base: `VITE_GATEWAY_HTTP` → `https://<gateway-host>`

| Endpoint | Method | Workspace use |
|----------|--------|----------------|
| `/llm/connections` | GET | List tower LLM keys |
| `/llm/connections` | POST | Save tower key (`label: {towerId}_workspace`) |
| `/llm/connections/:id` | PATCH / DELETE | Manage keys |
| `/llm/connections/test` | POST | Test provider key |
| `/rhizoh/llm` | POST | Rhizoh chat (server keys or user connection) |
| `/rhizoh/sync/vault` | GET / POST | Cloud sync (chess book, learning shards) |
| `/rhizoh/network/presence` | GET | C2C presence (`?room=`) |
| `/rhizoh/live/world-feed` | GET | Live map feed |
| `/health/live` | GET | Render health check |

Firebase same-origin proxy (optional): `/api/gatewayProxy/**` → `gatewayProxyV0` function.

## 7. Next sprint (tower workspaces)

Per `SESSION_LOG`: wire each tower pin → dedicated workspace (not generic placeholder). API strip exists (`RhizohTowerLlmConnectionsStripV0`); only `gemini_tower` has full workspace UI today.
