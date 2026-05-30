# Sovereign Network — Contract schemas (PR-2)

**SPECFLOW:** `RESEARCH-ONLY` at file level, but **change discipline = contract freeze**: edits here are **backward-compatibility** decisions, not “design tweaks.”

**Kernel narrative (PR-1 doc):** [`docs/SOVEREIGN_NETWORK_KERNEL_SPEC_V0.md`](SOVEREIGN_NETWORK_KERNEL_SPEC_V0.md)

---

## What this PR is

| In scope | Out of scope (never embed in these schemas) |
|----------|-----------------------------------------------|
| Event **envelope** shape + routing class + signing hooks | Atmosphere math, shader params, weather formulas |
| Minimal **castle graph** node / edge | Pet behavior, animation graphs |
| **Permission** row shape (soft ACL flags) | Studio business rules, projection composition |
| `epochId` + `signature` **fields** | Crypto algorithm choice (declared elsewhere) |

**Rule:** Payload is **not** part of the sovereign envelope contract. Consumers MAY validate payload with **separate** versioned schemas; this layer stays intentionally blind.

---

## Artifacts (frozen)

| File | Role |
|------|------|
| [`docs/schemas/sovereign-network-event-envelope-v0.schema.json`](schemas/sovereign-network-event-envelope-v0.schema.json) | Wire/event envelope: `eventId`, `timestamp`, `type`, `origin`, `castleId`, `userId`, opaque `payload`, `signature`, `epochId` |
| [`docs/schemas/sovereign-castle-graph-v0.schema.json`](schemas/sovereign-castle-graph-v0.schema.json) | Minimal **node** or **edge** document (`oneOf`) |
| [`docs/schemas/sovereign-network-permission-v0.schema.json`](schemas/sovereign-network-permission-v0.schema.json) | Peer permission row: allow flags + `denyList` + optional `trustScore` |

### Envelope `type` enum

`ATMO` | `PET` | `PORTAL` | `STUDIO` | `GATEWAY` — routing class only; finer-grained strings belong **inside** `payload` or a separate registry, **not** as new top-level envelope properties without a schemaVersion bump.

### Graph `anchor` / `stateRef`

Both are **opaque strings** (pointers / paths / revision ids). They MUST NOT duplicate geographic or UI literals; L0 anchor resolution remains outside this contract.

---

## Versioning

- **`schemaVersion: 0`** — initial contract freeze in repo.
- **Breaking change** → increment `schemaVersion`, retain migration note in this file’s changelog table; do not silently extend `additionalProperties` on frozen objects.

---

## Changelog

| schemaVersion | Date | Summary |
|---------------|------|---------|
| 0 | 2026-05-12 | Initial PR-2: envelope + graph node/edge + permission row |
