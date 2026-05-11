# Attested Boot Observation Artifact Protocol v1

**SPECFLOW:** `FUTURE-PROOF-ONLY` — **observable interpretation artifact**, execution değildir.

İlk kullanıcı teması, boot sequence’in ilk **Tasdikli Önyükleme Gözlem Artefaktı** (*Attested Boot Observation Artifact*, ABOA). Rhizoh boot’u **kanıtlar**, otorite iddia etmez.

**Kod:** `rhizohBootArtifactSeal.js` (`RHIZOH_ABOA_SCHEMA_VERSION`) · `rhizohWelcomeEpistemicV1.js` · `rhizohScenarioPhaseReadoutV1.js`.

**Event registry:** [`OBSERVATION_EVENT_REGISTRY.md`](OBSERVATION_EVENT_REGISTRY.md) — boot = event #1. **Artifact families (planned + active):** [`ARTIFACT_FAMILY_TAXONOMY.md`](ARTIFACT_FAMILY_TAXONOMY.md). **Repo ledger:** [`docs/academic/SESSION_LOG.md`](academic/SESSION_LOG.md) Boot Observation şablonu.

**İlgili:** [`FIRST_TOUCH_PROTOCOL.md`](FIRST_TOUCH_PROTOCOL.md) · [`WELCOME_RHIZOH.md`](WELCOME_RHIZOH.md) · [`OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md)

---

## `schemaVersion` vs `version`

| Alan | Anlam |
|------|--------|
| **`schemaVersion`** | Wire / artifact ailesi (`ABOA-1`, ileride `ABOA-2`, başka boot türleri). Şema evrimi burada. |
| **`version`** | Semantic seal — canonical **`primary`** metni ve ABOA anlam sözleşmesi (`RHIZOH_FIRST_TOUCH_EPISTEMIC_VERSION`, örn. `v1.2.1`). |

İkisi **birbirinin yerine kullanılmaz**.

---

## Canonical invariants

**Invariant 1 — Primary semantics**  
`primary` **semantics are immutable within a `version`**. Kişiselleştirme yalnızca açılış satırındaki isteğe bağlı isimdir.

**Invariant 2 — Provenance vs semantics**  
**Provenance may annotate artifact. Provenance may never determine artifact semantics.**

**Invariant 3 — Explicit phase + acquisition quality**  
- **`phase`:** epistemik durum — `STABLE` · `CHAOS` · `BIFURCATION` · **`UNKNOWN`**.  
- **`readoutDegraded`:** okuma kalitesi — sinyal yok / düşük güven; **`true`** iken tipik olarak `phase` ve `scenario` **`UNKNOWN`**, snapshot sıfır.  
**UNKNOWN ≠ sadece degraded:** mantıksal olarak ayrı eksenler; ikisi birlikte tutulabilir.

**Invariant 4 — Fingerprint**  
Payload: `schemaVersion`, `version`, `mode`, `primary`, **normalize** `provenance` (`emittedAt` ve `fingerprint` hariç). Kanonik sıralı anahtarlar + sayı normalizasyonu (3 ondalık).

**Invariant 5 — Attribution**  
**Attribution is provenance, never authority.**

**Invariant 6 — Append-only history (causal ledger)**  
**Artifacts are append-only records.** A correction **never mutates** a prior artifact; it **emits a new** artifact (new `emittedAt`, new `fingerprint`, explicit supersession link only if a future schema adds one). Bu, geçmişin **rewrite edilemez** olmasını ve sistemin **event-sourced epistemic ledger** (log değil **nedensel defter**) davranışını sabitler.

---

## Şema (ABOA-1, semantic `v1.2.1+`)

```json
{
  "schemaVersion": "ABOA-1",
  "version": "v1.2.1",
  "mode": "epistemic-first-touch",
  "primary": "…",
  "provenance": {
    "readoutVersion": "rhizoh-scenario-readout-v1",
    "phase": "STABLE",
    "scenario": "RHIZOH",
    "fieldSnapshot": {
      "intensity": 0.82,
      "entropy": 0.14,
      "coherence": 0.91
    },
    "driftState": null,
    "readoutDegraded": false
  },
  "fingerprint": "sha256-hex-64",
  "emittedAt": 1735689600000
}
```

- **`fieldSnapshot`:** sayısal (`number`); string `toFixed` kullanılmaz — mühür öncesi kanonik yuvarlama kodda yapılır.  
- **`driftState`:** yalnızca metadata; **`primary`’e eklenmez.**

---

## Tarihçe (semantic `version`)

- **v1.2.1** — `schemaVersion: ABOA-1`; provenance’da `readoutDegraded`; fingerprint payload’a `schemaVersion` dahil.  
- **v1.2.0** — provenance-aware ABOA; `primary` fazdan bağımsız; kanonik hash; UNKNOWN.  
- **v1.1.0 / v1.0.0** — önceki boot / seal evrimi (arşiv).

---

## Gözlemlenebilirlik

- **`bootObservationArtifact`** — canonical.  
- **`welcomeArtifact`** — aynı nesneye alias; ileride kaldırılabilir, yeni kod `bootObservationArtifact` kullanmalı.

---

## Traceability

`fingerprint` + `schemaVersion` + `version` + `provenance.phase`, [`SESSION_LOG`](academic/SESSION_LOG.md) veya iç ledger.

---

## İlgili belgeler

- [`OBSERVATION_EVENT_REGISTRY.md`](OBSERVATION_EVENT_REGISTRY.md)  
- [`ARTIFACT_FAMILY_TAXONOMY.md`](ARTIFACT_FAMILY_TAXONOMY.md)  
- [`docs/academic/SESSION_LOG.md`](academic/SESSION_LOG.md)  
- [`FIRST_TOUCH_PROTOCOL.md`](FIRST_TOUCH_PROTOCOL.md)  
- [`AGENT_IDENTITY_AND_ATTRIBUTION.md`](AGENT_IDENTITY_AND_ATTRIBUTION.md)
