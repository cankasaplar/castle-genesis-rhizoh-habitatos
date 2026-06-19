# Rhizoh Sports Adapter v0

**SPECFLOW:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY` — event-dense stochastic causal space.

**Prerequisites:** [`RHIZOH_DOMAIN_FABRIC_V0.md`](RHIZOH_DOMAIN_FABRIC_V0.md) · [`RHIZOH_COGNITIVE_UX_LAYER_V1.md`](RHIZOH_COGNITIVE_UX_LAYER_V1.md) · [`RHIZOH_UGL_V1.md`](RHIZOH_UGL_V1.md)

---

## 0. SSOT sentence

> **Sports is not a new feature — it is the stress test that proves Rhizoh is a multi-topology epistemic runtime, not a single-domain engine.**

Chess = closed · deterministic · low entropy  
Sports = open · multi-agent · probabilistic · external noise

---

## 1. Architectural decision: event-dense (required)

| Model | Verdict |
|-------|---------|
| **A) Event stream** | ✔ Required — `match_event` · `player_action` · `momentum_shift` · `score_delta` |
| **B) Full snapshot** | ❌ Rejected — drift bloat · causal graph inflation · tombstone complexity |

---

## 2. Components

| Module | Role |
|--------|------|
| `sportsCausalSpaceV0.js` | `sports.causal.space` registry + per-match event ring |
| `sportsEventAdapterV0.js` | Normalize → UGL action → drift reasons → ingest |
| `sportsDriftMapperV0.js` | Signal → reason category (reuses drift engine) |
| `rhizohUglSportsAdapterV0.js` | UGL adapter · `EVENT_ACTIVE` coverage |

### 2.1 Drift signal mapping

| Signal | Category |
|--------|----------|
| score swing | SC |
| momentum shift | REC |
| fatigue | QUOTA |
| performance spike | **ENTROPY_DRIFT** (new) |

Chess drift = structure violation · Sports drift = stochastic anomaly

---

## 3. Causal space multiplexing

```text
chess.causal.space   → deterministic_field
sports.causal.space  → stochastic_field
```

**CAL extension:** space-level traversal

```javascript
window.__rhizoh.traverseSpace("sports.causal.space", matchId)
```

Node traversal → space traversal: user moves between **reality types**, not just data nodes.

---

## 4. Domain coverage

| Domain | Coverage | Causal space |
|--------|----------|--------------|
| Chess | `full_active` | `chess.causal.space` |
| Sports | `event_active` | `sports.causal.space` |

`event_active` = event stream + drift + UGL compile · no deterministic apply engine

---

## 5. CUX impact

Multi-space viewport:

- **deterministic field** (chess)
- **stochastic field** (sports)
- **hybrid drift overlap zone**

---

## 6. DevTools

```javascript
window.__rhizoh.ingestSportsEvent({
  eventType: "score_delta",
  matchId: "demo_match",
  delta: 2,
  teamA: "home",
  teamB: "away"
})
window.__rhizoh.traverseSpace("sports.causal.space", "demo_match")
```

---

## 7. What Sports tests

1. Drift engine robustness (noise vs signal)
2. REC correctness under stochastic data
3. Admission stability under uncertainty (future harness)
4. CUX validity across causal spaces

---

## 8. Changelog

| Date | Change |
|------|--------|
| 2026-06-19 | v0.0 — event-dense adapter · ENTROPY_DRIFT · CAL space traversal |
