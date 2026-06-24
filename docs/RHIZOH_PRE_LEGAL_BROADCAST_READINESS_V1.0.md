# Rhizoh Pre-Legal Broadcast Readiness v1.0

**Tag:** `RESEARCH-ONLY` (ops + product prep — no data-plane activation)  
**Date:** 2026-06-25  
**Phase:** 0.5 · MODEL · legal HOLD active  
**Parent:** [`RHIZOH_PHASE_GATE_OPERATING_MODE_V1.0.md`](RHIZOH_PHASE_GATE_OPERATING_MODE_V1.0.md) · [`RENDER_API_GAPS_CHECKLIST_V1.0.md`](ops/RENDER_API_GAPS_CHECKLIST_V1.0.md) · [`RHIZOH_PRODUCT_PROMISE_MATRIX_V1.md`](RHIZOH_PRODUCT_PROMISE_MATRIX_V1.md)

---

## Amaç

Legal onay (READY imzası) **öncesi** YouTube/OBS canlı yayın ve kanal geçişleri için **görünür ürün yüzeyinin** tamamlanması. Bu belge yürütme motoru değildir; kontrol listesi + mimari yol haritasıdır.

**Dürüst sınır:** Cesium harita pinleri `legal_activation_hold` altında kasıtlı olarak sınırlıdır. WorldSports pinleri **canlı maç + venue anchor** gerektirir; API anahtarı yoksa `harita pini: 0` beklenen durumdur.

---

## Bugün çalışan (prod doğrulandı)

| Yüzey | URL / komut | Durum |
|-------|-------------|-------|
| Satranç 8 kamera | `/world/space?channel=chess&broadcast=1` | ✔ Stockfish cluster + öğrenme şeridi |
| Go öğrenme | `/world/space?channel=go&broadcast=1` | ✔ taşlar + şerit · öğretmen: demo (KataGo yok) |
| Dama öğrenme | `/world/space?channel=checkers&broadcast=1` | ✔ demo taşlar + şerit · kurallar tam değil |
| Academy union | `__rhizoh.academyLearningUnion()` | ✔ triad_active · chess+go+checkers |
| Tam rapor | `await __RHIZOH_FULL_REPORT__()` | ✔ |
| Çıktı paketi | `await __rhizoh.outputPack({ locale: "tr" })` | ✔ OBS URL'leri dahil |
| Paper indir | `await __rhizoh.downloadPaperV01()` · `/academy` | ✔ (deploy sonrası) |
| WorldSports liste | `/world/space?channel=world_sports` | ◐ yaklaşan maçlar · canlı=0 · pin=0 (key yok) |

---

## Paper — terminal olmadan indirme

| Yöntem | Adres / komut |
|--------|----------------|
| Academy sayfası | [rhizoh.com/academy](https://rhizoh.com/academy) → **Markdown indir** veya **Tarayıcıda oku (HTML)** |
| Doğrudan MD | `https://rhizoh.com/rhizoh/academic/paper-v0.1.md` |
| Doğrudan HTML | `https://rhizoh.com/rhizoh/academic/paper-v0.1.html` |
| Konsol (F12) | `await __rhizoh.downloadPaperV01({ locale: "tr" })` |
| Özet kopyala | `await __rhizoh.copyPaperAbstract({ locale: "tr" })` |

**Not:** Eski `/rhizoh/academic/paper-v0.1.pdf` linki kaldırıldı — statik PDF henüz üretilmedi. Markdown/HTML SSOT.

---

## Konsol hataları (sık yapılan)

| Yanlış | Doğru |
|--------|-------|
| `epistemicAuditBundle` | `await __rhizoh.epistemicAuditBundle.run()` |
| `downloadPaper` | `await __rhizoh.downloadPaperV01()` |
| `fullReport` | `await __RHIZOH_FULL_REPORT__()` |

---

## P0 — Legal öncesi tamamlanacaklar

### 1) Render API anahtarları (WorldSports pin + canlı skor)

[`RENDER_API_GAPS_CHECKLIST_V1.0.md`](ops/RENDER_API_GAPS_CHECKLIST_V1.0.md) §2:

- `API_SPORTS_KEY` — NBA + çok spor
- `FOOTBALL_DATA_ORG_TOKEN` — futbol yaklaşan/canlı
- `NEWSDATA_API_KEY` — World News

**Doğrulama (tarayıcı konsolu):**
```javascript
await __rhizoh.wireWorldSportsTube({ force: true })
__rhizoh.worldSportsTube()
```

Beklenen: `liveMatchCount >= 1` → `pinCount >= 1` (venue anchor eşleşen takımlar için).

### 2) KataGo (Go gerçek öğretmen)

**Mevcut:** `goKataGoGtpBridgeV0.js` — köprü hazır, motor yok.  
**Gerekli:**

1. Ayrı KataGo GTP sidecar (Render veya VPS container)
2. Client env: `VITE_RHIZOH_KATAGO_GTP_URL=wss://…/gtp`
3. Öğrenme şeridinde `demo (KataGo yok)` → `KataGo` etiketi

**Spec:** [`RHIZOH_GO_KATAGO_GTP_CONTRACT_V0.md`](RHIZOH_GO_KATAGO_GTP_CONTRACT_V0.md)

### 3) Dama — gerçek kurallar + taş görselleri

**Mevcut:** `checkersArenaEngineV0.js` — 8×8 demo, hamle doğrulaması yok, daire placeholder.  
**Gerekli (sıra):**

1. Türk daması / uluslararası draughts kural motoru (zorunlu hamle, çoklu yeme, kral)
2. Başlangıç dizilimi (12+12)
3. SVG/PNG taş sprite'ları (kırmızı/siyah, kral tacı)
4. Öğrenme gate: Stockfish benzeri `checkersEvalFusionV0` (heuristic → engine)

### 4) Go + Dama 8 kamera adaptif öğrenme

**Mevcut:** Satranç `chessGameClusterV0` — 8 slot, Stockfish, broadcast grid.  
**Go/Dama:** tek tahta + demo hamle; 8 kamera yok.

**Hedef mimari (chess parity):**

| Disiplin | Cluster modülü | Kamera meta |
|----------|----------------|-------------|
| Chess | `chessGameClusterV0` | ✔ `rhizohChessLearningCameraV0` |
| Go | `goGameClusterV0` (yeni) | `rhizohGoLearningCameraV0` (mevcut, tek slot) |
| Checkers | `checkersGameClusterV0` (yeni) | `rhizohCheckersLearningCameraV0` (mevcut, tek slot) |

**Broadcast URL'leri (hedef):**
- Go: `/world/space?channel=go&broadcast=1&cluster=8`
- Dama: `/world/space?channel=checkers&broadcast=1&cluster=8`

**Adaptif öğrenme:** `academyLearningUnionWireV0` batch flush + discipline digest — chess ile aynı metrik şeridi (`RhizohArenaLearningStripV0`).

---

## P1 — WorldSports çok spor kanal matrisi

### Mevcut kanal

- `world_sports` — futbol + NBA birleşik feed (`worldSportsMediaTubeWireV0.js`)

### Hedef kanal geçişleri (her biri kendi harita konumundan yayına hazır)

| Kanal ID | Spor | Veri kaynağı | Harita pini |
|----------|------|--------------|-------------|
| `world_sports` | Futbol + özet | API-Sports + football-data.org | Canlı maç venue |
| `world_sports_basketball` | NBA / FIBA | API-Sports basketball | Arena anchor |
| `world_sports_volleyball` | Voleybol | API-Sports volleyball | Venue (genişlet) |
| `world_sports_tennis` | Tenis (bireysel) | API-Sports tennis | Turnuva şehri |
| `world_sports_f1` | F1 (bireysel/takım) | API-Sports formula-1 | Pist koordinatı |
| `world_sports_olympic` | Çok disiplin | Gateway aggregate | Ülke/şehir |

**Uygulama adımları:**

1. `worldSpaceMediaChannelsV0.js` — kanal satırları ekle (`type: world_sports_feed`, `sportFilter`)
2. `worldMapLiveMatchPinsV0.js` — `VENUE_ANCHORS_V0` genişlet (voleybol salonları, tenis venue)
3. `RhizohWorldSpaceMediaTubeV0.jsx` — sidebar kanal listesi + `?channel=` deep link
4. Her kanal için OBS URL: `/world/space?channel=world_sports_basketball&broadcast=1`
5. Director cut trigger: `rhizohDirectorEngineV0` — `worldSportsLive` per sport

**Pin politikası:** Yalnızca `live` statüsündeki maçlar pin alır. `upcoming` liste içinde kalır, haritada değil.

---

## P2 — Legal sonrası (READY imzası)

- Cesium `legal_activation_hold` kaldırma → spiral + distributed pin tam görünürlük
- Veri düzlemi gerçek sinyal (`RHIZOH_PHASE1_CONTROLLED_REAL_SIGNAL_V1.0.md`)
- Gateway WAL commit prod kullanıcıları

---

## OBS yayın kontrol listesi (legal öncesi demo)

1. Chrome tam ekran → `?broadcast=1` URL
2. Sidebar + ticker gizli (broadcast mode)
3. `await __rhizoh.outputPack({ locale: "tr" })` → capture URL kopyala
4. OBS Browser Source veya ekran kaydı
5. Alt bant: "Yalnızca gözlem · Rhizoh hayatınızı yürütmez"

---

## İlgili belgeler

- [`RHIZOH_GO_LEARNING_TOPOLOGY_V0.md`](RHIZOH_GO_LEARNING_TOPOLOGY_V0.md)
- [`RHIZOH_WORLDSPORTS_OBSERVATION_SHORT_V0.md`](RHIZOH_WORLDSPORTS_OBSERVATION_SHORT_V0.md)
- [`RHIZOH_PRODUCT_GAPS_V0.md`](RHIZOH_PRODUCT_GAPS_V0.md)
- [`docs/academic/RHIZOH_DISTRIBUTED_REALITY_CONSTRUCTION_PAPER_V0.1.md`](academic/RHIZOH_DISTRIBUTED_REALITY_CONSTRUCTION_PAPER_V0.1.md)
