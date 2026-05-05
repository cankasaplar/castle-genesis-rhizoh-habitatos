# Rhizoh uzun sohbet — davranış doğrulama (validation run)

Bu doküman **production launch** değil; canlı veya staging üzerinde **LLM + omurga + UI** davranışını sistematik doğrulamak içindir.

## Önkoşullar

| Kontrol | Nasıl |
|--------|--------|
| Gateway ayakta | `GET …/health/live` → 200, `live: true` |
| Bağımlılık özeti | `GET …/health/deps` veya `GET …/health/ready` |
| CORS | Render’da `CASTLE_ALLOWED_ORIGINS` içinde **hem** `https://…web.app` **hem** `https://…firebaseapp.com` (Firebase’in verdiği her origin) olmalı; gateway istek `Origin`’ini whitelist’teyse `Access-Control-Allow-Origin` olarak **aynı değeri** döner. |
| Kimlik | `POST /rhizoh/llm` için `resolveHttpUser`: Firebase **ID token** (`Authorization: Bearer …`) veya sunucuda `CASTLE_JWT_SECRET` ile imzalı JWT. Geliştirme/anonymous: `CASTLE_ALLOW_DEV_ANON` + `CASTLE_ALLOW_DEV_HTTP_UID` açıksa `X-Castle-Dev-Uid` yeterli olabilir — **üretimde kapatılmış olmalı**. |
| LLM anahtarı | `llmKeySource: "env"` → sunucu `OPENAI_API_KEY` / sağlayıcı env; `user_connection` → giriş + Studio bağlantısı |

## Ortam değişkenleri (curl / script)

```bash
export GATEWAY="https://YOUR-SERVICE.onrender.com"
export CASTLE_DEV_UID="validation-run-001"
# Üretim: gerçek Firebase ID token (kısa ömürlü)
# export FIREBASE_ID_TOKEN="eyJ..."
```

PowerShell:

```powershell
$env:GATEWAY = "https://YOUR-SERVICE.onrender.com"
$env:CASTLE_DEV_UID = "validation-run-001"
```

## Ortak istek gövdesi şablonu

```json
{
  "message": "…",
  "llmKeySource": "env",
  "context": {
    "agentId": "RHIZOH-PRIME",
    "continuity": {
      "recentTurns": [],
      "identityNarrative": ""
    }
  }
}
```

**Başarılı turda** yanıtta genelde: `reply`, `traceId`, `turnLatencyMs`, `ok` / `directive` (sözleşmeye göre). `spinePhases` yalnızca trace/örnekleme açıksa.

---

## 10 senaryo + beklenen davranış

### 1 — Sohbet açılışı

- **Girdi:** `"Rhizoh, kendini kısaca tanıt."`
- **Beklenen:** Anlamlı `reply`; `traceId` UUID benzeri; `turnLatencyMs` > 0 ve makul üst sınır (ör. &lt; 120s).
- **Başarısız:** `ok: false`, `message_required`, 401/403 (auth), 429 (rate limit).

### 2 — İkinci tur (aynı oturum kimliği)

- **Girdi:** `"Bir önceki mesajımda hangi kelimeyi vurguladım?"`
- **Önkoşul:** Aynı `X-Castle-Dev-Uid` veya aynı Firebase `uid` (persist açıksa bellek yazılır).
- **Beklenen:** Tutarlı cevap veya dürüst “emin değilim”; crash yok. `traceId` her turda **farklı** olmalı.

### 3 — Boş mesaj (negatif test)

- **Girdi:** `"message": ""`
- **Beklenen:** 400 veya anlamlı hata gövdesi; gateway çökmez.

### 4 — `llmKeySource` geçersiz

- **Girdi:** `"llmKeySource": "invalid"`
- **Beklenen:** 400, `invalid_llm_key_source`.

### 5 — Uzun mesaj (sınır)

- **Girdi:** ~1600+ karakter (veya limit civarı).
- **Beklenen:** Kesilerek işlenir veya kontrollü hata; 500 + belirsiz gövde olmamalı.

### 6 — Directive: `FOCUS_RHIZOH` (metin içinde veya API sözleşmesi)

- **Girdi:** `"Haritada Rhizoh odağına geç: FOCUS_RHIZOH"` veya sunucunun ürettiği `directive` alanını UI’da doğrula.
- **Beklenen:** Motor varsa kamera hareketi; **motor yoksa** istemci `applyRhizohDirective` içinde no-op — **crash yok**, tam ekran spinner yok.

### 7 — Directive: `ZOOM_CASTLE` / `ISTANBUL_OVERVIEW`

- **Girdi:** İlgili komutları doğal dilde iste.
- **Beklenen:** Cesium yüklüyse `window.__CASTLE_CESIUM__` yolu; değilse Three tarafı veya no-op.

### 8 — Ardışık 10 tur (latency / stabilite)

- **Girdi:** 10 farklı kısa soru (teknik, tarih, kod, Türkçe karışık).
- **Beklenen:** Tümünde 200 + `traceId`; `turnLatencyMs` uç değerlerde drift yok; ara sıra 429 yok (rate limit altında).

### 9 — Health ile uyum

- **Adım:** Önce `GET /health/deps`, ardından aynı origin ile `POST /rhizoh/llm`.
- **Beklenen:** deps `llm` uyarılı olsa bile bazı ortamlarda LLM çalışabilir; **tutarsızlık** varsa dokümante et (örn. sadece env probe).

### 10 — Tarayıcı (Hosting) uçtan uca

- **Adım:** `https://castle-genesis.web.app` (veya kendi Hosting URL’in) açık; Rhizoh alanından 1–8 ile aynı diyaloglar.
- **Beklenen:** Network’te `rhizoh/llm` 200; yanıt gövdesi; **sonsuz tam ekran boot overlay yok** (engine hatası olsa bile UI açık kalmalı — son client fix).

---

## Tek istek — curl (dev UID ile, sunucu izin veriyorsa)

```bash
curl -sS -X POST "$GATEWAY/rhizoh/llm" \
  -H "Content-Type: application/json" \
  -H "X-Castle-Dev-Uid: $CASTLE_DEV_UID" \
  -d '{"message":"Rhizoh, kendini kısaca tanıt.","llmKeySource":"env","context":{"agentId":"RHIZOH-PRIME","continuity":{"recentTurns":[]}}}'
```

Firebase ID token ile:

```bash
curl -sS -X POST "$GATEWAY/rhizoh/llm" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FIREBASE_ID_TOKEN" \
  -d '{"message":"Merhaba","llmKeySource":"env","context":{"agentId":"RHIZOH-PRIME","continuity":{"recentTurns":[]}}}'
```

---

## Kayıt şablonu (manuel)

| # | Tarih | Ortam | traceId | turnLatencyMs | Sonuç (PASS/FAIL) | Not |
|---|--------|--------|---------|----------------|------------------|-----|
| 1 | | | | | | |

---

## İlgili dokümanlar

- `docs/PRODUCTION_LAUNCH_CHECKLIST.md` — tam launch için ek kontroller.
- `docs/RHIZOH_SPINE_MVP.md` — trace / health özeti.
