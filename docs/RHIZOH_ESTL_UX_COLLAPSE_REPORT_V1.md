# Rhizoh — ESTL-Driven UX Collapse Report (V1)

**Rol:** [ESTL-1](RHIZOH_EXPERIENCE_STRESS_TEST_LAYER_ESTL1.md) seanslarından türetilen **ürün artefaktı** — gerçek kullanıcı akışında **nerede kopma**, **nerede sıkılma**, **nerede bırakma** olduğunu tek raporda toplar. Amaç yeni özellik listesi değil: **redundancy azaltma** + **yüzey sadeleştirme** ([FREEZE-0 UI collapse](RHIZOH_FREEZE_0.md)).

**Stratejik çerçeve:** Çekirdek zaten çok güçlü; asıl risk artık “eksik yetenek” değil — **fazla sistem hissi** (panel, mod, jargon, çift merkez, tekrarlayan yollar). Rapor, **nerenin kesileceğini** ve **nerenin birleştirileceğini** gösterir.

**Normatif üst belgeler:** [ESTL-1](RHIZOH_EXPERIENCE_STRESS_TEST_LAYER_ESTL1.md) · [Implementation Map](RHIZOH_IMPLEMENTATION_MAP.md) · [Companion-first UX state machine](RHIZOH_COMPANION_FIRST_UX_STATE_MACHINE_V1.md)

**Durum:** `NORMATIVE_TARGET` — her rapor `ESTL-CR-YYYY-MM-DD` gibi sürümlenebilir; bu belge **şablon + rubric**.

---

## 1. Ne değildir

| Bu rapor değil | Nedeni |
|----------------|--------|
| Bug triage | Teknik regresyon ayrı kanal. |
| Feature backlog | “Bir şey daha” üretmez; **çıkarma** öncelikli. |
| Anket özeti | ESTL **davranış ve his** odaklıdır; NPS tek başına yetmez. |

---

## 2. Girdi: ESTL seansları

Her rapor en az şunlara dayanır ([ESTL-1 §4](RHIZOH_EXPERIENCE_STRESS_TEST_LAYER_ESTL1.md)):

- Cold open  
- Companion ↔ Observe döngüsü  
- Spine maratonu (Companion → Chronicle → Observe → Companion)  
- (İsteğe bağlı) Yorgunluk seansı  

Facilitator notları: zaman damgası, Flow/Magic skoru, **kullanıcı alıntısı** (PII’siz).

---

## 3. Spine başına “collapse” haritası (zorunlu bölümler)

Her yüzey için aynı iskelet — **tek duygusal merkez** ihlali özellikle aranır.

### 3.1 Companion — **nerede düşüyor?**

| Soru | Kayıt alanı |
|------|-------------|
| İlk 30 sn’de mi, 2–3 dk’da mı kopma? | Süre bandı |
| Ton / hız / metin yoğunluğu mu, güven mi kırıldı? | Tetik sınıfı |
| “Tekrar sorma”, “unuttum hissi”, “robot hissi” var mı? | Kalite sinyali |
| Studio / kernel / ayar sızdı mı? | FREEZE-0 ihlali (evet/hayır) |

**Çıktı:** En fazla **3** “kesilmesi gereken” öğe (panel, kopya, ek adım, vb.).

### 3.2 Observe — **nerede sıkılıyor / bunaltılıyor?**

| Soru | Kayıt alanı |
|------|-------------|
| Açılışta mı, 1–2 dk sonra mı ağırlık? | [OWIS-1](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md) faz hizası (tahmini, kullanıcıya söylemeden) |
| “Harita var ama anlam yok” / attention collapse? | Evet/hayır |
| Telemetry / legend / çok katman aynı anda mı? | W3+ erken mi |
| Companion’a dönüş zor mu? | Spine geri dönüş |

**Çıktı:** En fazla **3** yoğunluk veya sıra düzeltmesi (gizle, geciktir, birleştir).

### 3.3 Chronicle — **nerede bırakıyor?**

| Soru | Kayıt alanı |
|------|-------------|
| Okuma akışı kırıldı mı (zaman çizgisi kopuk)? | Evet/hayır |
| “Bu benim hikâyem değil” / gürültü mü? | Kalite sinyali |
| Observe / Companion ile anlam köprüsü yok mu? | Süreklilik |
| Tek seferde çok olay / çok meta mı? | Bilişsel yük |

**Çıktı:** En fazla **3** süreklilik veya sadeleştirme aksiyonu.

---

## 4. Özet tablolar (rapora yapıştır)

### 4.1 Kopma özeti

| Yüzey | Kopma bandı | Ana tetik | Önerilen aksiyon türü |
|-------|----------------|------------|------------------------|
| Companion | | | Kaldır / birleştir / gizle |
| Observe | | | OWIS sırası / max-2 / TCS |
| Chronicle | | | Birleştir / tek hat |

### 4.2 Redundancy (tekrar) avı

| Gözlem | Ekran A | Ekran B | Öneri |
|---------|---------|---------|--------|
| Aynı bilgi iki yerde | | | Tek kaynakta tut |
| Aynı “güç” iki nav’da | | | Birincil yol seç |

---

## 5. Rubric: aksiyon önceliği

| Öncelik | Koşul |
|---------|--------|
| **P0** | Kopuyor + Magic kırılmış ([ESTL-1 §5](RHIZOH_EXPERIENCE_STRESS_TEST_LAYER_ESTL1.md)) |
| **P1** | FREEZE-0 çift merkez veya fazla sistem hissi |
| **P2** | Sıkılma / uzun süre nötr akış |
| **P3** | İnce cilâ (kopya, mikro gecikme) |

---

## 6. Rapor teslimi (tek sayfa öz)

- **Başlık:** ESTL-Driven UX Collapse Report — tarih, seans sayısı, katılımcı profili (non-technical / power user).  
- **Üç blok özet:** Companion / Observe / Chronicle — her biri **3 madde**den fazla olmasın (keskinlik).  
- **Birleşik karar:** “Sonraki sprintte **kesinlikle çıkacak**” 1–5 madde.

**Sonraki adım (icra):** Rapor onaylandıktan sonra [ESTL-Driven UI Collapse Optimization](RHIZOH_ESTL_UI_COLLAPSE_OPTIMIZATION_V1.md) — spine başına **tek** kesim: Companion’da **1 silinen ekran**, Observe’da **1 birleşen katman**, Chronicle’da **1 sadeleşen akış** (bir tur). Merge ile kapanış: [ESTL-OPT UI Diff Viewer](RHIZOH_ESTL_OPT_UI_DIFF_VIEWER_V1.md) — hangi panel gitti, ne kaybedildi, **CL** algı etiketi (önce→sonra). Döngü özeti: [Algı ekonomisi](RHIZOH_PERCEPTION_ECONOMY_AND_ESTL_LOOP_V1.md). Canlı kanıt: [ESTL Full-Cycle Live Session](RHIZOH_ESTL_FULL_CYCLE_LIVE_SESSION_V1.md).

---

## 7. İlişkili belgeler

- [Experience Stress Test Layer ESTL-1](RHIZOH_EXPERIENCE_STRESS_TEST_LAYER_ESTL1.md)  
- [Implementation Map](RHIZOH_IMPLEMENTATION_MAP.md)  
- [ESTL UI Collapse Optimization V1](RHIZOH_ESTL_UI_COLLAPSE_OPTIMIZATION_V1.md)  
- [ESTL-OPT UI Diff Viewer V1](RHIZOH_ESTL_OPT_UI_DIFF_VIEWER_V1.md)  
- [TCS-1](RHIZOH_TRANSITION_CHOREOGRAPHY_SPEC_TCS1.md) · [OWIS-1](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md)  

---

*ESTL-Driven UX Collapse Report V1 — kopma / sıkılma / bırakma; redundancy azaltma; yüzey sadeleştirme.*
