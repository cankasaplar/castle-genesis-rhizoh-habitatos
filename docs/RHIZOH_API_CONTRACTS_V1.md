# RHIZOH_API_CONTRACTS_V1

Kategori: Canonical API sözleşmeleri  
Hedef kitle: Integratörler, SDK geliştiricileri, platform ekipleri

## API Surface (v1)

- `POST /runtime/spawn`
- `POST /runtime/permit`
- `POST /runtime/revoke`
- `POST /proof/check`
- `POST /proof/attest`
- `POST /identity/seal`
- `POST /replay/verify`
- `GET /governance/audit`
- `GET /telemetry/stream`

## Contract Principles

- Tüm mutasyon endpoint'leri idempotency key destekler.
- Her kritik çağrı `traceId` ve `executionFingerprint` ile işaretlenir.
- Hata yüzeyi policy-aware kodlar ile sınıflanır (`DENIED_BY_POLICY`, `PROOF_TIMEOUT`, `REPLAY_MISMATCH` gibi).

## Minimal Request/Response Sketch

```json
{
  "traceId": "trc_123",
  "tenantId": "tenant_a",
  "payload": {},
  "policyContext": {
    "riskTier": "high"
  }
}
```

```json
{
  "ok": true,
  "decision": "ALLOW",
  "proofRef": "prf_abc",
  "identitySeal": "seal_xyz"
}
```

## SDK Examples (Pseudo)

```ts
await rhizoh.runtime.spawn({ agentType: "picker", zone: "A-17" });
await rhizoh.proof.check({ obligationId: "safe_path", traceId });
await rhizoh.replay.verify({ replayId: "rpl_001" });
```

## Versioning

- URL major version (`/v1/...`) veya header-based semantic versioning.
- Backward compatibility penceresi: en az 2 minor sürüm.
- Breaking change yalnızca major release ile.

