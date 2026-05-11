# Rhizoh — ESTL-Driven UI Collapse Optimization (V1)

**Rol:** Yeni spec değil — [ESTL-Driven UX Collapse Report](RHIZOH_ESTL_UX_COLLAPSE_REPORT_V1.md) çıktısından **tek sprintte uygulanabilir** yüzey kesimleri. Her turda spine başına **yalnız bir** net karar: ekleme değil, **collapse** ([FREEZE-0](RHIZOH_FREEZE_0.md)).

**Girdi:** En az bir `ESTL-CR-*` raporu + ürün sahibi onayı.

**Normatif üst belgeler:** [ESTL-1](RHIZOH_EXPERIENCE_STRESS_TEST_LAYER_ESTL1.md) · [UX Collapse Report](RHIZOH_ESTL_UX_COLLAPSE_REPORT_V1.md) · [Implementation Map](RHIZOH_IMPLEMENTATION_MAP.md)

**Durum:** `NORMATIVE_TARGET` — her optimizasyon turu `ESTL-OPT-YYYY-MM-DD` ile arşivlenir.

---

## 1. Üç zorunlu soru (tur başına cevap)

| # | Yüzey | Soru (tam olarak) | Çıktı türü |
|---|--------|-------------------|------------|
| **1** | **Companion** | **Hangi 1 ekran / panel / mod silinmeli?** | Kaldırma veya tamamen başka yüzeye taşıma (ikinci halka). |
| **2** | **Observe** | **Hangi 1 katman birleştirilmeli** (veya W3+’e ertelenmeli)? | İki görsel iddiayı tek iddiada birleştirme veya OWIS sırasında kaydırma ([OWIS-1](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md)). |
| **3** | **Chronicle** | **Hangi 1 akış sadeleşmeli?** | Adım sayısı, dallanma veya paralel hat birleştirme — tek “hafıza hattı”. |

**Kural:** Bir turda **en fazla üç** madde (biri spine başına). Dördüncü madde → sonraki tur; aksi halde “fazla sistem hissi” geri gelir.

---

## 2. Tanımlar (aynı kelimeyi herkes için)

| Terim | Anlam |
|-------|--------|
| **Ekran (Companion)** | Tam sayfa, tam yük drawer veya kalıcı “ikinci merkez” hissi veren panel — tek seferde **bir** silme adayı seçilir. |
| **Katman (Observe)** | Harita üzerinde veya Observe kabuğunda aynı anda rekabet eden birincil görsel iddia; [max-2](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md) ihlalini düzeltmek için **bir** birleştirme. |
| **Akış (Chronicle)** | Kullanıcının olayı anlamak için izlediği adım zinciri; **bir** sadeleştirme = bir dallanmayı kapatmak veya iki yolu tek yola indirmek. |

---

## 3. Seçim kriteri (hangi “bir” önce?)

[Collapse Report §5 rubric](RHIZOH_ESTL_UX_COLLAPSE_REPORT_V1.md) ile hizala:

1. **P0** — Kopma + Magic kırılmış doğrudan dokunan öğe.  
2. **P1** — FREEZE-0 çift merkez veya kernel/Studio sızdırması.  
3. **P2** — Sıkılma / nötr uzama.  

Aynı öncelikte iki aday varsa: **kullanıcı alıntısı** veya en kısa **süre bandında** kopma kazanır.

---

## 4. Tur şablonu (kopyala-yapıştır)

```text
ESTL-OPT-YYYY-MM-DD
Kaynak rapor: ESTL-CR-…

1) Companion — silinecek 1 ekran/panel:
   - Adı / route veya bileşen:
   - Gerekçe (rapor satırı):
   - DoD: kullanıcı bu yüzeyde artık göremez / erişemez (veya yalnız second ring’de).

2) Observe — birleştirilecek veya ertelenecek 1 katman:
   - Katman A + Katman B → sonuç:
   - OWIS faz etkisi (W0–W3+):
   - DoD: ilk 3 s içinde max-2 ihlali yok.

3) Chronicle — sadeleştirilecek 1 akış:
   - Eski akış özü:
   - Yeni akış özü:
   - DoD: bir adım veya bir paralel hat kaldırıldı.

4) Kapanış: [ESTL-DIFF](RHIZOH_ESTL_OPT_UI_DIFF_VIEWER_V1.md) — A/B/C + CL önce→sonra (merge ile).
```

---

## 5. Reddedilenler

- “Bu turda sadece küçük kopya düzeltmesi” — tur boşa; kopya **P3**’te ayrı.  
- “Companion’da iki panel birden” — **§1 kuralı** ihlali.  
- Rapor yokken optimizasyon — [ESTL-CR](RHIZOH_ESTL_UX_COLLAPSE_REPORT_V1.md) zorunlu.

---

## 6. Kapanış (zorunlu): ESTL-OPT UI Diff Viewer

Kod merge öncesi/sonrası **[ESTL-OPT Driven UI Diff Viewer](RHIZOH_ESTL_OPT_UI_DIFF_VIEWER_V1.md)** doldurulur (`ESTL-DIFF-*`): **hangi panel kaldırıldı**, **kullanıcı ne kaybetti**, **CL algı yoğunluğu etiketi** (önce→sonra, §3). OPT turu DIFF olmadan **kapanmış sayılmaz** ([Algı ekonomisi](RHIZOH_PERCEPTION_ECONOMY_AND_ESTL_LOOP_V1.md)).

---

## 7. İlişkili belgeler

- [ESTL-OPT UI Diff Viewer V1](RHIZOH_ESTL_OPT_UI_DIFF_VIEWER_V1.md)  
- [Algı ekonomisi ve ESTL döngüsü](RHIZOH_PERCEPTION_ECONOMY_AND_ESTL_LOOP_V1.md)  
- [ESTL Full-Cycle Live Session V1](RHIZOH_ESTL_FULL_CYCLE_LIVE_SESSION_V1.md)  
- [ESTL-Driven UX Collapse Report V1](RHIZOH_ESTL_UX_COLLAPSE_REPORT_V1.md)  
- [Experience Stress Test Layer ESTL-1](RHIZOH_EXPERIENCE_STRESS_TEST_LAYER_ESTL1.md)  
- [Companion-first UX state machine](RHIZOH_COMPANION_FIRST_UX_STATE_MACHINE_V1.md)  

---

*ESTL UI Collapse Optimization V1 — spine başına tek kesim; DIFF ile kapanış.*
