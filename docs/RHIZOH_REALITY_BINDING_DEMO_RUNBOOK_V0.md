# Rhizoh Reality Binding Demo Runbook v0

**SPECFLOW:** `RESEARCH-ONLY` · outreach evidence · 2-browser video script  
**Goal:** One video beats fifty pages — show proposal → ACK → commit → drift/reconcile in parallel browsers.

---

## What the video must prove

| Pane | Shows |
|------|--------|
| Browser A | Human proposes move (chess is **evidence carrier only**) |
| Browser B | Same committed position within seconds |
| Lower third / overlay | `gateway ack` · truth log · `DRIFT_DETECTED` / reconciliation when forced |

**Caption honesty:** `interpretationOnly: true` — research preview, not signed data-plane READY.

---

## Preconditions (production rhizoh.com)

1. PR #309–#310 deployed (reality sync + inbox bridge)
2. Two browsers or one normal + one incognito
3. Console access on host tab

---

## Script (≈5 minutes capture)

### 1. Host — create session

```javascript
await window.__rhizoh.matchCastleInbox.challengePeer({ playerId: "a" })
// or manual:
await window.__rhizoh.matchSessionSyncApi.start({ sessionId: "…", playerId: "host", role: "host" })
window.__rhizoh.matchmaking.realityStatus()
```

Confirm: `wsOpen: true`, `shareUrl` present, `fen` updates after move.

### 2. Guest — join share URL

Open `shareUrl` in Browser B → legal gate if needed → Chess Arena → **HUMAN_HUMAN** mode when reality sync active.

```javascript
await window.__rhizoh.matchSessionSyncApi.start({ sessionId: "…", playerId: "a", role: "player" })
window.__rhizoh.matchmaking.realityStatus()
```

### 3. Move on A — observe B

Make one legal move on A. B board should reflect committed FEN (not merely local preview).

### 4. Optional drift beat

Force local preview divergence (advanced) or narrate existing `DRIFT_DETECTED` log line from console.

### 5. Closing frame

Show growing event log + one-liner: *Observation ≠ Execution · gateway owns commit.*

---

## Automated helper (CI / rehearsal)

```javascript
await window.__rhizoh.matchmaking.verifyBroadcastE2e({ reset: true })
```

See [`RHIZOH_P0_REALITY_SYNC_IMPLEMENTATION_BLUEPRINT_V1.md`](RHIZOH_P0_REALITY_SYNC_IMPLEMENTATION_BLUEPRINT_V1.md).

---

## Recording tips

- 1920×1080, dark theme, monospace log panel
- Label panes **Host** / **Guest** — not “Player 1 chess”
- End card: `/academy` + `/founder-circle`

---

## Not in scope for this video

- Go / basketball / WorldSports
- “Shipped multiplayer product” claim
- Payment / Founder Circle checkout

*RESEARCH-ONLY*
