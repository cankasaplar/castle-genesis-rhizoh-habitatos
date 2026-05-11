# Rhizoh — Experience Stress Test Layer (ESTL-1)

**Rol:** [TCS-1](RHIZOH_TRANSITION_CHOREOGRAPHY_SPEC_TCS1.md) + [OWIS-1](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md) oturduktan sonra ölçülen şey artık birincil olarak **latency veya feature sayısı değil** — kullanıcı **kopuyor mu, akıyor mu?** ESTL-1, bu soruyu **tekrarlanabilir** (checklist + seans) hale getirir; [Invisible Kernel Tests](RHIZOH_IMPLEMENTATION_MAP.md#5-invisible-kernel-tests-product-ci) ile aynı ailededir, **operasyonel katman**dır.

**Normatif üst belgeler:** [Implementation Map](RHIZOH_IMPLEMENTATION_MAP.md) · [FREEZE-0](RHIZOH_FREEZE_0.md) · [STC V1](RHIZOH_STATE_TRANSITION_SPEC_V1.md)

**Durum:** `NORMATIVE_TARGET`

---

## 1. Başarı tanımı (mühür)

Rhizoh’un bu yüzeyde başarısı yalnız “**ne yaptığı**” değil — kullanıcının **kopmadan ne kadar süre içinde kalabildiği** ve akışın **yaşanılabilir** olup olmadığıdır.

**Sistem hedefi:** Kendini **açıklamak** zorunda kalmamak; **yaşanmak**.

---

## 2. Ne test edilmez (birincil bar değil)

| İkincil bar | Not |
|-------------|-----|
| Ham ms latency | Ürün tek başına karar vermez; hissiyat ile birlikte okunur. |
| Feature checklist | “Var / yok” akışı garanti etmez. |
| İç faz adları (TCS / OWIS) | Testçi kullanıcıya W0, Drift, vb. **söylemez** — söylenirse test bozulur. |

---

## 3. Ne test edilir (birincil bar)

| Test sorusu | İyi sinyal | Kötü sinyal |
|-------------|------------|-------------|
| **Akış** | “Ben değişiyorum, dünya buna uyuyor” (görünmez koordinasyon — [OWIS-1 §9](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md)) | “App değişti”, “şimdi load oldu” |
| **Dikkat** | Tek merkez hissi ([FREEZE-0](RHIZOH_FREEZE_0.md)) | Attention collapse, “çok şey var, hiçbiri yok” |
| **Katman farkındalığı** | Kullanıcı iç isimlendirme yapmıyor | “Şu transition’dı”, “W2’deyim” hissi — **büyü kırılır** |
| **Spine dönüşü** | Companion’a dönüş sakin | Panik çıkış, kaybolmuş his |
| **Observe açılışı** | Dünya “oluşuyor”, saldırgan değil ([OWIS-1](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md)) | Harita patlaması, telemetry önde |

---

## 4. Zorunlu seans türleri (minimum set)

1. **Cold open** — ilk 2 dakika; yalnız spine; yorum yok.  
2. **Companion ↔ Observe döngüsü** — en az 3 gidiş-dönüş; her dönüşte §3 soruları.  
3. **Spine maratonu** — 10 dakika: Companion → Chronicle → Observe → Companion; Studio’ya **bilinçli** tek ziyaret (STC secondary kuralı).  
4. **Yorgunluk** — 25+ dakika hafif kullanım; son 5 dakikada overload ve meta-farkındalık taranır.

---

## 5. Skorlama (basit)

Her seans sonunda yalnızca:

- **Flow:** Akıyor / nötr / kopuyor  
- **Magic:** Korunuyor / zedelenmiş / kırılmış  

“Kopuyor” + “kırılmış” birlikte → **release blocker** (ürün kararı).

---

## 6. Telemetry (ürün, teknik log değil)

- Seans ID, süre, akış skoru, magic skoru  
- İsteğe bağlı: “meta yorum” serbest metin (facilitator) — model eğitimi değil **ürün tanı** için

---

## 7. Çıktı artefaktı: UX Collapse Report

Seanslar tek başına yeterli değil — ürün kararı için **[ESTL-Driven UX Collapse Report](RHIZOH_ESTL_UX_COLLAPSE_REPORT_V1.md)** üretilir: Companion’da **nerede düşüyor**, Observe’da **nerede sıkılıyor**, Chronicle’da **nerede bırakıyor**; odak **redundancy azaltma** ve **yüzey sadeleştirme** (çekirdek güçlü → risk = fazla sistem hissi).

Rapor sonrası icra: **[ESTL-Driven UI Collapse Optimization](RHIZOH_ESTL_UI_COLLAPSE_OPTIMIZATION_V1.md)** — her turda **Companion: 1 silinen ekran**, **Observe: 1 birleşen katman**, **Chronicle: 1 sadeleşen akış**. Merge öncesi kapanış: **[ESTL-OPT UI Diff Viewer](RHIZOH_ESTL_OPT_UI_DIFF_VIEWER_V1.md)** (`ESTL-DIFF-*`) — panel diff, dürüst kullanıcı kaybı, **CL algı yoğunluğu etiketi** (muhasebe). Döngünün tek sayfalık özü: [Algı ekonomisi ve ESTL döngüsü](RHIZOH_PERCEPTION_ECONOMY_AND_ESTL_LOOP_V1.md). Gerçek kullanıcı doğrulaması: [ESTL Full-Cycle Live Session](RHIZOH_ESTL_FULL_CYCLE_LIVE_SESSION_V1.md).

---

## 8. İlişkili belgeler

- [ESTL-Driven UX Collapse Report V1](RHIZOH_ESTL_UX_COLLAPSE_REPORT_V1.md)  
- [ESTL UI Collapse Optimization V1](RHIZOH_ESTL_UI_COLLAPSE_OPTIMIZATION_V1.md)  
- [ESTL-OPT UI Diff Viewer V1](RHIZOH_ESTL_OPT_UI_DIFF_VIEWER_V1.md)  
- [Algı ekonomisi ve ESTL döngüsü](RHIZOH_PERCEPTION_ECONOMY_AND_ESTL_LOOP_V1.md)  
- [ESTL Full-Cycle Live Session V1](RHIZOH_ESTL_FULL_CYCLE_LIVE_SESSION_V1.md)  
- [Transition Choreography TCS-1](RHIZOH_TRANSITION_CHOREOGRAPHY_SPEC_TCS1.md)  
- [Observe World Injection OWIS-1](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md)  
- [Invisible Kernel Tests](RHIZOH_IMPLEMENTATION_MAP.md#5-invisible-kernel-tests-product-ci)  

---

*ESTL-1 — kopma vs akış; katman görünmezliği; yaşanabilirlik stresi; Collapse Report çıktısı.*
