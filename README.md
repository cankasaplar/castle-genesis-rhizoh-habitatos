# Castle System - Production Architecture Skeleton

## Castle Genesis — ürün sütunları

| | |
|--|--|
| **LLM MMO city simulation** | Araştırma sandbox’ı: şehir zihni, akademi katmanı, olay ağı ile LLM bağlı simülasyon |
| **Playable game** | Gerçek zamanlı çok oyunculu hissi (gateway + WS + görünür dünya tick’i) |
| **Agent marketplace + user-owned AI ecosystem** | Kullanıcıya bağlı ajanlar, persona / memory hatları, Rhizoh komut düzlemi |
| **Castle Genesis production platform** | GreenRoom, yayın, gateway güvenliği ve prod artefact’ları için tek monorepo yüzeyi |

Bu repo artik monorepo yapisinda:

- `apps/client` -> Three.js tabanli gercek zamanli 3D dunya haritasi
- `apps/gateway` -> WebSocket realtime gateway (input + broadcast)
- `apps/sim-core` -> deterministic simulation core
- `apps/orchestrator` -> shard/world yonetimi + command uygulama
- `packages/protocol` -> ortak mesaj/protokol sabitleri
- `packages/command-dsl` -> cok dilli komut metni -> canonical command

## Hizli Baslangic

```bash
npm install
npm run dev:gateway
npm run dev:sfu
```

Yeni terminalde:

```bash
npm run dev:client
```

Client icin gateway ve uçuş/uydu anahtarlari: `apps/client/.env.example` → `.env.local` kopyalayin; yayın manifest’i `apps/client/public/castle-flight-satellite.manifest.json`. Varsayilan `VITE_GATEWAY_WS_URL` gateway WS adresidir.

## Firebase Deploy

- Firebase config dosyalari:
  - `firebase.json`
  - `.firebaserc`
  - `firestore.rules`
  - `storage.rules`
- Deploy komutlari:
  - `npm run firebase:deploy:hosting`
  - `npm run firebase:deploy:rules`
  - `npm run firebase:deploy`

## Guvenlik ve Anahtar Yonetimi

- Gercek anahtar/token bilgilerini sadece `.env` icinde tutun.
- `CASTLE_GATEWAY_TOKEN` ayarlanirsa gateway token dogrulamasi zorunlu olur.
- `CASTLE_REQUIRE_AUTH=true` ile JWT/Firebase token dogrulamasi aktif edilir.
- `CASTLE_ALLOWED_ORIGINS` ile origin allowlist aktif edilir.
- Ayrintilar icin: `docs/SECURITY_HARDENING.md`

## JWT / Firebase Dogrulama

- Gateway, auth token'i query (`auth`) veya `Authorization: Bearer` header'dan alir.
- Firebase Admin env degerleri verilirse once Firebase ID token dogrular.
- Firebase ayarsizsa `CASTLE_JWT_SECRET` ile HS256 JWT fallback kullanir.

## TURN + SFU (mediasoup)

- SFU sunucusu: `apps/sfu` (`npm run dev:sfu`)
- Client, `VITE_SFU_WS_URL` ile SFU'ya baglanir.
- TURN konfigurasyonu:
  - `VITE_TURN_URL`
  - `VITE_TURN_USERNAME`
  - `VITE_TURN_CREDENTIAL`

## Rhizoh Brain v6 Entegrasyonu

- **Client çekirdek (vNext-529)**: GPU/garanti/kapanış köprüsü, epistemik yüzey, dış solver ve kanıt ağı iskeleti — tek sayfa harita: [`docs/RHIZOH_KERNEL_VNEXT529.md`](docs/RHIZOH_KERNEL_VNEXT529.md)
- Gateway uzerinde `RHIZOH_QUERY` / `RHIZOH_RESULT` mesaj tipi aktif.
- Serbest metin komutlari Rhizoh cekirdegine yonlendirilir.
- UI tarafinda mode/persona/reply paneli canli gosterilir.
- Harita katmani artik gelistirilebilir yapida:
  - `agent` (simulasyon aktorleri)
  - `entity` (NODE / BEACON / RELIC)
  - `castle` (dinamik olusturulabilir merkezler)
  - `geocastle` (gercek konum + hava + trafik proxy)

### Konum Bazli Castle Spawn

- Komut: `GEOCASTLE istanbul`
- Akis:
  1) gateway `OPEN_DATA_QUERY provider=geocastle`
  2) geocoding + OpenMeteo weather + OSM-overpass trafik yogunluk proxy
  3) `CREATE_CASTLE` komutu ile lat/lng/weather/traffic metadata ile olusturma

### Advanced Real Map Layer

- Castle marker pozisyonu artik gercek `lat/lng` -> globe koordinat projeksiyonu ile cizilir.
- Marker rengi trafik seviyesine gore degisir (`low/medium/high`).
- Marker pulse siddeti hava verisine (sicaklik + ruzgar) baglanir.
- Castle-lar arasi geodesic benzeri baglanti cizgileri ve canli metadata overlay paneli gosterilir.

## Studio Katmani (GreenRoom Ultimate)

- Studio sayfasi: `apps/client/public/greenroom-ultimate.html`
- HabitatOS icinden "Open Studio Layer" butonu ile acilir.
- YouTube cikis hedefi: `https://www.youtube.com/@CastleGenesis/live`
- Not: tarayici `canvas.captureStream()` yalnizca local stream uretir; YouTube'a gercek yayin icin LiveKit egress/OBS/RTMP bridge gerekir.
- OCTO AI Studio sayfasi: `apps/client/public/octoai-studio.html`
- GreenRoom ve HabitatOS panelinden "Open OCTO AI" ile acilir.
- Ortak studio stil/dil ayari:
  - `apps/client/public/studio-shared.css`
  - `apps/client/public/studio-shared.js`
  - Dil secimi (TR/EN) tum studio sekmelerinde ortaktir (localStorage).
- OCTO extensibility:
  - `window.OctoExtensions.register({ onInit(octoMind) { ... } })` ile plugin tabanli gelistirme.

## SpiralMMO Katmani (CastleByCK Room)

- Sayfa: `apps/client/public/spiralmmo-castlebyck.html`
- Amac: sisteme katilan AI varliklarinin SpiralMMO odasinda oynadigi canli alan.
- Kernel uyumu:
  - Gateway: `ws://localhost:8090` (aynı ws/token mantigi)
  - SFU probe: `ws://localhost:5005`
  - LiveKit: ayni token endpoint + room connect akisi
  - Ortak stil/dil: `studio-shared.css` + `studio-shared.js`

## Genesis Broadcaster AI Agent (Ortak Yayin)

- Yeni servis: `apps/broadcaster/src/agent.js`
- Calistirma: `npm run dev:broadcaster`
- Gorev:
  - gateway `WORLD_TICK` dinler
  - AI destekli sahne cue uretir (preset/speaker/camera/bpm/line)
  - `STUDIO_CUE` olarak tum kullanicilara ortak yayin direktifi yollar
- GreenRoom sayfasi `STUDIO_CUE` mesajlarini dinler ve otomatik uygular.
- Varsayilan yayin hedefi: `https://www.youtube.com/@CastleGenesis/live`

## CI Security Scan

- GitHub Actions: `.github/workflows/security.yml`
- Calisan adimlar:
  - `npm run security:audit`
  - `npm run security:sast`
  - CodeQL SAST analizi

## Cok Dilli Komut Ornekleri

- `SPAWN AGENT castle-01`
- `Birim oluştur castle-02`
- `Créer agent castle-03`
- `新しいエージェント`

Hepsi canonical olarak `SPAWN_AGENT` komutuna duser.

## Gercek Zamanli 3D Dunya Katmani

`apps/client/src/App.jsx`:

- Globe uzerinde castle node'larini cizer
- Authoritative world tick ile agent konumlarini canli gunceller
- Duruma gore agent rengini degistirir (`ACTIVE` / `LOW_POWER`)

## Sonraki Adimlar

- Gateway tarafinda JWT/Firebase token dogrulama aktif et
- TURN + SFU (mediasoup/janus) ile media katmanini buyut
- Orchestrator icine multi-shard routing ve persistence ekle
