# Anchor truth table (canonical) — V0

**SPECFLOW:** `RESEARCH-ONLY` — normative reference for agents and runtime wiring; execution SSOT remains code + CI.

## Law: place ≠ identity

| Concept | Role | Authority |
|--------|------|-----------|
| **WORLD_CALIBRATION** (e.g. Sarıyer row `anchor_sariyer_stability`) | World-layer atmosphere / projection bootstrap seed | **Not** identity, **not** HOME_BASE, **not** continuity owner |
| **HOME_BASE** (e.g. Serencebey as *your* anchor in product copy) | Castle Core identity root | **Only** via `Firebase Auth → user profile → validated homeAnchor → primaryAnchorResolverV0` |
| **Map / camera / globe viewport** | Projection & spatial locality | **Never** equivalent to `HOME_BASE` in state trees |

## Constitutional sentences (code mirrors)

- `SARIYER_IS_NOT_USER_CASTLE_LAW_V0` — `apps/client/src/rhizoh/spatial/anchorTruthTableV0.js`
- `HOME_BASE_NOT_CAMERA_VIEWPORT_LAW_V0` — same file
- `HOME_ANCHOR_AUTHORITY_CHAIN_V0` — `apps/client/src/rhizoh/spatial/homeAnchorAuthorityV0.js`

## Guest vs authenticated

| Mode | HOME_BASE | World |
|------|-----------|--------|
| **Guest** | `EPHEMERAL_EXPLORE` — no persistent Castle | May explore world / projection surfaces |
| **Authenticated** | `HOME_BASE` only with profile `homeAnchor`; id **cannot** alias world calibration anchor id | Uses calibration seed independently of identity |

## Firestore direction (next wiring PR)

Profile doc should carry immutable-style fields, e.g. `verifiedAt`, `revision`, alongside `lat` / `lon` / `anchorId` / `placeLabel`, consumed by `primaryAnchorResolverV0` (see `UserHomeAnchorV0` typedef).

**Related:** [`docs/MEMBRANE_INTEGRITY_PASS_V0.md`](MEMBRANE_INTEGRITY_PASS_V0.md) (world→UI CI membrane)
- `primaryAnchorResolverV0.js` — resolution + guard
- `geographicAnchorsV0.js` — calibration root definition (world seed semantics in comments)
