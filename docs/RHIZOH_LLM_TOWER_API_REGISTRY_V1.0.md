# Rhizoh LLM Tower API Registry v1.0

**SPECFLOW:** `RESEARCH-ONLY` — gateway env + pin UX SSOT; frozen `phase*.js` untouched.

## Gateway env keys (Render / `apps/gateway`)

| Env variable | Provider | Towers using it |
|--------------|----------|-----------------|
| `GEMINI_API_KEY` / `GOOGLE_API_KEY` | Google Gemini | `gemini_tower`, `deepmind_tower` |
| `ANTHROPIC_API_KEY` | Anthropic | `claude_tower` |
| `OPENAI_API_KEY` | OpenAI | `chatgpt_tower`, `kyoto_tower`, `sora_tower` |
| `MISTRAL_API_KEY` | Mistral | `mistral_tower` |
| `API_SPORTS_KEY` / football token | API-Sports | World feed (live match pins, sidebar sports) |
| `CASTLE_LLM_PROVIDER` | Default fallback | Voice dock when tower unspecified |

Client never holds provider secrets in production — only `postRhizohLlmTurnV0` → `/rhizoh/llm`.

---

## Tower pin features (map + workspace)

### Gemini Neural Tower (`gemini_tower`)
- **Pin amacı:** Multimodal yaratıcı kule — görsel üretim, vision analiz, sesli komut.
- **Odalar:** Prism Gallery · Imagine Atelier · Vision Lens · Voice Link · Motion Deck (yakında) · Dimension Sandbox (yakında).
- **API:** `GEMINI_API_KEY` — text, vision (`towerVision` inlineData), brief.
- **Gerçek görsel üretim yolu:** `geminiTowerBrainV0` şu an **local canvas manifest**; Imagen / `generateContent` image output için gateway'e `RHIZOH_GEMINI_IMAGEN=1` + `imagen-3.0-generate-*` endpoint eklenmeli (sonraki sprint).

### Claude Sentinel Tower (`claude_tower`)
- **Pin amacı:** Analiz, uzun bağlam, anayasal hizalama metinleri.
- **Workspace:** `RhizohLlmTowerWorkspaceV0` — kamera + ses + gateway chat.
- **API:** `ANTHROPIC_API_KEY` — `claude-3-5-sonnet-*`.

### ChatGPT Sovereign Hub (`chatgpt_tower`)
- **Pin amacı:** Araç otomasyonu, yaratıcı swarm, genel asistan.
- **API:** `OPENAI_API_KEY` — `gpt-4o-mini` (tool-ready).

### DeepMind Synthesis Node (`deepmind_tower`)
- **Pin amacı:** Araştırma sentezi, mantıksal akıl yürütme (Gemini backend).
- **API:** `GEMINI_API_KEY` — research surface.

### Mistral Sovereign Node (`mistral_tower`)
- **Pin amacı:** Hafif Avrupa uç noktası, düşük gecikme sohbet.
- **API:** `MISTRAL_API_KEY`.

### Kyoto Robotics Anchor (`kyoto_tower`)
- **Pin amacı:** Robotik / donanım arayüzü, sesli komut laboratuvarı.
- **API:** `OPENAI_API_KEY` (placeholder robotics surface).

### Sora Visual Projection (`sora_tower`)
- **Pin amacı:** Video / sinematik üretim yuvası (Sora API bağlanınca).
- **API:** `OPENAI_API_KEY` + gelecekte `sora` video endpoint.

---

## Castle gerçek veri katmanı

| Veri | Kaynak | Durum |
|------|--------|--------|
| Hava | Open-Meteo (`fetchOpenMeteoWeatherLineV0`) | Canlı — client doğrudan; internet gerekir |
| Spor / haber | Gateway `/rhizoh/live/world-feed` | API-Sports + news; `VITE_LIVE_GATEWAY_BASE` |
| Trafik | `trafficTransitEventsV541.js` | HTTP opsiyonel + İstanbul ritim fallback |
| Canlı maç pinleri | `worldMapLiveMatchPinsV0.js` | Venue anchor SSOT; ses: *"canlı maç pinlerini göster"* |

**Siri / Apple Maps trafik:** Doğrudan entegre değil — alternatif: gateway'de Mapbox/Google Traffic proxy veya kullanıcıya sesli özet (LLM + trafik JSON).

**3D mekan AI:** Dimension Sandbox → harici Meshy / Luma / Tripo API (gateway proxy, `RESEARCH-ONLY`).

---

## Log analizi (kullanıcı konsolu)

| Log / uyarı | Anlam | Aksiyon |
|-------------|-------|---------|
| `No available adapters` | WebGPU probe — Chrome'da normal gürültü | Yoksay |
| `ERR_INTERNET_DISCONNECTED` open-meteo / medusa.glb | Ağ kesintisi | Medusa fallback mesh + saç torusları kullanılır |
| `[VOICE_V3] LIVE_WS_READY` | Ses motoru OK | Medusa hareketi için kamera+ses bağlı olmalı |
| Gateway `app.gateway.connected` | LLM vision/chat hazır | Render redeploy + `GEMINI_API_KEY` |
| Stockfish `heuristic_fallback` | WASM worker yüklenemedi | `/chess-engine/*.wasm` MIME + CDN |

---

## Sonraki sprint önerileri

1. Gateway Imagen endpoint → `generateGeminiTowerImageV0` gerçek PNG.
2. API-Sports venue `lat/lon` normalize → tam salon pinleri.
3. NBA/global basketbol ayrı feed partition.
4. Trafik: `VITE_TRAFFIC_FEED_URL` + sesli özet.
