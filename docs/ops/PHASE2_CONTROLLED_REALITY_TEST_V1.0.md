# Phase 2 — Controlled Reality Test v1.0

**Status:** ACTIVE (ops)  
**Tag:** `OPERATIONS` — runbook, not application code  
**What this is:** **Live controlled reality test** on real `rhizoh.com` UI — not public launch, not text sandbox, not fake UI.

**Legal-lite prerequisite:** [`PHASE0_MEMORY_ERASURE_USER_FACING_V0.1.md`](../legal/PHASE0_MEMORY_ERASURE_USER_FACING_V0.1.md)  
**Experience prerequisite (founder):** [`PHASE_A_LIVING_SHELL_PASS_V1.0.md`](./PHASE_A_LIVING_SHELL_PASS_V1.0.md) — A2–A4 ≥ 4 before MODE 2 invites  
**Deploy flags SSOT:** [`DEPLOY_MATRIX_V1.0.md`](../../apps/client/docs/DEPLOY_MATRIX_V1.0.md) §6  
**Activation gate (full):** [`RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md`](../RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md)

---

## 1. Definition

**Controlled Reality Test** = five layers working together on production shell:

| # | Layer | Pass criterion |
|---|--------|----------------|
| 1 | **Real UI** | `https://rhizoh.com` (and `www`) loads ingress → observe → Castle |
| 2 | **Real auth** | Google sign-in + cohort allowlist or server gate |
| 3 | **Castle entry** | Enter Castle flow completes without quarantine (gate off for cohort) |
| 4 | **Continuity** | Return after 10–15 min shows strip / visit echo change |
| 5 | **Mutation feedback** | User action produces **felt** UX echo, not console-only log |

**Explicitly off:** Studio, SpiralMMO, robotics, voice agent (Phase 3), Phase1 data-plane signal.

**Positioning (public):** *“Closed technical and experience test environment”* — not *“Rhizoh is now live for everyone.”*

---

## 2. Launch modes (MODE 1 / 2 / 3)

| Mode | Who | Host | Debug | Modules | Legal |
|------|-----|------|-------|---------|-------|
| **MODE 1 — DEV OBSERVE** | Founder only | Local **or** dedicated staging subdomain — **avoid** `VITE_DEBUG=1` on shared prod if others may hit URL | `VITE_DEBUG=1` or granular `VITE_RHIZOH_*_DEBUG=1` | All core ON; Spiral/voice OFF | Internal |
| **MODE 2 — COHORT REAL** | 1–10 invitees | `rhizoh.com` | **`VITE_DEBUG=0`** | Castle + continuity ON; Studio/Spiral OFF | Phase 0-lite + invite consent |
| **MODE 3 — EXPERIMENTAL** | Founder only | **Separate** staging host (not cohort prod) | Per staging policy | Voice/agent when flags exist | Counsel before any cohort exposure |

**Rule:** MODE 2 is the only mode that uses **production hostname** for external humans.

---

## 3. Flag matrix — E2-cohort (MODE 2)

Copy from [`.env.production.example`](../../apps/client/.env.production.example); cohort row:

| Flag | MODE 2 value | Notes |
|------|--------------|-------|
| `VITE_DEBUG` | `0` | No debug umbrella on cohort surface |
| `VITE_CASTLE_AUTHORITY_PROFILE` | `production` | |
| `VITE_ONTOLOGICAL_BOOT_GATE` | `0` | Cold start / quarantine off |
| `VITE_RHIZOH_PHASE1_SIGNAL` | `0` | Data-plane inert |
| `VITE_SPIRAL_MMO_PERCEPTION_BRIDGE` | unset / `0` | |
| `VITE_SPIRAL_MMO_AGREEMENT_LAYER` | unset / `0` | |
| `VITE_RHIZOH_LEGAL_PREAMBLE` | `1` | Before first external user |
| `VITE_RHIZOH_INVITE_ONLY_GOOGLE` | `1` | Google-only shell |
| `VITE_RHIZOH_COHORT_EMAIL_ALLOWLIST` | founder + invite emails | Or use server gate |
| `VITE_RHIZOH_COHORT_SERVER_GATE` | `1` recommended | Requires `cohortGateV0` deploy |
| `VITE_RHIZOH_COHORT_OBSERVATION_LOG` | `1` optional | Ops ring only |
| `VITE_WAL_GEOMETRY_INGRESS` | off | |
| `VITE_SUBSTRATE_CONTINUITY_IDB` | off unless testing seal path | IDB `1` can force ontological paths — keep off for cohort |
| `VITE_WORLD_LAYER` | off / false | Genesis-first prod |

**MODE 1 delta:** `VITE_DEBUG=1` on non-prod host; allowlist = founder email only.

---

## 4. Heartbeat test (founder — MODE 1)

Run before inviting anyone (MODE 2).

### 4.1 Session A — first visit

1. Incognito or clean profile → `https://rhizoh.com`
2. Legal preamble ack (if enabled)
3. Google login
4. Observe hub → **Enter Castle**
5. Note: continuity strip text, any mutation echo after one intentional interaction (move, select, navigate)
6. Optional: `window.__CASTLE_COHORT_OBSERVATION_LOG__()` — **secondary** evidence only

### 4.2 Session B — continuity (10–15 min later)

1. Same browser profile (not incognito)
2. Return to site → login if needed
3. **Pass if:** strip or welcome echo reflects prior visit; Castle re-entry feels continuous
4. **Fail if:** cold amnesia with no explanation, auth loop, or quarantine shell

### 4.3 Hard refresh edge

1. Hard refresh on Castle route
2. Document behavior per [`EDGE_CASE_SURVIVAL_KIT_V1.0.md`](../../apps/client/docs/EDGE_CASE_SURVIVAL_KIT_V1.0.md)
3. Not a fail unless user trapped or misled

Record results in [`docs/academic/SESSION_LOG.md`](../academic/SESSION_LOG.md) (date, pass/fail, notes).

---

## 5. Cohort rollout (MODE 2)

### 5.1 Pre-flight

```bash
npm run activation:readiness-check
npm run spiral:validate-rhizoh-boundary
npm run build -w apps/client
```

- [ ] Firebase Auth authorized domains: `rhizoh.com`, `www.rhizoh.com`
- [ ] Google OAuth JS origins: `https://rhizoh.com`, `https://www.rhizoh.com`
- [ ] Cohort allowlist or server gate configured
- [ ] Phase 0 legal-lite checklist (memory/erasure doc §9)
- [ ] Invite email sent (consent template in Phase 0 doc §6)

### 5.2 Deploy

```bash
# Local example (PowerShell)
$env:NODE_OPTIONS="--max-old-space-size=8192"
npx firebase-tools deploy --only "hosting,firestore:rules,storage" --project castle-genesis --non-interactive
```

If server gate: include Functions in deploy (`cohortGateV0`).

### 5.3 During cohort

- Watch cohort observation ring / server gate logs
- **NO** enabling `VITE_RHIZOH_PHASE1_SIGNAL` without signed READY
- **NO** Spiral or voice flags on prod host
- Collect **qualitative** notes: “felt alive?” not only log lines

### 5.4 Exit / erasure

On withdraw or test end: follow [`PHASE0_MEMORY_ERASURE_USER_FACING_V0.1.md`](../legal/PHASE0_MEMORY_ERASURE_USER_FACING_V0.1.md) §4.2.

---

## 6. What we measure (product, not architecture)

| Signal | Good | Bad |
|--------|------|-----|
| Castle open | Enters flight / living world shell | Blocked, empty, or fake placeholder |
| Continuity | Strip/echo updates on return | Total reset without UX explanation |
| Mutation | Visible/heard feedback | Log-only, no UX |
| Auth | Stable session | Random sign-out, allowlist leak |
| Trust | User understands “test not launch” | User thinks public product |

---

## 7. Phase boundaries

```
Phase 0 (legal-lite) ──► Phase 2 (this doc) ──► Phase 3 (voice/agent, staging)
                              │
                              └── NOT Phase 4 Spiral on prod host
```

| Phase | Entry criterion |
|-------|-----------------|
| **Phase 2 cohort** | Phase 0 §9 checklist + MODE 1 heartbeat pass |
| **Phase 3 experimental** | Phase 2 stable 1–2 weeks; separate host |
| **Phase 4 SpiralMMO** | Separate namespace; `spiral:validate-rhizoh-boundary` green; no shared prod cohort |

---

## 8. NO-GO (immediate HOLD)

| Condition | Action |
|-----------|--------|
| Unsigned READY but Phase1 signal requested | HOLD deploy |
| Ontological quarantine on cohort without ops intent | Set `VITE_ONTOLOGICAL_BOOT_GATE=0`, redeploy |
| `VITE_DEBUG=1` on rhizoh.com for external users | Rebuild MODE 2 flags |
| Public “launch” marketing | Stop — reposition as closed test |
| Erasure request with no runbook owner | Pause new invites |

---

## 9. Related commands & files

| Item | Path |
|------|------|
| Cohort allowlist | `apps/client/src/rhizoh/ingress/cohortEmailAllowlistV0.js` |
| Auth hook | `apps/client/src/firebase/useCastleAuth.js` |
| Living world entry | `apps/client/src/rhizoh/experience/rhizohLivingWorldEntryOrchestratorV0.js` |
| Continuity / mutation | `livingWorldPersistenceUxV0.js`, `worldMutationFeedbackV0.js` |
| Ontological gate | `bootstrapOntologicalGateV0.js` |
| Go-live one page | `apps/client/docs/GO_LIVE_CHECKLIST_ONE_PAGE_V1.0.md` |

---

*v1.0 — Controlled Reality Test ops SSOT; bump when E2-cohort defaults change.*
