# NotebookLM — Rhizoh epistemic codex register

**Amaç:** NotebookLM’e (veya benzeri not defteri RAG) yüklenecek **kaynak manifesti** — “Rhizoh Codex” hafızası ile hizalı, tek giriş noktası.  
**Artifact:** Planned **NLOA** (NotebookLM Observation Artifact) ingest — [`ARTIFACT_FAMILY_TAXONOMY.md`](ARTIFACT_FAMILY_TAXONOMY.md), [`EXTERNAL_OBSERVER_REGISTRY.md`](EXTERNAL_OBSERVER_REGISTRY.md).

**İnsan sınırı:** Bu mimaride “observer” **sistem içi veri kaynakları**dır; **kullanıcıları izleme** tanımı yok — [`EXTERNAL_OBSERVER_REGISTRY.md`](EXTERNAL_OBSERVER_REGISTRY.md), [`MODEL_ECOLOGY.md`](MODEL_ECOLOGY.md).

---

## Notebook’a eklenecek sıra (öneri)

### Tier A — Epistemik çekirdek (önce bunlar)

| # | Repo yolu | Konu |
|---|-----------|------|
| 1 | [`OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md) | Gözlem katmanı, execution ayrımı; üç yüzey sözlüğü: [`EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md`](EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md) |
| 2 | [`BOOT_ARTIFACT_PROTOCOL.md`](BOOT_ARTIFACT_PROTOCOL.md) | ABOA, invariant’lar, append-only ledger |
| 3 | [`FIRST_TOUCH_PROTOCOL.md`](FIRST_TOUCH_PROTOCOL.md) | İlk temas protokolü |
| 4 | [`WELCOME_RHIZOH.md`](WELCOME_RHIZOH.md) | Canonical first-touch metin |
| 5 | [`OBSERVATION_EVENT_REGISTRY.md`](OBSERVATION_EVENT_REGISTRY.md) | Olay taksonomisi (boot = #1) |
| 6 | [`ARTIFACT_FAMILY_TAXONOMY.md`](ARTIFACT_FAMILY_TAXONOMY.md) | ABOA, ASAA, AFOA, AOJA, APEA, GOOA, NLOA |
| 7 | [`EXTERNAL_OBSERVER_REGISTRY.md`](EXTERNAL_OBSERVER_REGISTRY.md) | Harici gözlemci / adapter |
| 8 | [`MODEL_ECOLOGY.md`](MODEL_ECOLOGY.md) | Observer species, model rolleri |
| 9 | [`ROBOTICS_EPISTEMIC_FREEZE.md`](ROBOTICS_EPISTEMIC_FREEZE.md) | Robotics = execution, not truth |
| 10 | [`AGENT_IDENTITY_AND_ATTRIBUTION.md`](AGENT_IDENTITY_AND_ATTRIBUTION.md) | Attribution = provenance |
| 11 | [`WORLDSTATE_V0_SPEC.md`](WORLDSTATE_V0_SPEC.md) | Snapshot / replay sözleşmesi |
| 12 | [`docs/schemas/worldstate-v0.schema.json`](schemas/worldstate-v0.schema.json) | WorldState şema |

### Tier B — Oturum / araç / habitat

| # | Repo yolu | Konu |
|---|-----------|------|
| 13 | [`academic/SESSION_LOG.md`](academic/SESSION_LOG.md) | Ledger şablonu, Boot Observation Event |
| 14 | [`CURSOR_AGENT_INTRO.md`](CURSOR_AGENT_INTRO.md) | Cursor Agent (Castle) rolü |
| 15 | [`LAYER_EXPANSION_PROTOCOL.md`](LAYER_EXPANSION_PROTOCOL.md) | Genişleme kuralları |
| 16 | [`ARCHITECTURE_POST_FREEZE_SUMMARY.md`](ARCHITECTURE_POST_FREEZE_SUMMARY.md) | Post-freeze özet |
| 17 | [`CONTEXT_RECONSTRUCTION_PROMPT.md`](CONTEXT_RECONSTRUCTION_PROMPT.md) | Çok-agent bağlam |
| 18 | [`HABITAT_COLLABORATION_ACADEMIC.md`](HABITAT_COLLABORATION_ACADEMIC.md) | Academic habitat |

### Tier C — Ürün / operasyon (isteğe bağlı)

[`RHIZOH_KERNEL_VNEXT529.md`](RHIZOH_KERNEL_VNEXT529.md) · [`RHIZOH_SPINE_MVP.md`](RHIZOH_SPINE_MVP.md) · [`RHIZOH_PROOF_OPERATING_SYSTEM_ROADMAP.md`](RHIZOH_PROOF_OPERATING_SYSTEM_ROADMAP.md) · [`RHIZOH_ENTERPRISE_ARCHITECTURE_V1.md`](RHIZOH_ENTERPRISE_ARCHITECTURE_V1.md) — ihtiyaca göre.

---

## Çoklu format (NotebookLM)

- **Metin:** Yukarıdaki `.md` dosyalarını export veya doğrudan yükleme.  
- **Ses:** Örn. `Kendi_Yalanına_İnanmayan_Yapay_Zeka_Rhizoh.m4a` — **kaynak olarak** eklenir; transcript üretilirse NLOA digest ile hizalanabilir.  
- **Video:** Aşağıdaki script ile üretilen `.mp4` ayrıca kaynak olarak eklenebilir.

---

## 2026-05-09 — Media Reference

Title:
- Rhizoh y la arquitectura de la realidad

Pointer:
- `local://Rhizoh_y_la_arquitectura_de_la_realidad.m4a`

ImportedAt:
- `2026-05-09T09:41:34+03:00`

Optional digest:
- `sha256:<pending>`

Related docs:
- [`MEDIA_OBSERVER_BRIDGE.md`](MEDIA_OBSERVER_BRIDGE.md) (MOP-1)

Notes:
- External media asset
- Non-authoritative pointer
- NotebookLM indexing candidate

---

## Kısa sözlük (Notebook soruları için)

| Terim | Anlam |
|-------|--------|
| ABOA | Attested Boot Observation Artifact — boot mührü |
| APEA | Attested Provenance Event Artifact |
| schemaVersion | Wire şema (örn. ABOA-1) |
| version | Semantic seal (örn. v1.2.1) |
| Provenance | Köken metadata; primary anlamını belirlemez |
| Append-only | Düzeltme = yeni artifact; eski mutate edilmez |
| External observer | Veri kaynağı; execution otoritesi değil |
| Frozen core | Execution DAG; observation ile karışmaz |

---

## Ses → video (yerel)

Repo: [`scripts/rhizoh-mux-audio-to-video.ps1`](../scripts/rhizoh-mux-audio-to-video.ps1). **ffmpeg** gerekir (`winget install Gyan.FFmpeg` veya [ffmpeg.org](https://ffmpeg.org/download.html)).

---

## Bu dosyanın güncellenmesi

Yeni epistemik belge eklendiğinde **Tier A/B** tablolarına satır ekleyin; NotebookLM’de kaynak listesini yenileyin.

---

*Register v1 — Rhizoh epistemic codex ↔ NotebookLM source manifest.*
