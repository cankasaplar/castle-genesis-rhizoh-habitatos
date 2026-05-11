# Rhizoh model ecology — observer species (spec)

**SPECFLOW:** `FUTURE-PROOF-ONLY` — **taxonomy + design contract**, model vendor execution değildir.

Bu belgede “model” **zeka seviyesi** veya **tek egemen ajan** değil; **gözlem türü**, **hata karakteri**, **epistemik rol** ve **drift profili** ile sınıflanan bir **observer species** olarak ele alınır.

**İlgili:** [`OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md) · [`EXTERNAL_OBSERVER_REGISTRY.md`](EXTERNAL_OBSERVER_REGISTRY.md) · [`ARTIFACT_FAMILY_TAXONOMY.md`](ARTIFACT_FAMILY_TAXONOMY.md) · [`AGENT_IDENTITY_AND_ATTRIBUTION.md`](AGENT_IDENTITY_AND_ATTRIBUTION.md) · [`ROBOTICS_EPISTEMIC_FREEZE.md`](ROBOTICS_EPISTEMIC_FREEZE.md) — fiziksel execution öncesi epistemik sınır

---

## 1. Paradigma

- **AI modelleri karar mercii değildir** — çoğu zaman **çelişki, alternatif okuma veya zayıf aday** üretir; Rhizoh **çelişkiyi “çözen otorite” değil**, **çelişkinin izini mühürleyen** katmandır (append-only ledger — [`BOOT_ARTIFACT_PROTOCOL.md`](BOOT_ARTIFACT_PROTOCOL.md) Invariant 6).
- **Hedef mimari yön:** tek “AI sistemi” değil, **epistemic observatory network** — modeller **otorite** değil, **duyu organı / gözlem kanalı**.
- **Distributed epistemic authority (yumuşak):** tek modelin egemenliği **yok**; aday gerçeklikler çoklu gözlemciden gelir, **canonicalization** Rhizoh artifact + ledger ile yapılır (execution core’a yazma değil, **kayıt**).

---

## 2. Otonomi katmanları (observer species)

### A. Foundation reasoners (çekirdek yorum katmanı)

Örnek sınıflar: büyük dil modelleri (GPT / Claude / Gemini sınıfı — **ürün adı değil**, kapasite bandı).

| Özellik | Değer |
|--------|--------|
| Rol | Yorumlama, synthesis, **artifact metni / paket taslağı** (ABOA / AFOA bağlamında *katkı*) |
| Execution | **Yok** — [`OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md) |
| Epistemik rol | **Epistemic contributor**, not authority |

### B. Tool-linked models (operational / harici gözlemci)

Örnek: harita, arama, not defteri export, retrieval + embedding servisleri.

| Özellik | Değer |
|--------|--------|
| Rol | Dış dünya **snapshot**, **observation packet** |
| Bağlantı | [`EXTERNAL_OBSERVER_REGISTRY.md`](EXTERNAL_OBSERVER_REGISTRY.md) — *data sources, not execution authorities* |
| Artifact eşlemesi | Planned: **GOOA**, **NLOA**; mevcut: adapter → packet → AFOA / APEA uyumu |

### C. Specialized micro-models

Embedding, sınıflandırıcı, yönlendirme, küçük özel modeller.

| Özellik | Değer |
|--------|--------|
| Rol | “Ne görüyorum?” tam metin cevabı değil; **“bu neye benziyor?”** — imza, küme, rota |
| Drift | Genelde dar alanda ölçülebilir; profil ayrı tutulur |

### D. Orchestrator layer (model değil)

**Orchestrator ≠ tek LLM.**

| Bileşen | Rol |
|---------|-----|
| Rhizoh kernel / frozen core | Execution **sınırı** |
| Scenario / faz readout | **Gözlemlenebilir durum** (provenance — primary’i belirlemez) |
| Observation Fabric | Gözlem paketleri, mühür, registry |

Bu katman **yeni “anlam üretimi” iddiasıyla** içerik üretmez; **hangi gözlemin kayda geçerli sayıldığı** süreçte **politika + şema** ile çalışır (yine execution otoritesi değil).

---

## 3. Model seçimi için üç kriter (liste değil, değerlendirme ekseni)

1. **Observation fidelity** — çıktı ne kadar **ham / izlenebilir kaynağa bağlı**?
2. **Drift signature** — halüsinasyon / stabilite / zamanla kayma nasıl?
3. **Traceability** — aynı girdi ile yeniden üretim veya **deterministik digest** mümkün mü?

Bu kriterler **otorite puanı değil**; **risk ve ledger kalitesi** içindir.

---

## 4. Trust weighting (soft)

- Ağırlık = **gözlem güven ipucu** (triangulation, tekrar, dış snapshot ile çakışma) — **policy overwrite veya execution branch seçimi değil**.
- Tek kaynağa **mutlak güven** yok; **redundancy + provenance + append-only history** güç kaynağıdır.

---

## 5. Artifact aileleri ile eşleme (özet)

| Observer bandı | Tipik artifact rolü |
|----------------|---------------------|
| Foundation reasoner | ABOA / AFOA **içerik katkısı** (metin üretimi → sonra mühür) |
| Tool-linked external | **GOOA** / **NLOA** (planned) veya adapter üzerinden AFOA |
| Micro-model | Paket içi **imza / sınıf** alanları (şema genişlemesi ile) |
| Orchestrator | **Kayıt ve sıra** — artifact family seçimi şema ile, “model kararı” ile değil |

---

## 6. Mimari güvenlik (bilinçli red)

| Hedef | Sonuç |
|-------|--------|
| Tek “egemen AI modeli” | Sistem tekilleşir, observation redundancy zayıflar |
| Model = karar mercii | Observation layer ile frozen-core sınırı bulanıklaşır |

Rhizoh’un gücü: **çoklu gözlem + provenance + append-only tarih**.

---

## 7. Pipeline özeti

```
Reality / dış kaynaklar
  → External observers + foundation contributors (species A–C)
  → Observation packets
  → Artifact layer (ABOA / AFOA / APEA, planned GOOA / NLOA)
  → SESSION_LOG (ledger)
  → Castle node graph (projection consumer — hazır, instantiate opsiyonel)
  → Robotics (v0.1 boundary: execution-only, validated-artifact-stream — [`ROBOTICS_EPISTEMIC_FREEZE.md`](ROBOTICS_EPISTEMIC_FREEZE.md))
```

---

## 8. Sonraki somut entegrasyon (referans)

- Google Maps / short link: **GOOA** + [`EXTERNAL_OBSERVER_REGISTRY.md`](EXTERNAL_OBSERVER_REGISTRY.md)  
- NotebookLM export: **NLOA** + aynı registry  
- Kod yolu yok; şema ve adapter sözleşmesi bu belge ile hizalı tutulur.

---

*Model ecology = observer species taxonomy; Rhizoh = canonicalization of observation traces, not coronation of a single model.*
