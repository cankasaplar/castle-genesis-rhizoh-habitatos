# Integration sprint — teknik checklist

**Amaç:** Gateway canlı, kimlik hattı, capability görünürlüğü, swarm yoğunluğu, robotics yüzeyi, Studio/Library route bağları ve launch — tek entegrasyon sprintinde kapatılabilir net kriterler.

**Referans:** [`PRODUCTION_LAUNCH_CHECKLIST.md`](PRODUCTION_LAUNCH_CHECKLIST.md) · [`ENV_KEYS.md`](../ENV_KEYS.md)

---

## A) Ön koşullar — önce bunları doldur / karar ver

Bu tabloyu sprint başında **tek satır gerçek** ile doldurun (tahmin değil).

| Soru | Cevap (yazın) | Durum |
|------|----------------|--------|
| **Gateway public domain / URL** | Örn. `https://api.sizin-domain.com` (LLM: `.../rhizoh/llm`, WS: genelde aynı host `wss://...`) | ☐ |
| **İstemci build’de gateway eşlemesi** | `VITE_GATEWAY_URL` **veya** `VITE_GATEWAY_WS` + `VITE_GATEWAY_HTTP` | ☐ |
| **Deploy nerede?** | ☐ PM2 (VPS) · ☐ Docker (host / registry) · ☐ Cloud Run · ☐ Başka: ______ | ☐ |
| **Hosting URL** | Örn. `https://castle-genesis.web.app` — CORS / `CASTLE_ALLOWED_ORIGINS` ile uyumlu mu? | ☐ |
| **`apps/client/.env.production` dolu mu?** | Firebase (`VITE_FIREBASE_*` veya `VITE_FIREBASE_CONFIG`), gateway URL’ler, `VITE_GATEWAY_TOKEN` (üretimde önerilir) | ☐ |
| **Gateway `.env` (sunucu) dolu mu?** | Firebase admin, `OPENAI_API_KEY` (veya seçilen provider), `CASTLE_GATEWAY_TOKEN`, `CASTLE_HTTP_CORS_ORIGIN`, LLM ayarları | ☐ |
| **Cesium Ion token** | `VITE_CESIUM_ION_TOKEN` build’de set mi? (Boşsa globe sınırlı / fallback) | ☐ |

### Hızlı doğrulama komutları

- İstemci: `npm run verify:production -- --target=client` (şablonlar dolduktan sonra)
- Gateway: `npm run verify:production -- --target=gateway --strict`
- Gateway canlı: `GET https://<gateway-host>/health` (veya projede tanımlı health path)
- Rhizoh LLM + kimlik: gateway’de geçici `CASTLE_RHIZOH_LLM_IDENTITY_LOG=1` → logda `[rhizoh.llm.identity]` ve **`identityNarrativeChars` > 0** (gerçek kullanıcı mesajı sonrası)

---

## B) Sprint kapsamı — teslim kriterleri

| # | Konu | Teslim kriteri (Definition of Done) | Durum |
|---|------|--------------------------------------|--------|
| 1 | **Gateway live** | Public URL’den health + `/rhizoh/llm` (auth kurallarına uygun) yanıt; WS gerekiyorsa `wss://` bağlantısı stabil | ☐ |
| 2 | **Identity hydrate** | İstemci `continuity.identityNarrative` gönderiyor; **yeni gateway** system prompt’ta identity bloğu; logda `identityNarrativeChars > 0` | ☐ |
| 3 | **Capability halo** | Ana yüzeyde (veya Rhizoh kartında) Studio / GreenRoom / Library / Swarm / Octo / Spiral / Sovereign vb. **keşfedilebilir** kısa yollar veya tek “capability” özeti | ☐ |
| 4 | **Swarm density visual** | Launch / runtime’ta “medeniyet” hissi: yoğunluk veya akış (mevcut Launch Director + cognition composer ile genişletilmiş veya yeni katman) kullanıcıya görünür | ☐ |
| 5 | **Robotics surface** | L13 / robotics **ürün yüzünde** görünür (ör. “device / drone / robot” capability düğümü veya intent ipucu) | ☐ |
| 6 | **Studio / Library route bind** | Intent veya UI’den Studio ve Castle Library’ye giden **somut route** (deep link, layer, veya gateway endpoint ile uçtan uca) | ☐ |
| 7 | **Launch** | Hosting deploy + gateway redeploy tamam; smoke: giriş, bir Rhizoh mesajı, isteğe bağlı yayın path | ☐ |

---

## C) Launch sırası (önerilen)

1. Gateway’i yeni kodla deploy + env doğrula  
2. `identityNarrativeChars` log kontrolü  
3. `apps/client` production build + Firebase Hosting deploy  
4. Tarayıcıda canlı URL: küre / harita, bir LLM turu, capability halo görünürlüğü  

---

## D) Not — repo varsayılanları

- Firebase proje adı dokümantasyonda çoğunlukla **`castle-genesis`**; gerçek proje farklıysa tüm `VITE_FIREBASE_*` ve gateway Firebase alanlarını ona göre güncelleyin.
- **Hosting deploy**, gateway sürecini yenilemez; LLM/identity değiştiyse gateway ayrı redeploy şarttır.
