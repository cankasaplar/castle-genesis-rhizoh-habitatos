# Membrane integrity pass — V0

**SPECFLOW:** `RESEARCH-ONLY` — operational checklist + CI script [`scripts/membraneIntegrityPassV0.mjs`](../scripts/membraneIntegrityPassV0.mjs); executable truth is the script + repo layout, not prose alone.

**Related:** [`docs/ANCHOR_TRUTH_TABLE_V0.md`](ANCHOR_TRUTH_TABLE_V0.md), [`docs/SOVEREIGN_NETWORK_KERNEL_SPEC_V0.md`](SOVEREIGN_NETWORK_KERNEL_SPEC_V0.md) (L0/L1/L2 + C2C event framing), [`docs/RHIZOH_PROJECTION_DISCIPLINE_V0.md`](RHIZOH_PROJECTION_DISCIPLINE_V0.md)

## Intent

Prevent **world / projection / camera** surfaces from becoming **identity authority** (no “demo city = me”, no UI-produced HOME_BASE).

## Three leak classes (manual + automated)

| Class | Risk | Script coverage (V0) |
|-------|------|----------------------|
| **A — Identity leakage** | UI or map shows resolver tokens, `HOME_BASE`, profile anchor fields | Forbidden substrings in `.jsx`/`.tsx` outside `rhizoh/spatial/` + forbidden imports of resolver modules |
| **B — Perception → identity backflow** | Fog/aura labeled as “you / home” in copy | Partially: no `userHomeAnchor` / `HOME_BASE` in UI; deeper copy review remains human |
| **C — Camera / viewport contamination** | `camera.* = …homeAnchor` style wiring | Heuristic regex on selected trees (`castleFlight`, `rhizoh/runtime`, `studio`, `components`, `shell`, `auth`) |

## Automated rules (`membraneIntegrityPassV0.mjs`)

1. **UI membrane:** every `apps/client/src/**/*.jsx|tsx` except `__tests__` and `rhizoh/spatial/` must not contain identity tokens (`HOME_BASE`, `userHomeAnchor`, resolver paths as text) or import `primaryAnchorResolverV0`, `homeAnchorAuthorityV0`, `anchorTruthTableV0`.
2. **Place literals:** UI files must not contain hardcoded `Serencebey` or `Sarıyer` strings (world calibration / profile labels belong in spatial/geo tables, not JSX fallbacks).
3. **`worldPresenceRuntimeV0.js`:** must not mention resolver tokens or import identity resolution.
4. **Camera heuristic:** reject obvious `camera|viewer|scene.*=.*homeAnchor` assignments outside spatial.

## Runtime checklist (human)

- `worldPresenceRuntimeV0.js` — atmosphere scalars only; no identity.
- `deriveAnchorAtmosphereProjectionV0` — numeric hint bundle to consumers.
- **Routing:** paths do not mint SSOT identity (see `CastleShellRouter` single-app pattern).
- **Debug overlays** — show numeric / lane meta only; avoid “your home” semantics in labels.

## Dangerous patterns (reject in review)

- `if (anchor.id === "HOME_BASE")` in UI
- `camera.center = user.homeAnchor`
- `fogIntensity` renamed or displayed as “user stress” without an explicit non-identity contract
- District name as UI string fallback for “where I live”

## Commands

```bash
npm run stabilization:validate-membrane-v0
```

Included in: `npm run stabilization:validate-client-boundaries-quick`.
