# Rhizoh Castle Attention Stack v1

**SPECFLOW:** `CORE-ELIGIBLE` · **Status:** production scaffold v1  
**Parent:** Experience Fabric v1 → **Castle Attention Stack**

---

## Product lock

Rhizoh does not **receive input**. Rhizoh **observes an environment**.

Castle is not UI — Castle is **shared multi-user, multi-source perception space**.

```
❌ Mic → STT → filter → LLM
✅ Multi-world streams → Attention Field → Spike → speak | memory | shadow
```

---

## Three production modules

| Module | Path | Role |
|--------|------|------|
| **Castle Attention Field v1** | `castlePerception/castleAttentionFieldV1.js` | Room-level attention mass + `AttentionEvent` taxonomy |
| **Multi-Stream Fusion Bus v1** | `castlePerception/castleMultiStreamFusionBusV1.js` | Single ingress for all streams |
| **Rhizoh Co-Presence Kernel v1** | `rhizoh/runtime/rhizohCoPresenceKernelV1.js` | Three-mode companion routing |

---

## CastleRoom (shared reality)

```typescript
CastleRoom {
  roomId: string
  participants: [userA, userB, rhizohA, rhizohB]
  streams: {
    mic: AudioStream[]
    video: VideoStream[]
    media: MediaStream[]
    docs: DocumentStream[]
    system: SystemEvents[]
  }
}
```

API: `initCastleRoomV1({ roomId, participants })`

---

## AttentionEvent (not STT)

```typescript
AttentionEvent {
  source: "mic" | "tv" | "youtube" | "camera" | "file" | "web" | ...
  type: "noise" | "narrative" | "reference" | "intent" | "emergency"
  salience: number
  temporalSpan: "short" | "medium" | "long"
  signal: { raw, preview, mediaPositionMs?, confidence? }
  timestamp: number
}
```

**Noise = context**, not error.

| Input | Type |
|-------|------|
| TV commentary | `narrative` |
| YouTube video | `reference` / `narrative` |
| Audiobook | `narrative` + `long` span |
| "Rhizoh?" | `intent` |
| "şu pozisyon neden kötü?" | `intent` → analytical spike |

---

## Three locked modes

| Mode | Env | Behavior |
|------|-----|----------|
| **Companion** | `VITE_RHIZOH_PRESENCE_KERNEL_MODE=companion` | Chat + memory + low latency |
| **Co-Presence** | default / `co_presence` | Stream + attention spikes only |
| **Ambient Observer** | `ambient_observer` | Never speak; memory + summarization |

Kernel output channels: `speak` | `memory` | `shadow` | `silent`

---

## Stack flow

```
Sources (mic, tv, youtube, media, camera, file, web)
    ↓ publishStreamEventV1()
Multi-Stream Fusion Bus
    ↓ ingestAttentionEventV1() + ingestFabricEventV1()
Castle Attention Field + Experience Fabric
    ↓ processPresenceKernelIngressV1()
Co-Presence Kernel (mode-aware)
    ↓
speak → voice pipeline | memory → anchor graph | shadow → context ring
```

---

## Long-form streams

| Scenario | Kernel mode | Behavior |
|----------|-------------|----------|
| Audiobook (hours) | Ambient Observer | `publishNarrativeStreamTickV1()` — thematic memory, no speak |
| Live match | Co-Presence | Event extraction + context slice on question |
| Video + notes | Co-Presence | `memory_write` anchor at `mediaPositionMs` |

---

## Console

```javascript
window.__castle.attentionField
window.__castle.fusionBus
window.__rhizoh.coPresenceKernel
window.__rhizoh.lastKernelDecision
window.__rhizoh.setPresenceKernelMode("ambient_observer")
```

---

## Wiring (v1)

- `voiceTranscriptWitnessPipelineV0` → `publishStreamEventV1()`
- `rhizohVoiceDualPathRouterV0` → `processPresenceKernelIngressV1()`

---

*Castle = shared reality runtime. Rhizoh = ambient cognitive layer.*
