# Rhizoh Gateway Health Index v0

**Status:** ACTIVE · **SPECFLOW:** ops SSOT · **Phase:** 0 observation only  
**Parent:** [`RHIZOH_OBSERVATION_PROTOCOL_V0.2.md`](RHIZOH_OBSERVATION_PROTOCOL_V0.2.md)

---

## What `app.gateway.offline` actually means (code truth)

Boot log line `app.gateway.offline` is emitted when `gatewayUx.phase` becomes `offline` or `offline_dns`:

```12140:12156:apps/client/src/AppRhizoh528T0.jsx
  useEffect(() => {
    const phase = String(gatewayUx.phase || "");
    ...
      else if (phase === "offline" || phase === "offline_dns")
        bootLogRef.current?.warn?.("app.gateway.offline", phase);
```

**It does NOT mean:** World OS dead · SCR stopped · UI broken · voice unregistered · WebSocket disconnect · auth token flap · “link flapping”.

**It means:** The **HTTP health probe** to the Rhizoh backend (`/health/deps` via same-origin proxy on rhizoh.com or direct Render URL) failed classification as connected — timeout, network error, DNS, or bootstrap retry window not yet collapsed.

### Terminology lock (SSOT — do not regress)

| Say | Do not say (misleading) |
|-----|-------------------------|
| **Probe state oscillation** (debounced state machine) | Gateway flap / reconnect loop / WS drop |
| **Bootstrap + retry window collapse** (+6–17s band) | Network outage |
| **`warming_up` / `uncertain`** semantic | Hard offline = system down |

📌 **Gateway state = probe oscillator output**, not transport link telemetry.

### What is being probed

| Layer | Mechanism |
|-------|-----------|
| Transport | **HTTP fetch** — not a persistent WebSocket |
| Endpoint | `getRhizohGatewayHealthBase()` → rhizoh.com: `/api/gatewayProxy/health/deps` |
| Timeout | **6.5s** per probe (`HEALTH_TIMEOUT_MS`) |
| Poll interval | ~**12s base** + jitter + flap backoff (`computeGatewayHeartbeatDelayV1`) |
| Boot connect | Up to **5 attempts** with exponential backoff + flap jitter |

### Phases you may see (runtime)

| Phase | Meaning |
|-------|---------|
| `initializing` / `connecting` / `reconnecting` | Bootstrap or retry loop |
| `connected` | Health JSON ok |
| `uncertain` | **Soft state** — health miss debounced; session preserved |
| `offline` / `offline_dns` | Hard label — bootstrap OR sustained failure |
| `degraded*` | Server reachable; dependency weak |

### Gateway Uncertainty Layer (observation semantics)

Runtime already has **3-state behavior** — but boot logs still say `offline`:

| When | Runtime phase | **Semantic state** (observe) | Boot log |
|------|---------------|------------------------------|----------|
| First connect retry | `offline` / `reconnecting` | **`warming_up`** | `app.gateway.offline` ⚠️ |
| Post-connect 1–2 miss | `uncertain` | **`uncertain`** | no offline log |
| Probe ok | `connected` | **`healthy`** | `app.gateway.connected` |
| Sustained fail | `offline` | **`offline`** | `app.gateway.offline` |

**Log #2 mapping:**

```
+448ms   engine ready     → local motor alive
+6693ms  offline          → warming_up (cold start attempt ~1)
+14744ms offline          → warming_up (attempt ~3–4)
+17807ms connected        → healthy (convergence)
```

This is **verification delay**, not crash.recover.

**Why SCR unaffected:** SCR = client-side loop (`presenceFrame.tickSeq`). Gateway probe = separate HTTP plane. SCR 18→52 during offline is expected.

**False offline source:** Boot loop uses binary `offline` before first `connected`. `uncertain` only activates **after** first successful connect (health poll debounce in `runHealthTick`).

Observation tools expose semantic layer via:

```javascript
rhizohGatewayHealth.read().semantic
// { state: "warming_up"|"uncertain"|"healthy"|"degraded"|"offline", severity, notes }
```

Use **semantic.state** for drift classifier — not raw `offline` alone.

---

## Progression: Observation → Stabilization → Phase 1

| Track | Status | Contents |
|-------|--------|----------|
| **1. Observation** | ✅ active | Ground Truth Lock · Drift v0.7 · Gateway semantic · False-offline eliminator (observe) |
| **2. Stabilization** | 🟡 started | Boot log filter (`app.gateway.warming_up`) · probe debounce exists · retry smoothing exists |
| **3. Phase 1** | spec | WAL timeline · event replay · state reconstruction |

**One line:** `app.gateway.offline` ≠ system down · = health verification could not assert backend at that instant.

### False-offline eliminator

| Layer | File | Role |
|-------|------|------|
| Runtime boot log | `gatewayBootObservabilityFilterV0.js` | Log #2 `offline` → `app.gateway.warming_up` during cold start |
| Observe filter | [`scripts/rhizohFalseOfflineEliminatorV1.js`](scripts/rhizohFalseOfflineEliminatorV1.js) | `rhizohFalseOffline.report()` on observe log |

**Log #2 after stabilization deploy:**

```
+6693ms  app.gateway.warming_up   (was offline)
+14744ms app.gateway.warming_up   (was offline)
+17807ms app.gateway.connected
```

```javascript
rhizohFalseOffline.report();  // false_offline_eliminated vs real_offline
```

---

## Log #2 pattern decoded

Boot timeline from [`RHIZOH_SNAPSHOT_FRAME_V0.1.md`](RHIZOH_SNAPSHOT_FRAME_V0.1.md):

| Δms | Event |
|-----|--------|
| +448 | engine ready |
| +6693 | gateway offline (attempt ~1–2) |
| +14744 | gateway offline (attempt ~3–4) |
| +17807 | gateway **connected** |

This is **initial cold-start bootstrap** (Render waking + 5-attempt loop), not post-connect oscillation. SCR tick 18→52 while identity stable confirms **local motor alive during gateway retry**.

---

## Internet vs design — honest split

| Cause class | Share (Log #2 + code) | Evidence |
|-------------|----------------------|----------|
| **Bootstrap / cold start** | ~60% | offline at +6.7s / +14.7s then connected @ +17.8s |
| **Network jitter / ISP** | ~30% | Contributes to health timeout (6.5s) and AbortError → offline |
| **Browser throttling** | ~10% | Tab inactive slows timers; voice pressure defers health tick +8s |

### Already implemented (not missing)

Your proposed stabilizer layers **partially exist**:

| Proposed | Already in code |
|----------|-----------------|
| Soft heartbeat | HTTP health poll ~12s + session keeper `lastHealthOkAt` |
| Exponential backoff | `getGatewayReconnectBackoffMsV1` · `backoffWithFlapAndJitter` |
| False offline filter | `uncertain` phase · `getGatewayOfflineDebounceThresholdV1()` (2–3 misses) · `shouldPreserveSessionOnTransientFailureV1()` |
| Flap detection | `computeGatewayFlapPressure()` · timeline in `sessionStorage` |

**Gap:** observability tools were reading `liveMonitor.gateway.status` — **that field does not exist** on `liveMonitor`. Real sources:

- `window.__CASTLE_GATEWAY_SESSION_KEEPER__`
- `window.__CASTLE_BUILD_RUNTIME_SNAPSHOT__()?.gatewayState`
- `sessionStorage['castle.gateway.timeline.v1']`

---

## Gateway Health Index v1 (observation)

**File:** [`scripts/rhizohGatewayHealthIndexV1.js`](scripts/rhizohGatewayHealthIndexV1.js)

Paste on rhizoh.com (after main app load):

```javascript
// paste file, then:
rhizohGatewayHealth.read();
```

Returns:

- `sources.phase` — real gateway phase
- `sources.flap` — flips in last 90s
- `sources.since_health_ok_ms` — heartbeat age
- `index.score` — 0–100 stability
- `index.gate` — `STABLE` · `WATCH` · `UNSTABLE`
- `index.falseOfflineLikely` — debounce / transient miss hint

Wired into [`rhizoh-observe.html`](scripts/rhizoh-observe.html) Gateway card when index script loaded first.

---

## Phase 0 → Phase 1 gateway gate

Gateway is **not blocking Phase 1** if:

- Boot-time offline resolves to `connected` within one session
- Post-connect flap ≤ 2 in 90s window
- SCR tick grows while tab active
- `uncertain` dominates over hard `offline` during steady state

Investigate before Phase 1 if:

- Hard `offline` every health poll cycle after connected
- `flap.level === "hot"` sustained
- SCR stall + gateway churn together

---

## Future: Gateway Stabilizer v1 (runtime — not Phase 0)

Runtime tuning (debounce thresholds, poll cadence, Render warm keep-alive) requires a **separate change set** outside frozen core. **Measure first** with Health Index + Auto Observer ≥3 blocks; tune only if post-connect flap persists.

---

## Related

- [`RHIZOH_RUNTIME_FRAME_CORRELATION_V0.md`](RHIZOH_RUNTIME_FRAME_CORRELATION_V0.md)
- [`useRhizohGatewayMonitor.js`](../apps/client/src/rhizoh/useRhizohGatewayMonitor.js)
- [`gatewaySessionKeeperV1.js`](../apps/client/src/rhizoh/runtime/gatewaySessionKeeperV1.js)
