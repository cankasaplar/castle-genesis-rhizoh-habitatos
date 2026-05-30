# Tenant narrative isolation v1.0

**Problem:** A single global DERIVED narrative lets org A’s story shape org B’s ops perception (screenshot economy + cross-tenant blame).

**Invariant:** Every narrative export is tenant-scoped; `globalDerivedState` is always `false`.

---

## Scope model

| Scope | `tenantId` | RAW | DERIVED |
|-------|------------|-----|---------|
| Tenant | `org-*` / `uid:*` | Tagged `tenant_scoped_ops:{id}` | Sealed per tenant |
| Platform aggregate | `__platform__` | Cluster-wide measurement OK | Still not global-reusable |

---

## Build API

```js
await buildUnifiedStateNarrativeV0({ tenantId: "org-acme" });
await buildUnifiedStateNarrativeV0({ platformScope: true }); // internal ops only
```

Hardening HTTP:

- `x-castle-tenant-id` header (explicit org)
- else authenticated `uid:{firebaseUid}`
- else `platformScope` (anonymous admin view)

---

## Fingerprinting

`narrativeFingerprint` = SHA-256 of stable JSON (tenant + systemState + headline + probe).

Distinct tenants → distinct digests (CI enforced).

---

## Screenshot scope watermark

`screenshotScopeWatermark` on every export; rendered on `RhizohInterpretationOpsPanel` (non-removable in UX contract).

---

## CI

```bash
npm run ci:tenant-narrative-isolation
```

Builds tenant A/B with private probes; asserts zero cross-leak and no global derived.

---

## Modules

- `narrativeTenantIsolationV0.js`
- `runTenantNarrativeIsolationGateV0.mjs`

---

*Next phase: social propagation simulation → trust decay / mythology dynamics.*
