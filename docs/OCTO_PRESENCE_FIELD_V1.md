# Octo Presence Field V1 — projection · camera · audio · crowd

**Tag:** `RESEARCH-ONLY`  
**Parent:** [`MULTI_CASTLE_SOCIAL_EVENT_ARCHITECTURE_V1.md`](MULTI_CASTLE_SOCIAL_EVENT_ARCHITECTURE_V1.md) · [`CAMERA_UNIFICATION_SPEC_V1.md`](CAMERA_UNIFICATION_SPEC_V1.md) · [`PERCEPTUAL_PHYSICS_KERNEL_V2.md`](PERCEPTUAL_PHYSICS_KERNEL_V2.md)

---

## 0. One sentence

> **Octo is not watched. Octo is felt — as a state-driven projection field.**

Not an NPC avatar. Not a video stream puppet. An **alan varlığı** (field entity).

---

## 1. Dual projection entity

```
┌─────────────────────────────────────┐
│ Octo Cognitive State (internal)      │
│  fieldState · drive · topology seal  │
├─────────────────────────────────────┤
│ Octo Spatial Avatar (projection)     │
│  cube motion · crystal · tentacles   │
│  = visible motion FROM state delta   │
└─────────────────────────────────────┘
         ↑ read-only          ↑ post-render
    Camera lens          Fracture texture
```

| Layer | Truth | Motion |
|-------|-------|--------|
| **Cognitive** | Internal state machine | State **changes** |
| **Projection** | Rendered cube space | Change **appears** as motion |
| **Camera** | Perception lens | **Projects** state — does not drive it |

**Critical:** Octo does not “move in real time” as authority. **State change becomes visible motion** — compatible with passive fracture (post-render distortion only).

---

## 2. Camera model (locked)

| Wrong | Right |
|-------|-------|
| Octo = video stream avatar | Octo = state-driven projection field |
| Camera tracks Octo mesh | Camera **reads** Octo state snapshot |
| Camera controls tentacles | Cube-centric camera **projects** crystal/body pose |

Implementation alignment: [`octoCubeCentricCameraV1.js`](../apps/client/src/studio/octoCubeCentricCameraV1.js) · `fracturePhaseMs` offset (post-render).

**Concert / event:** camera breathes with **field intensity** — not with Cesium geo binding.

---

## 3. Reactive presence (not performer controller)

In events, Octo is **reactive presence** — not “performer” in execution sense.

| Octo is | Octo is not |
|---------|-------------|
| Present in shared session field | Session host |
| Reactive to field perturbations | Audio→animation direct wire |
| Observable by guests | Executor for spatial stage |

---

## 4. Audio and crowd — field perturbation model

Octo does **not** “hear.” The **field** is perturbed; Octo **state** updates; **projection + fracture** follow.

```
Audio stream / crowd energy
        ↓
FieldPerturbationV0 {
  intensity, rhythmDensity, frequencyBand?, crowdScalar?
  causalClaim: false
}
        ↓
sharedFieldState (interpretive session mood)
        ↓
Octo cognitive drive bias (bounded)
        ↓
projection tick → visible motion
        ↓
fracture: phase shift · shimmer · motion bias (post-render)
```

| Stage | Forbidden |
|-------|-----------|
| Raw audio → skeletal animation | Direct bypass of state machine |
| Perturbation → `routeCesiumCommandV0` | Any spatial side effect |
| Crowd scalar → input graph | Attention steering |

**Sketch API:**

```text
OctoFieldPerturbationV0 {
  sessionId: string
  source: "ambient_audio" | "crowd_energy" | "event_clock"
  intensity: number       // 0..1
  rhythmPhase?: number
  atMs: number
  causalClaim: false
}
```

---

## 5. Concert scene (Octo + camera + field)

User sees Octo “there.” Engineering truth:

- Stage (Cesium) and Octo (cube) are **aligned lenses**, not merged truth
- Sound perturbs **field**, not Octo ears
- Camera sees **alan** shaped by state — not a character mesh to chase
- Guests feel Octo as **durum** (condition), not clip playback

Fracture: when stream and map skew, user feels desync — no “audio sync lost” banner.

---

## 6. Observation mode

| Mode | Ingress | Octo |
|------|---------|------|
| `watch` | Read-only session bind | Projects host field state |
| `replay` | Archived perturbation track | No live field ingress |
| `co_presence` | Multi-inhabitant ([`RHIZOH_MULTI_INHABITANT_CO_PRESENCE_V0.md`](RHIZOH_MULTI_INHABITANT_CO_PRESENCE_V0.md)) | Shared projection; topology seal intact |

---

## 7. Illegal couplings (Octo field)

| ID | Forbidden |
|----|-----------|
| `OP-IL01` | Audio RMS → executor op |
| `OP-IL02` | Camera pose ← Cesium geo |
| `OP-IL03` | Field perturbation → `fieldState` without session context envelope |
| `OP-IL04` | Perturbation → topology write (agent source) |
| `OP-IL05` | Live + replay perturbation without `ET_*` gate |

---

## 8. Phasing

| Step | Deliverable |
|------|-------------|
| V1 spec | This doc |
| V1.1 | `octoFieldPerturbationV0.js` + drive bias function (local) |
| V1.2 | Session-bound perturbation ingress (mock) |
| V2 | Live concert feed adapter (READY + comms plane) |
