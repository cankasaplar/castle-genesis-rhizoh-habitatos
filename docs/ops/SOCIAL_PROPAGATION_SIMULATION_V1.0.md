# Social propagation simulation v1.0

Measures **meaning outside the system** — not CPU, Redis, or rollout.

## Four layers

| Layer | Measures | Key metric |
|-------|----------|------------|
| **1. Compression** | What is lost in a clip (RAW, watermark, tenant, disclaimer) | `semanticCompressionScore` (0–1, higher = more loss) |
| **2. Amplification** | Channel distortion + authority | `authorityAmplificationMultiplier` |
| **3. Mutation** | Interpretation drift chain | `mutationSeverity`, `finalText` |
| **4. Persistence** | Cultural memory vs decay | `narrativeHalfLifeDays`, `urbanLegendEmergence` |

## Channels

| Channel | Distortion | Authority amp |
|---------|------------|-------------|
| Slack internal | 0.15 | 1.2× |
| X repost | 0.45 | 2.4× |
| YouTube clip | 0.65 | 3.8× |
| TikTok short | 0.85 | 5.5× |

## Critical risk: watermark survivability

- `uiWatermarkSurvivability` — scope strip + disclaimer + tenant
- `semanticSurvivability` — structure signature + digest ref (light; avoid heavy forensic)
- `combinedSurvivability` — gate floor via `CASTLE_PROPAGATION_MIN_WATERMARK_SURVIVABILITY`

## Dominant distortion (tabletop finding)

When `confidenceDetachedRisk` is true on most paths, aggregate reports:

`dominantDistortionSource: confidence_detached_from_epistemic_context`

→ drives **confidence public readability policy** (bucketed public confidence, uncertainty-first).

## CI

```bash
npm run ci:social-propagation-gate
```

Env:

- `CASTLE_PROPAGATION_GATE_MAX_HIGH_RESIDUAL` (default `2` — viral paths may stay high by design)
- `CASTLE_PROPAGATION_MIN_WATERMARK_SURVIVABILITY` (default `0.2`, applied to **Slack internal** path only)
- Gate fails if **Slack** path is high-residual (internal share must stay mitigated)

## Export

`humanOps.socialPropagationSimulation` on unified narrative.

## Next

Trust decay / mythology dynamics — fork on `persistence.trustDecayForkPrep`.
