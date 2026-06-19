# Rhizoh Domain Fabric v0

**SPECFLOW:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY` — domain mapping layer between UGL and arena adapters.

**Prerequisites:** [`RHIZOH_UGL_V1.md`](RHIZOH_UGL_V1.md) · [`RHIZOH_ARENA_ROUTER_V0.md`](RHIZOH_ARENA_ROUTER_V0.md)

**Code:** `apps/client/src/rhizoh/runtime/rhizohDomainFabricV0.js`

---

## 0. SSOT sentence

> **Rhizoh is UGL-complete, but domain-incomplete — universal language before multiple worlds.**

> **You built a universal language before building multiple worlds to speak it in.**

UGL = evrensel dil · Adapter = domain interpreter · Domain Fabric = mapping katmanı.

---

## 1. Layer stack

| Layer | Role |
|-------|------|
| **UGL** | Universal state · action · reward · event semantics |
| **Domain Fabric** | chess / go / shogi / sports schema + coverage registry |
| **Adapter** | Domain execution (init · legal · apply · reward) |
| **Arena Router** | UGL event → domain resolve → adapter select |
| **Arena** | Runtime (cluster · lobby · scheduler) |

---

## 2. Domain coverage (cold read — 2026-06-19)

| Domain | Coverage | State repr | Adapter |
|--------|----------|------------|---------|
| **Chess** | FULL ACTIVE | FEN → `8×8×13` tensor | `rhizohUglChessAdapterV0` |
| **Go** | PASSIVE STUB | enum only | none |
| **Shogi** | PASSIVE STUB | enum only | none |
| **Sports** | NOT INSTANTIATED | `sport_scoreboard.v0` (spec) | `rhizohUglSportsAdapterV0` (stub) |

Sports **live context** (`rhizohSportsLiveContextV0`) ≠ sports **game arena** — fixture feed for LLM, not UGL play.

---

## 3. Sports domain schema (v0 scaffold)

### 3.1 State — `sport_scoreboard.v0`

```json
{
  "schema": "castle.rhizoh.sport_scoreboard.v0",
  "homeScore": 1,
  "awayScore": 0,
  "period": 2,
  "clockSec": 1847,
  "possession": "home",
  "momentum01": 0.62,
  "sportId": "football"
}
```

Continuous · probabilistic · multi-agent — extends UGL beyond discrete chess physics.

### 3.2 Action model (UGL extension)

| Type | Meaning |
|------|---------|
| `event` | Stochastic match event |
| `play` | Possession play segment |
| `possession` | Possession shift |
| `score_delta` | Score change window |

### 3.3 Reward model (sports — not chess-locked)

| Signal | Meaning |
|--------|---------|
| `outcome` | Win/loss/draw (not sole signal) |
| `momentum` | Performance curve |
| `entropy` | Stochastic event density |
| `team_dynamics` | Multi-agent coordination drift |

Chess reward (`policy_diff`, engine eval, league) remains chess adapter scope.

---

## 4. Pipeline status

```text
State → Action → Reward → Graph → Drift → Learning
```

| Stage | Chess | Cross-domain |
|-------|-------|--------------|
| State encoder | ✔ FEN | ⚠ go/shogi unknown tensor |
| Action space | ✔ UCI/SAN | ❌ sports actions |
| Reward | ✔ drift + policy_diff | ❌ sports reward |
| Graph | ✔ unified chess graph | ❌ cross-game merge |
| Drift analytics | ✔ (ticket + chess) | chess-local UGL compile |

---

## 5. Roadmap (locked order)

1. **Domain Fabric v0** — schema registry + coverage (this doc)
2. **Arena Router v0** — UGL → domain → adapter selection
3. **Sports Adapter v0** — first continuous domain (football/basketball)
4. **Multi-Arena Scheduler** — chess + sports parallel pipelines

---

## 6. Changelog

| Date | Change |
|------|--------|
| 2026-06-19 | v0.0 — domain fabric scaffold · sports schema · coverage registry |
