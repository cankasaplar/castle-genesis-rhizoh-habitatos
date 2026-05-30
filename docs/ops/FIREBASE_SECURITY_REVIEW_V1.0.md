# Firebase Security Review v1.0 (Phase 0.5)

**Goal:** System does **not** accidentally accept live user telemetry while data-plane is inert.

## Firestore rules (`firestore.rules`)

| Area | Finding | Action |
|------|---------|--------|
| `castle/{doc}` | Public read; write requires auth | OK for manifest; tighten prod roles if needed |
| `users/{uid}` | Owner-only | OK |
| `memberships` | Client write **false** | OK |
| `active_castles` | Auth heartbeat path | **Review:** disable client create until Phase 1 READY |
| Rhizoh event streams | Envelope + type regex | OK shape; no anonymous write |

## Storage rules

- [ ] Review `storage.rules` (if any) for public write

## Client

- [ ] No heartbeat POST without `isDataPlaneActiveV0()`
- [ ] Analytics gated on cookie consent (see cookie checklist)

## Anonymous auth

- [ ] Document whether anon auth is enabled in Firebase console
- [ ] If enabled: restrict to read-only paths only

## Debug endpoints

- [ ] No public debug Cloud Functions without auth
- [ ] Dev globals (`window.__rhizoh`) not exposed on production ingress build

## Sign-off

Reviewer · Date · HOLD / READY note
