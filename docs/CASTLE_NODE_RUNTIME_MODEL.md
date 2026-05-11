# Castle Node — Runtime Model (Strategic Primitive)

**Rol:** Castle’ı “workspace” değil **[persistent epistemic environment](RHIZOH_FREEZE_0.md)** (FREEZE-0 §4) olarak bağlayan **çalışma zamanı sözleşmesi** — gelecekte family / team / robotics / enterprise yüzeylerinin hepsi bu primitive üzerinde birleşir.

**Durum:** `NORMATIVE_TARGET` — implementasyon fazlı; bu belge **şekil + karar alanları** bağlar.  
**İlişkili:** [Reference User Journey](RHIZOH_COMPANION_REFERENCE_JOURNEY.md) · [FREEZE-0](RHIZOH_FREEZE_0.md) · [Product phases — Phase C](RHIZOH_PRODUCT_PHASES_A_THROUGH_E.md)

---

## 1. Kimlik ve sınır

| Kavram | Soru |
|--------|------|
| **Node identity** | Bu Castle dünyada kim? (kişi, aile, takım, org kökü). |
| **Tenant vs node** | Bir org altında birden çok Castle; inheritance kuralları. |
| **Device federation** | Aynı node’a bağlı cihazlar; birincil / ikincil rol. |

---

## 2. Bellek topolojisi

| Kavram | Soru |
|--------|------|
| **Local vs cloud memory** | Ne cihazda kalır, ne senkronize edilir, şifreleme. |
| **Chronicle retention** | Süre, arşiv, silme politikası (kullanıcı + yasal). |
| **Compaction / summarization** | Uzun ufuk maliyet; kullanıcıya “kayboldu” hissi yok ([Personality](RHIZOH_COMPANION_PERSONALITY_STABILITY.md)). |

---

## 3. İzinler ve miras

| Kavram | Soru |
|--------|------|
| **Permissions** | Kim Chronicle yazar, kim yalnız okur, kim node’u kapatır. |
| **Family / team inheritance** | Çocuk hesabı, davet, devretme, miras kilidi. |
| **Shared vs private edges** | Ortak timeline parçası ile kişisel Space ayrımı. |

---

## 4. Davranış ve köprüler

| Kavram | Soru |
|--------|------|
| **Offline behavior** | Kuyruk, çatışma çözümü, “sonra birleş” semantiği ([FREEZE-0](RHIZOH_FREEZE_0.md)). |
| **Event model** | Hangi olaylar Chronicle’a düşer, hangileri yalnız telemetry. |
| **Robotics bridge** | Aşamalı; önce spatial / oda düzlemi, sonra embodied ([framing §3](RHIZOH_CASTLE_CIVILIZATION_FRAMING.md)). |

---

## 5. Ürün yüzeyleri ile eşleme

| Şablon (örnek) | Runtime vurgusu |
|----------------|-----------------|
| Family castle | İzin + retention + ortak chronicle. |
| Research castle | Kaynak şahitliği, atıf hattı, export. |
| Studio castle | Workflow + graph; org cognition ([FREEZE-0 §6](RHIZOH_FREEZE_0.md)). |
| Company castle | SSO, audit yüzeyi, enterprise dil ([enterprise doc](RHIZOH_EPISTEMIC_INFRASTRUCTURE_ENTERPRISE.md)). |

---

## 6. Repo notu

Teknik detaylar ileride: şema (`packages/protocol` / Firestore), gateway oturumu, client state makinesi — bu belge **ürün-mimari omurga**dır; API sözleşmeleri Phase A altında ayrıca dondurulur.
