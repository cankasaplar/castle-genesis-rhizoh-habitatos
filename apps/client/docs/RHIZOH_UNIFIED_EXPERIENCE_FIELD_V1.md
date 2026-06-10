# Rhizoh Unified Experience Field v1

**SPECFLOW:** `RESEARCH-ONLY` (field model) · **Runtime scaffold:** `CORE-ELIGIBLE`  
**Parent:** [`RHIZOH_CO_PRESENCE_RUNTIME_SPEC_V1.md`](./RHIZOH_CO_PRESENCE_RUNTIME_SPEC_V1.md)  
**Engine SSOT:** `apps/client/src/rhizoh/runtime/rhizohUnifiedExperienceFieldV1.js`

---

## Identity evolution (frozen)

| Generation | Definition |
|------------|------------|
| v0 | Microphone-listening assistant |
| v1 | Attention-based co-presence agent (voice stream) |
| **v1.1 field** | Agent living inside a **unified experience stream** |

Rhizoh does not listen to one input. Rhizoh inhabits:

```
Experience = f(mic, media, screen, camera, files, user_actions, memory_clips, time)
```

---

## Core shift

```
❌ source = microphone
   audio → transcript → analysis

✅ sources = unified experience field
   experience → segmentation → attention → reasoning
```

STT remains a **signal feeder** — one channel among many.

---

## Experience source taxonomy

| Source | Examples | Default priority |
|--------|----------|------------------|
| `mic` | User speech, room ambient | high (when spike) |
| `youtube_audio` | Video speech + music bleed | observe |
| `system_audio` | OS / browser tab audio | observe |
| `media_player` | Local file, castle player | co-watch |
| `camera_context` | Live frame, photo capture | on-demand |
| `file_stream` | Archive clip, movie segment | co-watch |
| `memory_clip` | Saved moment replay | recall |
| `external_device` | Cast, HDMI, future devices | observe |
| `user_action` | pause, seek, highlight, note | **spike trigger** |
| `screen_context` | Visible UI, board, slide | passive index |

---

## Attention sources (multimodal)

Attention is **not speech-only**:

| Signal | Spike kind | Example |
|--------|------------|---------|
| Speech prosody + lexicon | `speech` | "Rhizoh bu hamle neden kötü?" |
| User interaction | `interaction` | pause + "burayı açıkla" |
| Media state change | `media_state` | seek rewind 30s |
| Video scene change | `scene_change` | goal replay, cut |
| Visual saliency | `visual` | photo opened, region tap |
| Historical relevance | `memory_recall` | "bu sahneyi hatırla" |
| Emergency lexicon | `emergency` | yardım, imdat |

**Fused spike:**

```
Spike_field(t) = max_k( w_k · Signal_k(t) ) + interaction_boost + co_watch_mass
```

Implementation: `fuseExperienceAttentionSpikeV1()`.

---

## Scenario mapping

### YouTube / live match
- Background: crowd, commentator → `observe` field mass
- User pause + question → `interaction` + `speech` composite spike
- Rhizoh role: **co-watcher + co-thinker** (not passive viewer)

### Movie clip / archive
- `file_stream` + temporal memory field
- "Bu sahneyi hatırla" → `memory_recall` spike → memory write

### Photo inspection
- `camera_context` / `file_stream` visual embedding (future)
- User commentary fusion → multimodal reasoning spike

### Device control + notes
- `user_action` (highlight, bookmark) + `speech` ("şunu not al")
- Output: note commit, not full LLM unless analytical spike

---

## Architecture layers

```
┌─────────────────────────────────────────┐
│  Unified Experience Field (this spec)   │
│  sources · timeline · field mass        │
└─────────────────┬───────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Co-Presence Runtime v1                 │
│  stream ring · τ_adaptive · spike kinds │
└─────────────────┬───────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Governance / LLM (spike-triggered only)│
└─────────────────────────────────────────┘
```

---

## Context windows (field-tier)

| Tier | Duration | Contents |
|------|----------|----------|
| immediate | 30s | Last speech + last user action |
| co_watch | 90s | Media position + transcript chunks |
| session | 300s | Narrative arc, notes, spikes |
| archive | persistent | "remember this scene" commits |

---

## v1 scaffold scope (now)

- Source registry + timeline events
- Interaction spike detection (pause/seek/highlight verbs)
- Speech spike passthrough from co-presence gate
- Field snapshot on `window.__rhizoh.experienceField`
- **No** full YouTube API, screen capture, or vision embedding yet

---

## v1.1+ research slots

- Dual-stream acoustic separation (commentator vs user)
- Frame-based visual saliency
- Media player position sync (castle / HTML5 video)
- Screen/board OCR for chess position
- Prosody-only spike without text

---

## Console

```javascript
window.__rhizoh.experienceField     // unified field snapshot
window.__rhizoh.coPresenceRuntime     // voice spike SSOT
window.__rhizoh.lastExperienceSpike   // last fused spike
```

---

*Rhizoh = environmental co-agent inside an experience stream, not a microphone app.*

**Superseded by:** [`RHIZOH_EXPERIENCE_FABRIC_V1.md`](./RHIZOH_EXPERIENCE_FABRIC_V1.md) — unified event stream + spike engine (v1.1 SSOT).
