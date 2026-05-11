# Observation event registry — taxonomy (draft)

**SPECFLOW:** `FUTURE-PROOF-ONLY` — **event topology** for the observation fabric; not execution routing.

Bu kayıt, gözlem olaylarının **numaralandırılmış taksonomisi**dir. Artifact **kodları** ve wire şemaları: [`ARTIFACT_FAMILY_TAXONOMY.md`](ARTIFACT_FAMILY_TAXONOMY.md). Repo defteri hizası: [`docs/academic/SESSION_LOG.md`](academic/SESSION_LOG.md) (Boot Observation Event şablonu).

**İlk olay:** Boot = **ABOA** — [`BOOT_ARTIFACT_PROTOCOL.md`](BOOT_ARTIFACT_PROTOCOL.md).

---

## Registry (v0)

| id | event | artifact family | schemaVersion | status | Not |
|----|--------|-------------------|---------------|--------|-----|
| 1 | `boot` | **ABOA** | `ABOA-1` | **active** | [`rhizohWelcomeEpistemicV1.js`](../apps/client/src/kernel/rhizohWelcomeEpistemicV1.js) |
| 2 | `session_attach` | **ASAA** | `ASAA-1` (draft) | planned | Oturum bağlama gözlem kanıtı |
| 3 | `field_shift` | **AFOA** | `AFOA-1` (draft) | planned | Alan delta mührü |
| 4 | `observer_join` | **AOJA** | `AOJA-1` (draft) | planned | Perspektif düğümü katılımı |
| 5 | `provenance_emit` | **APEA** | `APEA-1` (draft) | planned | Köken / provenance event mührü (eski APAA adı kaldırıldı) |

---

## Stabilization (quiescent phase)

Genişleme (yeni agent / yeni tüketici) bilinçli olarak bekletilebilir. Bu süreçte mevcut protokollerle **event üretimi** sürebilir; **ontology + invariant set** sabittir ([`BOOT_ARTIFACT_PROTOCOL.md`](BOOT_ARTIFACT_PROTOCOL.md) — Invariant 6 append-only). **Castle Node Layer:** READY, **not instantiated** — projection yüzeyi hazır; enjeksiyon sonrası expansion.

---

## İlişkiler

- **ABOA** = event **#1**; `schemaVersion` (wire) ≠ `version` (semantic) — [`BOOT_ARTIFACT_PROTOCOL.md`](BOOT_ARTIFACT_PROTOCOL.md).
- Yeni event: bu tablo + taxonomy’de şema + mümkünse SESSION_LOG örneği.
- Harici gözlem ingest (Maps, NotebookLM): planned id’ler ve adapter sözleşmesi — [`EXTERNAL_OBSERVER_REGISTRY.md`](EXTERNAL_OBSERVER_REGISTRY.md).

---

## İlgili

- [`ARTIFACT_FAMILY_TAXONOMY.md`](ARTIFACT_FAMILY_TAXONOMY.md)
- [`EXTERNAL_OBSERVER_REGISTRY.md`](EXTERNAL_OBSERVER_REGISTRY.md)
- [`BOOT_ARTIFACT_PROTOCOL.md`](BOOT_ARTIFACT_PROTOCOL.md)
- [`OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md)
- [`FIRST_TOUCH_PROTOCOL.md`](FIRST_TOUCH_PROTOCOL.md)
