# Rhizoh Experience Fabric v1

**SPECFLOW:** `CORE-ELIGIBLE` (fabric orchestrator) · **Status:** IDENTITY LOCK v1.1  
**Parent stack:** Co-Presence Runtime v1 → Unified Experience Field → **Experience Fabric** → [**Castle Attention Stack v1**](RHIZOH_CASTLE_ATTENTION_STACK_V1.md)  
**Engine SSOT:** `apps/client/src/rhizoh/runtime/rhizohExperienceFabricV1.js`

---

## Product definition

Rhizoh is not a chatbot listening to speech.

Rhizoh is a **living context interpreter** inside an **Experience Fabric**:

> Input = lived world snapshot, not text/speech alone.

---

## Four layers

```
┌─────────────────────────────────────┐
│ 1. Source Layer                     │
│    mic · youtube · media · image ·  │
│    archive · system_audio · action    │
└──────────────┬──────────────────────┘
               ↓ normalize
┌─────────────────────────────────────┐
│ 2. Unified Event Stream             │
│    Event { source, signal, ts,      │
│            semantic_hint, salience }│
└──────────────┬──────────────────────┘
               ↓ weight
┌─────────────────────────────────────┐
│ 3. Co-Presence Attention Field      │
│    no "audio" center — field mass   │
└──────────────┬──────────────────────┘
               ↓ spike
┌─────────────────────────────────────┐
│ 4. Spike Engine (single brain)      │
│    intent · anchor · respond gate   │
└─────────────────────────────────────┘
```

---

## Unified Event schema

```typescript
Event {
  id: string
  source: "mic" | "youtube" | "media" | "image" | "archive" | ...
  signal: { raw, preview?, mediaPositionMs?, confidence? }
  timestamp: number
  semantic_hint: string | null      // lightweight tag, not full embedding (v1)
  salience_hint: number             // 0..1 source-weight prior
}
```

v1.1+: full `semantic_embedding` vector slot (null in v1 scaffold).

---

## Meaning model

```
Meaning(t) = Σ_sources Attention(s_i, t) · Relevance(s_i, user_intent)
```

Implementation: `computeAttentionFieldV1()` + `runSpikeEngineV1()`.

---

## Spike Engine intents

| Intent | Triggers | Action |
|--------|----------|--------|
| `memory_write` | "not al", "hatırla", "bookmark" | temporal anchor graph write |
| `memory_retrieval` | "bu neydi?", "şu sahne neydi?" | anchor lookup + LLM |
| `analytical` | pozisyon, hamle, foul, neden | reasoning spike |
| `scene_query` | "burada ne oldu?" | timestamp rewind + context extract |
| `note_take` | explicit note commands | anchor + note payload |
| `emergency` | yardım, imdat | override all |
| `conversation` | default speech spike | co-presence LLM path |
| `observe` | no spike | field mass only |

---

## Memory = temporal anchor graph (not storage)

Memory is not a flat log. Each write creates:

```
Anchor {
  anchorId,
  atMs,
  mediaPositionMs?,
  source,
  semanticCluster,
  preview,
  emotionalTag?,
  linkedEventIds[]
}
```

Retrieval: `resolveTemporalAnchorsV1({ query, windowMs })`.

---

## Media sync scaffold

```javascript
registerMediaSyncV1({
  provider: "youtube" | "media_player" | "file_stream",
  positionMs,
  durationMs,
  title?
})
```

Used for: "video timestamp t=12:43" rewind on scene_query.

---

## Scenario mapping

### YouTube co-watch
- Sources: `youtube`, `mic`, `user_action`
- Commentator → low salience field mass
- User pause + question → `scene_query` + `analytical`
- Event memory marks on salience peaks (future auto-mark)

### Live match
- `system_audio` crowd + commentator vs `mic` user
- Spike engine weights **user stream + name_call** over commentator mass

### "Not al"
- Intent: `memory_write` (not STT pipeline)
- Anchor: current stream window + media position

### Photo / memory clip
- Source: `image` | `archive`
- Intent: `memory_retrieval` on "bu neydi?"

---

## Console

```javascript
window.__rhizoh.experienceFabric
window.__rhizoh.experienceFabric.attentionField
window.__rhizoh.experienceFabric.anchors
window.__rhizoh.lastFabricSpike
```

---

## v1 scope vs v1.1

| v1 (now) | v1.1+ |
|----------|-------|
| Event normalizer | Full embedding pipeline |
| Attention field | Prosody + visual saliency |
| Spike intents | Auto event memory marks |
| Temporal anchors | Emotional tagging graph |
| Media sync register | YouTube API / HTML5 wire |

---

## Success principle

> Success ≠ "hear everything"  
> Success = **weight the right thing**

Adaptive τ from Co-Presence + source salience hints in fabric.

---

*Rhizoh Experience Fabric — context-aware co-living intelligence.*
