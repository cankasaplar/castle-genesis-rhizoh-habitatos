# RHIZOH Legal & Privacy Information Pack v1.0 (DRAFT)

**Rhizoh Systems — Legal Review Document**

| Alan | Değer |
|------|--------|
| **Durum** | Taslak (Attorney Review) |
| **Tarih** | 2026-05-19 |
| **İşletmeci** | Can Kasaplar |
| **İletişim** | cankasaplar@gmail.com |
| **KVKK başvuru** | cankasaplar@gmail.com |

> **Nihai yasal metin değildir.** Yayımlanacak sözleşmeler: [`RHIZOH_TERMS_OF_SERVICE_TR_V0.1.md`](RHIZOH_TERMS_OF_SERVICE_TR_V0.1.md) · [`RHIZOH_PRIVACY_KVKK_TR_V0.1.md`](RHIZOH_PRIVACY_KVKK_TR_V0.1.md)

---

## 1. Proje tanımı (non-technical summary)

Rhizoh, kullanıcıların yapay zeka destekli içerik üretimi, analiz ve etkileşim gerçekleştirebildiği bir **yazılım platformudur**.

Sistem;

- kullanıcı girdilerini işler,
- yapay zeka ile içerik üretir,
- bu içerikleri kullanıcıya sunar,
- tüm işlemleri loglar ve denetlenebilir şekilde saklar.

Rhizoh bir **“karar verici sistem” değildir**. Kullanıcıların üretim yaptığı bir **dijital altyapı** sağlar. Fiziksel hizmet sunmaz.

---

## 2. Sistemin hukuki statüsü

Rhizoh;

- içerik **üreticisi / yayıncısı değil**, teknolojik **altyapı sağlayıcısıdır** (SaaS / infrastructure provider),
- kullanıcıların oluşturduğu içeriklerin **sahibi değildir** (sahiplik kullanıcıdadır — bkz. § 9),
- otomatik içerik üretimini **yardımcı araç** olarak sağlar.

Sistem hiçbir durumda;

- hukuki danışmanlık vermez,
- tıbbi / finansal / resmi karar üretmez,
- kullanıcı adına karar almaz.

**Teknik ek (sözleşme eki / ToS):** Yapay zekâ anlatı katmanı (L4), çekirdek yürütme durumunu (L1) tek başına değiştirmez — *Gözlem ≠ Yürütme*.

---

## 3. Sorumluluk modeli

### 3.1 Kullanıcı sorumluluğu

Kullanıcılar;

- ürettikleri içerikten,
- yaptıkları işlemlerden,
- paylaştıkları verilerden

**tek başına sorumludur.**

Bağımsız **egemen düğüm** (sovereign node) işletmecileri, kendi kurulumlarındaki veri ve işlemlerden sorumludur.

### 3.2 Platform sorumluluğu

Rhizoh;

- altyapı sağlar,
- log tutar,
- teknik işlem gerçekleştirir,

ancak kullanıcı davranışlarını **“kontrol eden taraf” değildir** ve kullanıcı içeriğinin doğruluğunu veya yasal uygunluğunu garanti etmez.

---

## 4. Veri ve gizlilik (GDPR / KVKK uyumu)

Rhizoh veri mimarisi;

- append-only log sistemi kullanır,
- sistem olayları değiştirilemez şekilde kayıt altına alınır,
- kullanıcı verileri işlenirken **şeffaflık** ilkesi uygulanır.

**Veri ilkeleri (hedef):**

- minimum veri toplama,
- açık rıza (gerektiğinde),
- silme / anonimleştirme talep hakkı (yasal saklama ve bütünlük istisnaları saklı),
- veri taşınabilirliği (GDPR kapsamında, teknik ve hukuki sınırlar dahilinde).

Ayrıntı: [`RHIZOH_PRIVACY_KVKK_TR_V0.1.md`](RHIZOH_PRIVACY_KVKK_TR_V0.1.md) · Checklist: [`KVKK_COMPLIANCE_CHECKLIST_V0.1.md`](KVKK_COMPLIANCE_CHECKLIST_V0.1.md) · [`GDPR_COMPLIANCE_CHECKLIST_V0.1.md`](GDPR_COMPLIANCE_CHECKLIST_V0.1.md)

---

## 5. Log ve denetlenebilirlik

Sistem;

- tüm işlemleri **zaman damgalı** olarak kaydeder,
- geriye dönük **değiştirilemez** kayıt yapısı kullanır,
- denetim için **yeniden üretilebilir** teknik çıktı üretebilir (ör. §6 audit bundle — mühendislik kanıtı, kullanıcıya otomatik hukuki garanti değildir).

Bu yapı;

- güvenlik,
- hukuki denetlenebilirlik,
- sistem bütünlüğü

için tasarlanmıştır.

**Örnek resmi ifade:** “Durum geçişleri, veri bütünlüğü ve adli denetlenebilirlik amacıyla kriptografik zaman damgalarıyla değiştirilemez bir denetim günlüğünde saklanabilir.”

---

## 6. Yapay zeka sistem davranışı

Rhizoh yapay zekâ modülleri (ör. Lab AI, Companion);

- **yardımcı üretim aracıdır**,
- kullanıcı girdilerine göre içerik üretir,
- ürettiği içerikler **“gerçek beyan” veya bağlayıcı hakikat değildir**.

**Kritik ilke:** Yapay zekâ çıktıları, bağlayıcı gerçeklik beyanı değildir; kullanıcı tarafından doğrulanmalıdır.

---

## 7. Yasaklı yorumlar ve sınırlar

Sistem;

- hukuki garanti vermez,
- “kesin doğruluk” iddiasında bulunmaz,
- kullanıcı adına işlem yapmaz (otomatik yürütme yetkisi iddiası yoktur).

---

## 8. Teknik not (avukat için özet — hukuki iddia değil)

| Özellik | Açıklama |
|---------|----------|
| Mimari | Olay güdümlü (event-driven) bileşenler |
| Log | Append-only bütünlük mantığı |
| Yapay zekâ katmanı | Yürütme (execution) katmanı değil |
| Gözlem | Yorum / log katmanı ayrı tutulur |

Tam teknik özet (hukuki metin değil): [`RHIZOH_TECHNICAL_ARCHITECTURE_SUMMARY_NON_LEGAL_V1.0.md`](RHIZOH_TECHNICAL_ARCHITECTURE_SUMMARY_NON_LEGAL_V1.0.md)

---

## 9. Veri sahipliği

- **Kullanıcılar** kendi içeriklerinin sahibidir.
- **Platform** yalnızca teknik aracıdır.
- Veriler, kullanıcı kontrolünde ve sözleşmede belirtilen sınırlar içinde işlenir.

---

## 10. Son not

Bu doküman;

- hukuki inceleme amacıyla hazırlanmıştır,
- teknik detayları minimal düzeyde içerir,
- **nihai yasal metin değildir**.

Avukat onayı sonrası: placeholder doldurma → ToS/KVKK yürürlük → `node scripts/seal-legal-reality-spec.mjs` → SESSION_LOG.

---

## Ekler (referans)

| Ek | Dosya |
|----|--------|
| A | [`LEGAL_REALITY_SPEC_V0.1.md`](../LEGAL_REALITY_SPEC_V0.1.md) — iç hizalama |
| B | [`KVKK_COMPLIANCE_CHECKLIST_V0.1.md`](KVKK_COMPLIANCE_CHECKLIST_V0.1.md) |
| C | [`GDPR_COMPLIANCE_CHECKLIST_V0.1.md`](GDPR_COMPLIANCE_CHECKLIST_V0.1.md) |
| D | [`COUNSEL_EMAIL_TEMPLATE_V1.0.md`](COUNSEL_EMAIL_TEMPLATE_V1.0.md) — iletişim taslağı |

**Spec mühürü (v0.1):** `legal_reality_spec_sha256` = `5dbeb7ee93e8b3ff40be73d569f93c9cec73eee37a7a3535205d87883a885972` *(spec güncellenirse yeniden mühürlenir)*

---

*Hukuki olarak anlaşılır olmak — platformun iddiasını şeffaf ve sınırlı tutmak.*
