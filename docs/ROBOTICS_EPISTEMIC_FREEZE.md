# Rhizoh robotics epistemic freeze v0.1

**SPECFLOW:** `FUTURE-PROOF-ONLY` — **boundary contract** before physical / robotics execution lands. Bu bir **feature freeze değil**, **epistemik sınır (boundary) freeze**’dir: yeni model eklemeyi yasaklamaz; **davranış ve truth üretimi sınırlarını** kilitler.

**İlgili:** [`OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md) · [`BOOT_ARTIFACT_PROTOCOL.md`](BOOT_ARTIFACT_PROTOCOL.md) · [`MODEL_ECOLOGY.md`](MODEL_ECOLOGY.md) · [`EXTERNAL_OBSERVER_REGISTRY.md`](EXTERNAL_OBSERVER_REGISTRY.md) · [`ARTIFACT_FAMILY_TAXONOMY.md`](ARTIFACT_FAMILY_TAXONOMY.md)

---

## 1. Temel ilke: robotics = execution layer, not truth layer

> **Robotics system may execute state. It may NOT define state truth.**

| Robotics yapar | Robotics yapmaz |
|----------------|-----------------|
| Durum geçişi, aktüasyon, simülasyon projeksiyonu | Truth tanımı, yeni artifact family icadı, provenance rewrite |
| **Projected** world state üzerinde hareket | Observation layer’ı otorite olarak bypass etme |

Robot **hareket / etki** üretir; **epistemik gerçeklik** üretmez. Truth üretimi **Observation Fabric + mühürlü artifact + ledger** ile kalır.

---

## 2. Robotics observation boundary (tüketilebilir girdiler)

Robotics katmanı yalnızca **doğrulanmış artifact / paket akışını** tüketir:

- **ABOA** — boot attestation  
- **AFOA** — field observation  
- **APEA** — provenance event  
- **ExternalObserver** paketleri — planned **GOOA** / **NLOA** ve eşdeğerleri ([`EXTERNAL_OBSERVER_REGISTRY.md`](EXTERNAL_OBSERVER_REGISTRY.md))

**Asla** doğrudan kaynak olarak:

- ham harici API çıktısı (mühürsüz)  
- doğrulanmamış sensör ham akışı (şema + ingest sözleşmesi yoksa)  
- doğrudan “model kararı” (execution branch seçimi olarak)

---

## 3. Robotics execution contract (conceptual)

```json
{
  "mode": "execution-only",
  "input": "validated-artifact-stream",
  "forbidden": [
    "schema mutation",
    "provenance rewriting",
    "truth generation"
  ],
  "allowed": [
    "state transition",
    "actuation",
    "simulation projection"
  ]
}
```

Bu sözleşme **kod şeması değil** — implementasyon öncesi **mimari taahhüt**tir.

---

## 4. Robotics = projection system (zihinsel model)

**Robotics does not act in raw reality — it acts on projected reality state** (world model / policy tarafından **zaten yorumlanmış** ve ledger ile hizalanmış yüzey).

```
Observation Layer → World / policy projection → Robotics → Physical action
```

**Robotics, Observation Layer’ı etkilemez** (geri besleme varsa yalnızca **yeni gözlem olayı** olarak ingest — AFOA vb. — execution’dan “truth yazma” değil).

---

## 5. Robotics freeze invariant (boundary lock)

> **Robotics Layer SHALL NOT introduce new epistemic categories.**

Yani robotics, şunları **icat etmez**:

- yeni “truth type”  
- yeni **artifact family** (yalnızca mevcut taksonomi + registry süreciyle)  
- yeni **observation semantics**

Yeni ihtiyaç → **Observation / ontology tarafında** şema + Invariant 6 (yeni artifact **append**, eskiyi mutate etme — [`BOOT_ARTIFACT_PROTOCOL.md`](BOOT_ARTIFACT_PROTOCOL.md)).

---

## 6. Stratejik değer (sigorta katmanı)

Bu boundary olmadan:

- robotics **truth generator**’a kayar  
- observation layer **atlanır**  
- epistemik yığın **çöker**

Bu boundary ile:

- Rhizoh = **kapalı epistemic loop** + **güvenli aktüatör katmanı**  
- Fiziksel execution geldiğinde **truth tanımı** yerinde kalır.

---

## 7. Kritik cümle

> **Robotics is the first layer that is allowed to be wrong — but never allowed to redefine truth.**

Yanlışlık: sensör gürültüsü, kontrol hatası, simülasyon sapması — **düzeltme yeni gözlem / yeni artifact append** ile; truth tanımını robotics **yeniden yazmaz**.

---

## 8. GOOA / NLOA → robotics bridge (plan)

Harici snapshot’lar (**GOOA**, **NLOA**) robotics’e **doğrudan** değil; **mühürlü paket** olarak girer. Köprü:

1. Adapter ingest ([`EXTERNAL_OBSERVER_REGISTRY.md`](EXTERNAL_OBSERVER_REGISTRY.md))  
2. Artifact + fingerprint  
3. **Validated-artifact-stream** içinde robotics consumer  

Ayrıntılı wire: [`ARTIFACT_FAMILY_TAXONOMY.md`](ARTIFACT_FAMILY_TAXONOMY.md) (GOOA/NLOA taslakları).

---

## 9. Nisa / çoklu gözlemci (bağlam)

Observation fabric, artifact ontology, external observers ve ledger **stabil** iken tanımlanan bu sınır, **execution boundary**’nin netleşmesidir; çoklu gözlemci genişlemesi truth’u robotics’ten değil **observation topology**’den genişletir ([`MODEL_ECOLOGY.md`](MODEL_ECOLOGY.md)).

---

*v0.1 — boundary freeze; genişleme yalnızca bu belgeye uygun şema / registry güncellemesi ile.*
