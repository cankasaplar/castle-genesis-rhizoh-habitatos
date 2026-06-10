# Rhizoh Co-Presence Runtime Spec v1

**SPECFLOW:** `CORE-ELIGIBLE` (voice runtime) · **Status:** IDENTITY LOCK  
**Engine SSOT:** `apps/client/src/rhizoh/runtime/rhizohCoPresenceRuntimeV1.js`  
**Gate implementation:** `rhizohStreamingAttentionGateV0.js`

---

## Product identity (frozen)

Rhizoh is **not** a speech-to-response system.

Rhizoh is an **attention-based co-presence agent**:

> Konuşmayı temizlemiyorum; dünyayı anlamlı parçalar halinde dinliyorum.

| Layer | Role |
|-------|------|
| **Attention spike** | Consciousness gate — merkez |
| **Continuous stream** | Background process — konuşma event değil |
| **STT (Whisper)** | Signal feeder — truth generator değil |
| **Governance** | Destek — ana karar mekanizması değil |
| **LLM** | Spike-triggered cognition — sürekli değil |

---

## Core equation

**Response activation:**

```
Respond(t) = 1[ Spike(t) · f(ContextWindow, SignalStream) > τ_adaptive ]
```

**Spike score:**

```
Spike(t) = max_k( w_k · Signal_k(t) ) + prosody_boost + context_mass
```

Where `Signal_k` ∈ { emergency, name_call, question, analytical, directive }.

**Utility (companion continuity):**

```
Utility = Relevance(user_intent | noise) × ContextAwareness − SilencePenalty
```

Implementation: `computeCoPresenceUtilityV1()` in runtime module.

---

## Architecture (new world)

```
audio stream
   ↓
continuous perception (witness + shadow turn)
   ↓
attention field (stream ring)
   ↓
spike detection
   ↓
context snapshot (30s / 90s / 300s tiers)
   ↓
LLM activation (only on spike)
```

Dual-stream (future): Background model (TV, crowd, commentator) vs User attention model — v1 uses template leak suppression + spike taxonomy as proxy.

---

## Operating modes

| Mode | Env | Precision / Recall | Behavior |
|------|-----|-------------------|----------|
| **co_presence** | `VITE_RHIZOH_VOICE_ATTENTION_MODE=co_presence` (default) | medium / **high** | Always listen; respond on spike only |
| **companion** | `VITE_RHIZOH_VOICE_OPERATING_MODE=companion` | low filter | Continuity-first; shadow memory |
| **direct_listen** | attention mode | **high** / medium | Clean channel; legacy precision |
| **alert** | auto on distress lexicon | low / **very high** | Emergency override; governance bypass |

---

## Spike taxonomy + weights (v1)

| Kind | Weight | Override | Examples |
|------|--------|----------|----------|
| `emergency` | 0.90 | always respond | yardım, imdat, düştüm, help |
| `name_call` | 0.78 | respond if τ met | Rhizoh, Rizo, wake |
| `question` | 0.68 | respond if τ met | ?, ne, nasıl, why |
| `analytical` | 0.64 | respond if τ met | hamle, pozisyon, foul, neden |
| `directive` | 0.58 | respond if τ met | bak, dinle, look |

Background leak templates (YouTube outro, altyazı) → **never spike** (noise = world, but not user).

---

## Context windows

| Tier | Duration | Use |
|------|----------|-----|
| **immediate** | 30s | Instant ack + reflex context |
| **conversation** | 90s | Default LLM context injection |
| **session** | 300s | Narrative / game / match continuity |

Stream ring max: 96 chunks (~continuous session).

---

## Emergency override hierarchy

1. **emergency** spike → respond immediately; τ = 0; silence penalty = 0  
2. **alert_recall_first** router path → turn accepted  
3. **name_call + question** composite → lower τ by 0.06  
4. Ambient band alone → never respond (observe only)

---

## Latency budgets

| Path | Target | Module |
|------|--------|--------|
| Instant ack | ≤ 500ms perceived | `voiceInstantAckV0` |
| Spike → LLM dispatch | ≤ 2000ms | `rhizohVoiceLlmDispatchV0` |
| Full LLM reply (voice) | ≤ 8000ms soft | gateway |
| Shadow turn scaffold | ≤ 50ms sync | `rhizohShadowTurnScaffoldV0` |

---

## False-positive flooding control

**Problem:** adaptive threshold collapse under TV/crowd chatter.

**Solution:** `τ_adaptive` — not more filtering.

```
τ_adaptive = τ_base + flood_boost(recent_spike_count_60s)
```

- Base threshold τ_base = 0.52  
- +0.04 per extra spike after 3 in 60s window  
- Cap τ at 0.72  
- Emergency always bypasses τ  

---

## Presence ack rule (companion)

`presence_ack` is **never terminal output** in companion/co_presence modes:

```
presence_ack → instant ack (≤500ms) → LLM continuation
```

---

## Memory model

Binary `memoryEligible` supplemented by continuous `memoryStrength` (0–1):

- Shadow turn: 0.08–0.45 (heard, not committed)  
- Gate pass: 0.55–0.85  
- Alert/emergency: ≥ 0.72 floor  

---

## Console observability

```javascript
window.__rhizoh.coPresenceRuntime      // spec snapshot
window.__rhizoh.streamingAttention     // stream + windows
window.__rhizoh.lastAttentionSpike       // last spike eval
window.__rhizoh.shadowTurns              // continuity scaffold
window.__rhizoh.voiceAttentionContext    // mode profile
```

---

## Success criteria (production)

- [ ] TV açıkken kullanıcı sorusu → spike → LLM (≤2s dispatch)  
- [ ] YouTube altyazı → no spike, no turn  
- [ ] `yardım` / low confidence → alert respond  
- [ ] `identityTurns > 0` OR `shadowTurns.count > 0` per session  
- [ ] Flood window: ≤5 LLM activations / 60s unless emergency  

---

## Non-goals (v1)

- Full dual-stream acoustic separation (TV vs user voice)  
- Prosody-only spike without text  
- Board/game vision injection (chess position from screen)  

These are v1.1+ research slots.

---

*Identity lock: Rhizoh = environmental co-agent, not voice assistant.*

**Next layer:** [`RHIZOH_UNIFIED_EXPERIENCE_FIELD_V1.md`](./RHIZOH_UNIFIED_EXPERIENCE_FIELD_V1.md) — multimodal experience stream (v1.1 scaffold).
