# Castle Genesis — Media Player kanal paketi (V0)

**Tag:** `RESEARCH-ONLY` · Symbio Media Tube + Octo 8-camera lab.

## Sorun

Uzun **Kendi Yalanına…** test VOD’u (~14 dk) embed ve bekleme odası için uygun değil; ses içinde sim profil / “başka bir ajan bekleniyor” anlatımı **Honest Baseline** ve `AGENTS.md` sim-profile kuralına aykırı şekilde canlı varlık gibi algılanabilir.

**Embed varsayılanı = kısa, sessiz veya Honest Baseline klipler.** Uzun parça ayrı unlisted VOD olarak kalır.

---

## Kanal listesi (kod SSOT)

Kaynak: `apps/client/src/rhizoh/runtime/worldSpaceMediaChannelsV0.js`

| Kanal ID | Amaç | Env / fallback |
|----------|------|----------------|
| `castle_genesis` | Varsayılan · ~45s kısa veya canlı holding | `VITE_CASTLE_GENESIS_YOUTUBE_SHORT_VIDEO_ID` · yoksa holding slide |
| `castle_genesis_live` | YouTube Live | `VITE_CASTLE_GENESIS_YOUTUBE_CHANNEL_ID` · yoksa holding slide |
| `castle_chess` | 8 kamera satranç B-roll | `VITE_CASTLE_GENESIS_YOUTUBE_CHESS_VIDEO_ID` · yoksa canlı cluster |
| `castle_architecture` | Mimari özet (2. parça) | `VITE_CASTLE_GENESIS_YOUTUBE_ARCHITECTURE_VIDEO_ID` · yoksa holding slide |
| `castle_manifesto_trim` | Uzun VOD’un ilk N saniyesi | `FULL_VIDEO_ID` + `FULL_EMBED_END_SEC` · yoksa holding slide |
| `world_sports` | WorldSports — skor + haber | `world_sports_feed` veya `VITE_RHIZOH_WORLDSPORTS_YOUTUBE_VIDEO_ID` |
| `nasa` | ISS / NASA TV | sabit embed |
| `lofi` | Kuantum ambient | sabit embed |
| `local` | Yerel kamera | capture |

---

## Kısa klip üretimi

```bash
# Honest Baseline ~45s (sessiz — embed güvenli)
node scripts/build-castle-genesis-youtube-short-intro.mjs

# Satranç yayın kartı ~45s
node scripts/build-castle-genesis-youtube-short-intro.mjs --variant chess

# Manifesto sesinin ilk 60s (geçici — yine de Nisa anlatımı kesilmiş olmalı)
node scripts/build-castle-genesis-youtube-short-intro.mjs --variant manifesto_trim --duration 60
```

Çıktı: `docs/exports/media/youtube/castle_genesis_short_*.mp4`

YouTube Studio → **Unlisted** yükle → video ID’yi `.env` / deploy secret’a yaz.

### Örnek `.env` (client)

```env
VITE_CASTLE_GENESIS_YOUTUBE_SHORT_VIDEO_ID=dQw4example
VITE_CASTLE_GENESIS_YOUTUBE_CHESS_VIDEO_ID=abc123example
VITE_CASTLE_GENESIS_YOUTUBE_CHANNEL_ID=UCxxxxxxxx
# Opsiyonel — uzun VOD sadece kırpılmış önizleme kanalında
VITE_CASTLE_GENESIS_YOUTUBE_FULL_VIDEO_ID=longVideoId
VITE_CASTLE_GENESIS_YOUTUBE_FULL_EMBED_END_SEC=60
```

---

## Yükleme checklist (her klip)

| Alan | Kural |
|------|--------|
| Süre | Embed: **15–90s** · tam manifesto ayrı playlist |
| Ses | Kısa klip: sessiz veya Honest Baseline tagline; **sim profil bekleniyor** yok |
| Başlık | `[TEST V0]` öneki · canlı AI / Nisa iddiası yok |
| Görünürlük | Unlisted (test) |
| Açıklama | `Observation != Execution` · `rhizoh.com` |

---

## UI yüzeyleri

- **World Space Media Tube** — sol “Kanallar” listesi otomatik genişler
- **Octo 8-camera lab** — `lens_castle_chess` → `castle_chess` kanalı
- **Harita pin** — `worldsports` → `world_sports` kanalı (Serencebey mesh)

---

## İlgili dosyalar

| Dosya | Rol |
|-------|-----|
| `castle-genesis-short-embed-slide.svg` | Kısa klip kartı |
| `castle-genesis-chess-embed-slide.svg` | Satranç kanal kartı |
| `docs/CASTLE_GENESIS_YOUTUBE_TEST_BROADCAST_V0.md` | İlk uzun test VOD runbook |
| `docs/RHIZOH_CHESS_BROADCAST_8CAM_RUNBOOK_V0.md` | OBS / 8 kamera |

**SPECFLOW:** `RESEARCH-ONLY` — frozen core dokunulmaz.
