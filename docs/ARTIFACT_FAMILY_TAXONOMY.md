# Artifact family taxonomy — observation layer (planned + active)

**SPECFLOW:** `FUTURE-PROOF-ONLY` — **wire / şema sözleşmeleri**; execution değildir.

Bu belge, [`OBSERVATION_EVENT_REGISTRY.md`](OBSERVATION_EVENT_REGISTRY.md) ile birlikte **artifact family** kodlarını sabitler: her olay türü için `schemaVersion` (örn. `AFOA-1`) ile ayrı **serialization / replay** sözleşmesi. **Semantic** içerik (metin anlamı) ayrıca `version` ile mühürlenir — [`BOOT_ARTIFACT_PROTOCOL.md`](BOOT_ARTIFACT_PROTOCOL.md). Hangi “model / gözlemci türü”nün nereye oturduğu: [`MODEL_ECOLOGY.md`](MODEL_ECOLOGY.md).

**Invariant:** Provenance annotates; provenance never determines frozen-core execution paths.

---

## Aktif aile

| Kod | Tam ad | Event (registry id) | schemaVersion (wire) | Durum |
|-----|--------|----------------------|----------------------|--------|
| **ABOA** | Attested Boot Observation Artifact | `boot` (1) | `ABOA-1` | **active** — kod: `rhizohWelcomeEpistemicV1.js`, `rhizohBootArtifactSeal.js` |

Tüm aileler **Invariant 6**’ya tabidir: kayıtlar append-only; düzeltme = yeni artifact ([`BOOT_ARTIFACT_PROTOCOL.md`](BOOT_ARTIFACT_PROTOCOL.md)).

Ortak gövde (ABOA-1): `schemaVersion`, `version` (semantic), `mode`, `primary`, `provenance`, `fingerprint`, `emittedAt`.

---

## Planned aileler (şema taslak — uygulama sonraki sprint)

Aşağıdaki JSON’lar **yapı taslağıdır**; alanlar genişleyebilir; bump `schemaVersion` (`*-2`) ile yapılır.

### ASAA — Attested Session Attach Artifact

Oturum / kimlik yüzeyi bağlandığında gözlem kanıtı (login ≠ execution otoritesi).

```json
{
  "schemaVersion": "ASAA-1",
  "version": "v0.0.0-draft",
  "mode": "session-attach",
  "sessionPointer": { "surface": "world", "uidHint": "redacted-or-hash" },
  "provenance": {
    "readoutVersion": "rhizoh-scenario-readout-v1",
    "phase": "STABLE",
    "scenario": "RHIZOH",
    "readoutDegraded": false,
    "fieldSnapshot": { "intensity": 0, "entropy": 0, "coherence": 0 }
  },
  "fingerprint": "sha256-hex-64",
  "emittedAt": 0
}
```

### AFOA — Attested Field Observation Artifact

Alan okuması / intensity–entropy–coherence (veya eşdeğer) **delta** mührü.

```json
{
  "schemaVersion": "AFOA-1",
  "version": "v0.0.0-draft",
  "mode": "field-shift",
  "fieldDelta": {
    "priorSnapshot": { "intensity": 0, "entropy": 0, "coherence": 0 },
    "nextSnapshot": { "intensity": 0, "entropy": 0, "coherence": 0 }
  },
  "provenance": { "phase": "STABLE", "scenario": "RHIZOH", "readoutDegraded": false },
  "fingerprint": "sha256-hex-64",
  "emittedAt": 0
}
```

### AOJA — Attested Observer Join Artifact

Interpreter / perspektif düğümü sahneye katıldığında gözlem kaydı (otorite değil).

```json
{
  "schemaVersion": "AOJA-1",
  "version": "v0.0.0-draft",
  "mode": "observer-join",
  "observerLabel": "perspective-node-id",
  "provenance": { "phase": "STABLE", "readoutDegraded": false },
  "fingerprint": "sha256-hex-64",
  "emittedAt": 0
}
```

### APEA — Attested Provenance Event Artifact

Köken zinciri mührü — **odak: provenance event**, “ambiguous attribution artifact” değil. **Attribution = provenance chain**, ayrı bir otorite olayı değildir ([`AGENT_IDENTITY_AND_ATTRIBUTION.md`](AGENT_IDENTITY_AND_ATTRIBUTION.md)). **Invariant 6:** düzeltme yeni APEA yayımlar; önceki kayıt mutasyona uğramaz ([`BOOT_ARTIFACT_PROTOCOL.md`](BOOT_ARTIFACT_PROTOCOL.md)).

```json
{
  "schemaVersion": "APEA-1",
  "version": "v0.0.0-draft",
  "mode": "provenance-emit",
  "contributors": ["Cursor Agent (Castle)"],
  "provenance": { "phase": "STABLE", "readoutDegraded": false },
  "fingerprint": "sha256-hex-64",
  "emittedAt": 0
}
```

### GOOA — Google Observation Artifact *(planned)*

Harici **Google** kaynaklı (ör. Maps / Places) **export snapshot** mührü — short link tek başına canonical değil; [`EXTERNAL_OBSERVER_REGISTRY.md`](EXTERNAL_OBSERVER_REGISTRY.md).

```json
{
  "schemaVersion": "GOOA-1",
  "version": "v0.0.0-draft",
  "mode": "external-geospatial-ingest",
  "sourcePointer": "https://maps.app.goo.gl/…",
  "snapshot": {
    "label": "optional human label",
    "coordinates": { "lat": 0, "lon": 0 },
    "resolvedAt": 0,
    "exportKind": "manual-json|screenshot-digest"
  },
  "provenance": { "phase": "STABLE", "readoutDegraded": false },
  "fingerprint": "sha256-hex-64",
  "emittedAt": 0
}
```

### NLOA — NotebookLM Observation Artifact *(planned)*

NotebookLM **export** gözlem paketi — execution yok; adapter-only ([`EXTERNAL_OBSERVER_REGISTRY.md`](EXTERNAL_OBSERVER_REGISTRY.md)).

```json
{
  "schemaVersion": "NLOA-1",
  "version": "v0.0.0-draft",
  "mode": "notebooklm-ingest",
  "snapshot": {
    "exportRef": "opaque-or-hash",
    "snippetDigest": "sha256-hex-optional"
  },
  "provenance": { "phase": "STABLE", "readoutDegraded": false },
  "fingerprint": "sha256-hex-64",
  "emittedAt": 0
}
```

---

## Castle node graph (konumlandırma)

**Observation Layer = truth production** (mühürlü gözlem olayları). **Castle Node Layer = truth projection** (tüketici / görünüm yüzeyi; yeni gerçeklik üretimi değil). Node graph **instantiate** edilene kadar katman **hazır, boş** kalabilir.

Registry + taxonomy oturduktan sonra düğümler **observation ledger** okur; frozen çekirdek artifact’tan **yönetilmez**.

---

## İlgili

- [`OBSERVATION_EVENT_REGISTRY.md`](OBSERVATION_EVENT_REGISTRY.md)  
- [`EXTERNAL_OBSERVER_REGISTRY.md`](EXTERNAL_OBSERVER_REGISTRY.md)  
- [`BOOT_ARTIFACT_PROTOCOL.md`](BOOT_ARTIFACT_PROTOCOL.md)  
- [`docs/academic/SESSION_LOG.md`](academic/SESSION_LOG.md)
