# External observer registry — controlled epistemic interface

**SPECFLOW:** `FUTURE-PROOF-ONLY` — **observation ingress contract**, execution değildir.

Rhizoh’u “kapalı kutu”dan **controlled epistemic interface**’e taşımak, dış dünyayı **execution ortağı** değil **gözlem kaynağı** olarak bağlamaktır. Bu belge, harici üreticileri (Google Maps, NotebookLM, vb.) **ExternalObserver** + **adapter** ile modellemek için canonical çerçevedir.

**Örnek pointer (canonical değil):** [Google Maps short link](https://maps.app.goo.gl/f3D24xUJpzV2iTwW9) — [`SESSION_LOG` URL notu](academic/SESSION_LOG.md) ile aynı sınıf: **taşınabilir canonical içerik değil**, oturum / yönlendirme **pointer**’ı; mühür **export + artifact + SESSION_LOG** ile yapılır.

---

## Canonical invariant

**External observers are data sources, not execution authorities.**

| Rol | Açıklama |
|-----|----------|
| Harici sistem | **Observation input** — snapshot / export / feed |
| Rhizoh | **Truth constructor** — kanonik artifact + ledger ([`BOOT_ARTIFACT_PROTOCOL.md`](BOOT_ARTIFACT_PROTOCOL.md) Invariant 6 append-only) |
| Artifact | **Canonical truth record** (o oturumdaki mühür) |

Dış kaynak **epistemik otorite** değildir; yalnızca **okunan / içe aktarılan** veriyi besler.

---

## Observer türü (conceptual schema)

```json
{
  "id": "google_maps_feed_v0",
  "type": "external-observer",
  "source": "google-services",
  "mode": "read-only-provenance",
  "trustLevel": "external-attested",
  "emits": ["OBSERVATION_PACKET"]
}
```

- **Execution yok** — ajan karar veya çekirdek durum geçişi üretmez.
- **Çıktı:** yalnızca *okunmuş veri snapshot’u* → Rhizoh **canonical observation packet** → mevcut **ABOA / AFOA / APEA** hattı (şema uygunsa).

---

## Adapter katmanı (zorunlu)

Yanlış model: “Google’a bağlanan agent”, “NotebookLM’i kontrol eden AI”.

Doğru model: **passive external observer** + **adapter** — içe aktarılan veya push edilen veriyi artifact biçimine çevirir.

```
Google / NotebookLM / Maps export
        ↓
Observer Adapter (no execution; ingest only)
        ↓
Canonical Observation Packet
        ↓
ABOA / AFOA / APEA / planned GOOA·NLOA pipeline
        ↓
SESSION_LOG + sealed record
```

Adapter kuralları:

- **Veri “çekme” iddiası yok** — tercihen **export / upload / proxy sonucu** alır.
- **Harici oturum açmaz** — **feed / dosya / imzalı yanıt** bekler.
- **Execution yapmaz** — yalnızca **observation** üretir veya paketler.

---

## Maps short link (`goo.gl` / `maps.app.goo.gl`) — doğru modelleme

1. **Pointer olarak sakla** — `sourcePointer: "https://maps.app.goo.gl/…"`, `pointerKind: "geospatial_redirect"`.
2. **Canonical gözlem** — mümkünse kullanıcı veya araç **export** eder: etiket, koordinat (veya Place ID + çözümleme zamanı), `importedAt`, isteğe bağlı ekran görüntüsü hash’i.
3. **Mühür** — paket `AFOA` / planned **GOOA** ile; SESSION_LOG’da Event + fingerprint ([`academic/SESSION_LOG.md`](academic/SESSION_LOG.md)).

Böylece link **epistemik olarak zayıf** kalır; güç **artifact + ledger**’dadır.

---

## Entegrasyon modları (mimari)

| Mod | Açıklama | Güven / kontrol |
|-----|----------|------------------|
| **A — Manual feed** | NotebookLM / Maps → JSON veya metin export → manuel veya sürükle-bırak ingest | En yüksek kontrol |
| **B — API proxy** | Backend yalnızca “fetcher”; Rhizoh yalnızca **sonuç snapshot** görür | Ağ sınırı sizde |
| **C — Event stream** | Webhook / zamanlayıcı → paket → **AFOA** / field observation | İleri seviye; şema net olmalı |

Hepsi **observation path**; hiçbiri frozen execution core’a doğrudan yazma iddiası taşımaz.

---

## Planned artifact aileleri (aktif değil)

Tam şema: [`ARTIFACT_FAMILY_TAXONOMY.md`](ARTIFACT_FAMILY_TAXONOMY.md) içinde **GOOA** / **NLOA** taslakları.

| Kod | Ad | Kaynak örneği |
|-----|-----|----------------|
| **GOOA** | Google Observation Artifact | Maps / Places export snapshot |
| **NLOA** | NotebookLM Observation Artifact | Not defteri export snapshot |

**APEA** ile karıştırma: APEA **provenance event** zinciri; GOOA/NLOA **harici üreticiden gelen gözlem paketi** (yine provenance ile sarılır).

---

## Registry genişlemesi (planned event id’ler — taslak)

Ana tablo [`OBSERVATION_EVENT_REGISTRY.md`](OBSERVATION_EVENT_REGISTRY.md) numaralarını şimdilik değiştirmeden, sonraki sürümde eklenebilecek olaylar:

| id (taslak) | event | artifact | status |
|-------------|--------|----------|--------|
| 6 | `external_geospatial_ingest` | GOOA | planned |
| 7 | `notebooklm_ingest` | NLOA | planned |

---

## İlgili

- [`NOTEBOOKLM_REGISTER.md`](NOTEBOOKLM_REGISTER.md) — NotebookLM kaynak manifesti (NLOA hizası)  
- [`MODEL_ECOLOGY.md`](MODEL_ECOLOGY.md) — tool-linked observers bu dokümanda; foundation / micro / orchestrator ayrımı  
- [`OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md)  
- [`AGENT_IDENTITY_AND_ATTRIBUTION.md`](AGENT_IDENTITY_AND_ATTRIBUTION.md)  
- [`ARTIFACT_FAMILY_TAXONOMY.md`](ARTIFACT_FAMILY_TAXONOMY.md)  
- [`BOOT_ARTIFACT_PROTOCOL.md`](BOOT_ARTIFACT_PROTOCOL.md)
