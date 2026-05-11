# Rhizoh — ESTL Full-Cycle Live Session (V1)

**Rol:** Bu katman **mimari spec değil**, **dokümantasyon değil**, klasik **sistem testi değil** — **ürün gerçeği**: en az **bir** gerçek kullanıcı ile, **10 dakika** içinde spine tam döngüsü ([ESTL-1](RHIZOH_EXPERIENCE_STRESS_TEST_LAYER_ESTL1.md) + [ESTL-CR](RHIZOH_ESTL_UX_COLLAPSE_REPORT_V1.md) girdisi üretir).

**Normatif üst belgeler:** [ESTL-1](RHIZOH_EXPERIENCE_STRESS_TEST_LAYER_ESTL1.md) · [Companion-first UX state machine](RHIZOH_COMPANION_FIRST_UX_STATE_MACHINE_V1.md) · [TCS-1](RHIZOH_TRANSITION_CHOREOGRAPHY_SPEC_TCS1.md) · [OWIS-1](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md)

**Durum:** `NORMATIVE_TARGET` — oturum `ESTL-LIVE-YYYY-MM-DD-P###`

---

## 1. Önkoşul

- Build **production’a yakın** (staging veya prod feature flag).  
- Kullanıcı **içeriden değil** — mümkünse hedef persona (teknik olmayan).  
- Facilitator: konuşmayı minimize eder; **izler**, not alır ([ESTL-1 §6](RHIZOH_EXPERIENCE_STRESS_TEST_LAYER_ESTL1.md)).

---

## 2. Yasaklar (oturumu bozar)

- TCS / OWIS / W0 / Drift gibi **iç isimleri** kullanıcıya söylemek.  
- “Şimdi Observe’a geçelim” yerine: “Haritaya bakalım” gibi **doğal dil**.  
- Aynı anda birden fazla görev vermek.

---

## 3. On dakikalık akış (script iskelesi)

Süre üst sınır **~10 dk**; gerekirse Chronicle kısaltılır.

| Dakika | Yüzey | Facilitator (sessiz rehber) | Gözlem notu |
|--------|--------|------------------------------|---------------|
| **0:00–2:00** | **Companion** | “Burada Rhizoh ile tanışıyorsun; günlükte sana ne işe yarardı, bir cümle söyle — sonra yaz.” | İlk kopma? Ton? |
| **2:00–5:00** | **Companion → Observe** | “Şimdi bulunduğun dünyaya bakmak istersen, nasıl yapardın?” (kullanıcı kendi bulsun) | TCS hissi; meta “load” var mı? |
| **5:00–7:30** | **Observe** | “Bu ekranda tek bir şeye odaklan: şu an en çok ne dikkatini çekiyor?” | OWIS / max-2; sıkılma? |
| **7:30–9:00** | **Chronicle** | “Geçmişe baktığında burada ne ararsın? Bir kez dene.” | Bırakma / akış kırığı? |
| **9:00–10:00** | **Companion dönüş** | “Sohbete dönmek ister misin, nasıl dönersin?” | Spine dönüş sakin mi? |

**Bitiş:** Flow / Magic skoru ([ESTL-1 §5](RHIZOH_EXPERIENCE_STRESS_TEST_LAYER_ESTL1.md)) + tek paragraf facilitator özü → **ESTL-CR** hammaddesi.

---

## 4. Üretilen artefakt

Bu oturum tek başına **ESTL-CR** veya CR’nin **“Live evidence”** eki olur; tarih + kullanıcı profili (anonim) + skorlar.

---

## 5. İlişkili belgeler

- [ESTL-1](RHIZOH_EXPERIENCE_STRESS_TEST_LAYER_ESTL1.md)  
- [ESTL-Driven UX Collapse Report](RHIZOH_ESTL_UX_COLLAPSE_REPORT_V1.md)  
- [ESTL-OPT UI Diff Viewer](RHIZOH_ESTL_OPT_UI_DIFF_VIEWER_V1.md)  

---

*ESTL Full-Cycle Live Session V1 — 10 dk; gerçek kullanıcı; ürün gerçeği.*
