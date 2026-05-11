# Rhizoh — ESTL-OPT Driven UI Diff Viewer (V1)

**Rol:** Yeni spec değil — [ESTL-OPT](RHIZOH_ESTL_UI_COLLAPSE_OPTIMIZATION_V1.md) turu kod/UX’e işlendikten sonra **zorunlu kapanış artefaktı**. “Ne değişti?”yi şeffaf tutar: **hangi panel kalktı**, **kullanıcı ne kaybetti**, **bilişsel maliyet nasıl etiketlendi** (sayı değil — **algı yoğunluğu**). Bu katman **algı muhasebesi**dir ([Algı ekonomisi döngüsü](RHIZOH_PERCEPTION_ECONOMY_AND_ESTL_LOOP_V1.md)).

**Girdi:** `ESTL-OPT-YYYY-MM-DD` + ilgili PR / commit aralığı.

**Normatif üst belgeler:** [ESTL UI Collapse Optimization](RHIZOH_ESTL_UI_COLLAPSE_OPTIMIZATION_V1.md) · [UX Collapse Report](RHIZOH_ESTL_UX_COLLAPSE_REPORT_V1.md) · [FREEZE-0](RHIZOH_FREEZE_0.md) · [Algı ekonomisi](RHIZOH_PERCEPTION_ECONOMY_AND_ESTL_LOOP_V1.md)

**Durum:** `NORMATIVE_TARGET` — her kayıt `ESTL-DIFF-YYYY-MM-DD` (OPT ile aynı gün veya merge günü) ile arşivlenir.

---

## 1. Üç zorunlu sütun (diff özü)

| Sütun | Soru | Zorunlu içerik |
|-------|------|----------------|
| **A — Kaldırılan / birleştirilen** | Hangi panel, katman veya akış adımı yok oldu? | Önce: route / bileşen adı / ekran görüntüsü veya kısa liste · Sonra: “artık yok” veya “X içinde birleşti”. |
| **B — Kullanıcı kaybı** | Kullanıcı **ne kaybetti?** | Yetenek, kısayol veya bilgi yoğunluğu — **dürüst** yazılır. Varsa telafi: ikinci halka, ayar (kısa). |
| **C — Algı yoğunluğu (CL)** | Yüzey artık **hangi yük bandında**? | **CL etiketi** (§3) — hedef: spine’da mümkünse **CL-0 / CL-1**. İsteğe bağlı bir satır: **sayılabilir sinyal** (ör. birincil iddia −1, nav öğesi −1) — sahte yüzde yok. |

**İlkeler (UX güven protokolü):** Kayıp gizlenmez; yük abartılmaz; **sessiz sadeleştirme yok** — her anlamlı kaldırma **görünür kayıt** üretir.

---

## 2. Spine başına satır (OPT ile birebir)

[ESTL-OPT §1](RHIZOH_ESTL_UI_COLLAPSE_OPTIMIZATION_V1.md) üçlüsü için tabloda **en az üç satır** (Companion / Observe / Chronicle) veya o turda gerçekten değişmeyen yüzey için **“değişiklik yok — gerekçe”** tek satır.

---

## 3. CL kodları — algı yoğunluğu etiketi (sayı değil)

CL **ölçek sayısı değil**; yüzeyde kalan veya yeni oluşan **dikkat yoğunluğunun ürün etiketi**dir.

| Kod | Anlam (deneyim dili) |
|-----|----------------------|
| **CL-0** | **Akış** — dikkat dağıtıcı minimal; tek merkez net ([FREEZE-0](RHIZOH_FREEZE_0.md)). |
| **CL-1** | **Hafif farkındalık** — ikincil öğeler var ama birincil iddia baskın. |
| **CL-2** | **Dikkat yükü** — iki+ birincil iddia veya belirgin bilişsel sürtünme riski. |
| **CL-3+** | **Bilişsel tıkanma** — attention collapse bölgesi; ürün hatası adayı. |

**DIFF’te kullanım:** Mümkünse **önce → sonra** (ör. `CL-2 → CL-0`). OPT sonrası hedef: spine’da **CL-1 ve altı**; **CL-3+** kalıyorsa tur yetersiz veya yanlış kesim — CR’ye geri besle.

---

## 4. Şablon (kopyala-yapıştır)

```text
ESTL-DIFF-YYYY-MM-DD
Bağlı OPT: ESTL-OPT-YYYY-MM-DD
PR / commit:

--- A / B / C özü (yönetici 30 sn) ---
Companion: [kaldırılan] | [kayıp] | [CL önce→sonra + isteğe bağlı sayılabilir sinyal]
Observe:   [birleştirilen] | [kayıp] | [CL önce→sonra + …]
Chronicle: [sadeleşen akış] | [kayıp] | [CL önce→sonra + …]

--- Detay ---
Önce/sonra notları, ekran görüntüsü, power-user telafisi.
```

---

## 5. PR / sürüm notu ile hizalama

Merge açıklamasına **kısa blok** yapıştırılır: üç satır A/B/C özü + `ESTL-DIFF-*` referansı — **release okuma düzlemi**.

---

## 6. Reddedilenler

- DIFF olmadan OPT kapanışı sayılmaz.  
- “Kullanıcı kaybı: yok” varsayılanı — gerçekten yoksa **açıkça** “davranış aynı; yalnız görsel gürültü kalktı” yazılır.  
- **CL’yi yüzdeye çevirmek** (ör. “%37 daha az”) — yasak; yalnız §3 etiketi + isteğe bağlı sayılabilir sinyal.

---

## 7. İlişkili belgeler

- [Algı ekonomisi ve ESTL döngüsü V1](RHIZOH_PERCEPTION_ECONOMY_AND_ESTL_LOOP_V1.md)  
- [ESTL UI Collapse Optimization V1](RHIZOH_ESTL_UI_COLLAPSE_OPTIMIZATION_V1.md)  
- [ESTL-Driven UX Collapse Report V1](RHIZOH_ESTL_UX_COLLAPSE_REPORT_V1.md)  
- [ESTL Full-Cycle Live Session V1](RHIZOH_ESTL_FULL_CYCLE_LIVE_SESSION_V1.md)  
- [OWIS-1 max-2](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md)  

---

*ESTL-DIFF — görünür kaldırma; dürüst kayıp; CL algı muhasebesi.*
