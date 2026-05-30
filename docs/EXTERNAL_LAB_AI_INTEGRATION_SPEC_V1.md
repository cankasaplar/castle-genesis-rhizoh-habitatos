# External Lab AI Integration Spec (V1 — secure)

**Status:** SECURED — institutional deploy surface  
**Parent:** [`RHIZOH_CASTLE_GENESIS_PRODUCTION_ARCHITECTURE_V1.md`](RHIZOH_CASTLE_GENESIS_PRODUCTION_ARCHITECTURE_V1.md) §0 (layer **X**)  
**Tag:** `CORE-ELIGIBLE` (gateway + envelope) · `RESEARCH-ONLY` (per-lab credentials rotation playbook)

**Identity:** External Lab AI = **untrusted data source** — controlled, schema-mandatory, rate-limited **event producer**. Not an epistemic peer. Not an execution actor.

---

## 1. What this is not

| ❌ Wrong claim | ✔ Correct claim |
|---------------|-----------------|
| “Lab AI feeds data with no control” | Gateway validates every envelope before B-layer commit |
| “External AI = equal observer” | External AI = signed producer; Rhizoh owns derivation and narrative |
| “Manipulations impossible” | Tamper / schema violations **detected, logged, rejected or quarantined** |

---

## 2. Layer placement (X → B → C → D)

```text
Lab AI ──POST──► Gateway (validation firewall)
                    │
                    ▼ append-only
                 REAL (B) ──► DERIVED (C) ──► NARRATIVE (D)
```

**Invariants (enforce in gateway + CI):**

```text
∀ external_event E     ⇒  immutable_ingestion_only(E) after accept
∀ ingestion I          ⇒  verifiable(I) ∧ timestamped(I) ∧ traceable(I)
∀ derived_state S      ⇒  ∃ event_chain C : S = F_v(C)
```

---

## 3. Allowed event schema

Base envelope: [`packages/protocol/src/infra/InfraEventEnvelopeV1.ts`](../packages/protocol/src/infra/InfraEventEnvelopeV1.ts) · gateway [`apps/gateway/src/infra/envelope.js`](../apps/gateway/src/infra/envelope.js).

### 3.1 Required fields (all Lab AI events)

| Field | Type | Rule |
|-------|------|------|
| `eventId` | string | Unique per producer; `lab:{producerId}:evt:{ulid}` |
| `sessionId` | string | Rhizoh-issued or pre-registered lab session |
| `causalBranchId` | string | `branch:main` unless explicit fork protocol |
| `timestamp` | number | Unix ms; skew ≤ **5000** vs gateway clock |
| `idempotencyKey` | string | Stable on retry |
| `type` | string | Must be in allowlist (§3.2) |
| `payload` | object | JSON Schema validated per `type` |
| `meta.source` | string | **`lab_plugin`** (new; extend enum) |
| `meta.producerId` | string | Registered lab id |
| `meta.schemaVersion` | number | `0` for v1 |
| `meta.signature` | string | See §4 |

### 3.2 Allowlisted `type` values (v1)

| `type` | Layer target | Max rate (per producer) |
|--------|--------------|-------------------------|
| `lab.observation.snapshot` | B (Real ingest) | 30 / min |
| `lab.observation.delta` | B | 120 / min |
| `lab.derived.hint` | **Rejected** — Derived only internal | 0 |
| `lab.narrative.utterance` | **Rejected** — use Rhizoh companions | 0 |
| `lab.execution.*` | **Rejected** | 0 |

**Rule:** Lab AI may only emit types that land in **append-only Real log** — never pre-computed “story scores.”

### 3.3 Example payload (`lab.observation.snapshot`)

```json
{
  "type": "lab.observation.snapshot",
  "payload": {
    "nodeId": "node:ankara_satellite",
    "wgs84": { "lat": 39.9334, "lon": 32.8597 },
    "observationClass": "atmospheric_probe",
    "readings": {
      "rainRateMmH": 2.1,
      "windSpeedKmh": 12.0
    },
    "captureAtMs": 1710000000000
  }
}
```

Rhizoh maps readings into B-layer Real trace; **C-layer** `computeViscosity` runs internally.

---

## 4. Signature format (v1)

**Algorithm:** HMAC-SHA256 over canonical signing string.

**Canonical string:**

```text
{producerId}|{schemaVersion}|{eventId}|{timestamp}|{type}|{sha256(payload_json)}
```

**Header / meta:**

```json
{
  "meta": {
    "source": "lab_plugin",
    "producerId": "lab:istanbul_metu_climate_v0",
    "schemaVersion": 0,
    "signature": "hmac-sha256:base64url(...)",
    "keyId": "lab-key-2026-04"
  }
}
```

**Gateway verification:**

1. Resolve `keyId` → producer secret (KMS / env rotate)  
2. Recompute HMAC; constant-time compare  
3. Reject on mismatch → `401` + audit log (no B-layer write)

**Rotation:** dual `keyId` active 7 days; old key reject after sunset.

---

## 5. Ingestion firewall rules

| Rule | Action on fail |
|------|----------------|
| Unknown `type` | `422` + `reject_code: schema_type_denied` |
| Payload schema invalid | `422` + `schema_validation_failed` |
| Signature invalid / missing | `401` + `signature_rejected` |
| Timestamp skew > 5 s | `400` + `clock_skew` |
| Rate limit exceeded | `429` + `rate_limited` |
| Duplicate `idempotencyKey` (same payload) | `200` idempotent ack (no double append) |
| Duplicate key, different payload | `409` + `idempotency_conflict` → **quarantine flag** |
| Producer not registered | `403` + `producer_unknown` |

**Post-accept:** append to Redis stream / WAL — **no in-place edit**.

---

## 6. Rate limits (defaults)

| Scope | Limit |
|-------|-------|
| Per `producerId` | 120 events / min (burst 30 / 10 s) |
| Per `sessionId` | 300 events / min |
| Global lab ingress | 10_000 events / min (gateway config) |
| Max payload | `CASTLE_MAX_MESSAGE_BYTES` (gateway) |

Exceeded → `429`; sustained abuse → producer **suspended** (config flag, no code deploy).

---

## 7. Divergence detection thresholds

After ingest, **C-layer** recompute compares new state to last snapshot:

| Signal | Threshold | System response |
|--------|-----------|-----------------|
| `resonanceScore` delta vs golden | > 0.15 in 60 s without matching Real readings | `DEGRADED` |
| Ordering regression (`seq`) | Any | `QUARANTINE` + hold producer |
| Idempotency conflict | Any | Producer quarantine + captain alert |
| Orphan derived (no `event_chain`) | Any | Block C publish; log §0.5 violation |
| External vs API Real mismatch | > 25% on same node 5 min | `lab_divergence_flag` (audit only) |

Aligns with [`POST_GO_LIVE_AUTONOMOUS_STABILITY_CONTRACT_V1.md`](POST_GO_LIVE_AUTONOMOUS_STABILITY_CONTRACT_V1.md).

---

## 8. Narrative provenance (required downstream)

Lab events enter **B**; companions emit **D** only with [`narrativeSourceProvenanceV0`](../apps/client/src/rhizoh/runtime/narrativeSourceProvenanceV0.js):

```json
{
  "source_chain": ["lab.observation.snapshot", "weather.api", "computeViscosity.v2"],
  "trust_class": "mixed_origin",
  "derivation_depth": 3,
  "provenance_summary": {
    "dominant_source": "computeViscosity.v2",
    "confidence_shape": "drifting"
  }
}
```

If `source_chain` contains `lab.*`, UI/captain surfaces MUST NOT display as `trusted_internal_derived`.

---

## 9. Production pipeline (normative)

| Stage | Owner | Output |
|-------|-------|--------|
| 1 Validation gateway | `apps/gateway` | accept / reject + audit |
| 2 Ingestion | Worker + Redis | append-only record |
| 3 Derived recompute | Client/worker `F_v` | versioned C state + divergence flags |
| 4 Narrative | Companions (D) | policy-bound strings only |

---

## 10. Producer registration (ops)

| Field | Stored |
|-------|--------|
| `producerId` | `lab:*` stable id |
| `displayName` | Human label |
| `allowedTypes[]` | Subset of §3.2 |
| `publicKey` / HMAC secret ref | KMS id |
| `status` | `active` \| `suspended` |

Firestore collection (target): `castle_lab_producer_registry` — **not** execution identity.

---

## 11. Related documents

| Doc | Topic |
|-----|--------|
| [`RHIZOH_GO_LIVE_ACTIVATION_PROTOCOL_V1.md`](RHIZOH_GO_LIVE_ACTIVATION_PROTOCOL_V1.md) | Flags + §7 integrity loop |
| [`OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md) | Observers influence interpretation, never execution |
| [`AGENT_IDENTITY_AND_ATTRIBUTION.md`](AGENT_IDENTITY_AND_ATTRIBUTION.md) | Meta vs runtime agents |

---

*Deployable claim: Rhizoh is a **verifiable data-processing protocol** for multi-source untrusted ingress — not an absolute oracle.*
