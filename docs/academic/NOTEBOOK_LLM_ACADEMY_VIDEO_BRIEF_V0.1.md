# Notebook LLM — Rhizoh Academy Video Brief v0.1

**Tag:** `RESEARCH-ONLY` · **Audience:** Rhizoh Öğrenme Kanalı · Academy · YouTube  
**Source paper:** [`paper-v0.1.md`](preprint/paper-v0.1.md) · [`RHIZOH_HONEST_BASELINE_CHARTER_V1.md`](../RHIZOH_HONEST_BASELINE_CHARTER_V1.md)

**Kullanım:** Bu dosyayı Notebook LLM'e yapıştır. Her video bloğu ayrı bir üretim görevi. Jargon bloğu: EFIR ≠ slogan; "reality machine" tek başına kullanma.

---

## Ortak kurallar (3 video)

- **Dil:** Türkçe ana anlatım; teknik terimler İngilizce kalabilir (event sourcing, fusion lane)
- **Süre hedefi:** 8–12 dakika / video
- **Ton:** Dürüst baseline — demo değil, protokol anlatımı; "canlı ürün" iddiası yok
- **Görsel:** Her video için `docs/outreach/academy/video-thumbnails-v0.1/` altındaki thumbnail
- **Yasak:** Sim profilleri (Nisa/Eren) canlı kullanıcı gibi sunma; execution authority iddiası

---

## Video 1 — "Gözlem Yürütme Değildir"

**Kanal:** Rhizoh Öğrenme · Academy  
**Thumbnail:** `rhizoh-learn-v1-observation-not-execution.png`

### Tek cümle pitch
Rhizoh'da ajanlar ve UI katmanları **yorumlar**; mühürlü çekirdek (v562–v570) **yürütmez** — observation ≠ execution.

### Ana bölümler
1. Problem: Çoklu cihaz + AI gölge katmanları → tek merkezli "hemen ez" modeli yetersiz
2. Rhizoh cevabı: Proposal · preview · commit ayrımı; client = reality simulator
3. Frozen core: phase zinciri dokunulmaz; yorum katmanı genişleyebilir
4. Canlı kanıt (prod smoke): `__RHIZOH_FULL_REPORT__()` → `interpretationOnly: true`, fusion lanes

### Kapanış CTA
"Rhizoh bir kaçış değil — continuity protokolü. Sonraki videoda World Bridge."

### Notebook LLM çıktı iste
- Tam senaryo (giriş / 3 bölüm / kapanış)
- YouTube başlık + açıklama + 5 etiket
- 3 ekran kaydı anı (harita, console report, pin citizenship)

---

## Video 2 — "World Bridge: Takvim, Medya, Aktivite"

**Kanal:** Rhizoh Academy · teknik öğrenme  
**Thumbnail:** `rhizoh-learn-v2-world-bridge-layer2.png`

### Tek cümle pitch
Layer 2 World Bridge — calendar, media, user activity ingress → Fox-axis fusion → life shadow Day A/B; **yorum-only**, WAL yok.

### Ana bölümler
1. Pipeline diyagramı: Event → normalize → lane → fusion → shadow timeline
2. Prod smoke (kopyala-yapıştır):
   ```javascript
   __rhizoh.ingestCalendarEvent({ title: "Focus block", eventType: "scheduled" });
   __rhizoh.ingestMediaEvent({ title: "VOD", eventType: "playhead", positionSec: 120 });
   __rhizoh.ingestUserActivity({ activityType: "focus", surface: "world_map" });
   __rhizoh.lifeShadowDayBranches();
   (await __RHIZOH_FULL_REPORT__()).worldBridge;
   ```
3. Fusion weights: calendar 0.1 · media 0.08 · activity 0.07
4. Day A vs Day B: scheduled continuity vs cancelled/scattered counterfactual

### Kapanış CTA
"Layer 3 Life OS henüz executive değil — shadow counterfactual. Makale linki açıklamada."

### Notebook LLM çıktı iste
- Mermaid veya ASCII pipeline şeması
- Türkçe voiceover metni (1200–1500 kelime)
- Academy quiz: 3 soru + cevap

---

## Video 3 — "Tek Yazarlık Günlüğü: Proposal → Preview → Commit"

**Kanal:** Rhizoh kanalları (genel / outreach)  
**Thumbnail:** `rhizoh-learn-v3-proposal-preview-commit.png`

### Tek cümle pitch
`truth_log_v0` append-only; client preview lane ayrı; gateway ack olmadan commit yok — drift ölçülür, sessizce ezilmez.

### Ana bölümler
1. Matchmaking authority harness: `verifyProduction`, `verifyAuthorityBoundary`
2. Drift sınıfları: noise · pattern · conflict · fork
3. Reconciliation: `DRIFT_DETECTED` → `RECONCILIATION_APPLIED`
4. Paper v0.1 contribution tablosu (Section 1.2) — falsifiable claims

### Kapanış CTA
"Preprint link · rhizoh.com/world/space harita demosu · yorum katmanı genişler, çekirdek sabit."

### Notebook LLM çıktı iste
- İngilizce abstract özeti (150 kelime) + Türkçe çeviri
- LinkedIn / X thread (5 tweet)
- Shorts kesiti: 45 sn hook metni

---

## Prod doğrulama notu (2026-06-23)

Boot bundle: `index-AAI0mD28.js` — World Bridge smoke geçti:
- `fusion lanes: cal on (0.1) · media on (0.08) · activity on (0.07)`
- `life shadow: dayA 1 · dayB 0`

---

## İlgili PR'lar (bu gece)

| PR | Konu |
|----|------|
| #358 | lifeShadowDayAb → full report |
| #359 | world bridge memory graph |
| #360 | bird cube glide |
| #361 | paper v0.1 World Bridge sync + bu brief |
