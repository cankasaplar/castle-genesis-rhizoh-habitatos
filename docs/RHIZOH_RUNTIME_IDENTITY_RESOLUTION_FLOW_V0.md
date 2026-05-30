# Rhizoh Runtime Identity Resolution Flow (V0)

**Tür:** yürütme yolu özeti — **teorik spek değil**; mevcut istemci + gateway akışına göre yazıldı.  
**Politika çerçevesi:** [`RHIZOH_SSOT_SELECTION_POLICY_V0.md`](RHIZOH_SSOT_SELECTION_POLICY_V0.md) · envanter: [`RHIZOH_SESSION_IDENTITY_INVENTORY_V0.md`](RHIZOH_SESSION_IDENTITY_INVENTORY_V0.md) · freeze / identity / snapshot özeti: [`RHIZOH_FREEZE_IDENTITY_SNAPSHOT_SSOT_V0.md`](RHIZOH_FREEZE_IDENTITY_SNAPSHOT_SSOT_V0.md).

**Tek cümle:** “Tek global SSOT” yoktur; runtime’ta **contextual resolution** — concern başına anchor ve **belirli merge anlarında** kimlikler bir araya gelir.

---

## 1. Girdiler (modalite)

| Girdi | İstemci giriş noktası | Ortak çıktı |
|-------|----------------------|-------------|
| Metin | `handleExecute` → `queryRhizohLLM` | Anlamsal kullanıcı metni + aynı LLM çağrısı |
| Ses (transkript) | `handleVoiceTranscript` → `queryRhizohLLM` | Aynı |
| (Gelecek) WS / stream | Henüz tek çatı yok; aynı `queryRhizohLLM` veya yeni taşıyıcı ile **aynı merge anları** hedeflenir | Taslak |

---

## 2. Merge anları (sıra ile)

**M0 — Oturum okuma (LLM öncesi)**  
- `loadRhizohProductSession(disk meta)` → **`sessionId`** payload’a (`rhizohProductOrchestration` / `contForLlm.runtime`).  
- Kaynak: LS `rhizoh.product.session.v1` ⟷ `continuity.meta.rhizohProductSessionV1` — **`pickNewer(updatedAt)`** (`rhizohProductSessionPersistenceV1.js`).

**M1 — Continuity payload**  
- `buildContinuityPayload(userMessage)` → `continuityRef.current` öncelik, yoksa disk `rhizoh.continuity.v1` **`turns` / `meta`**.  
- Bu an: **konuşma hafızası** anchor’ı okunur (ref + disk).

**M2 — Gateway tur kimliği**  
- POST gateway Rhizoh LLM → `rhizohGatewayTurn` içinde **`traceId = randomUUID()`** (sunucu).  
- İstemci istek gövdesinde **client `traceId` üretmez** (mevcut kod).

**M3 — Yanıt + ürün aynası (metin)**  
- `handleExecute`: UI **`TRC-*`** üretilir (özet kart / GreenRoom öncesi); yanıtta **`out.traceId`** (gateway).  
- `setCommandLog`, `setLastIntentRaw`, bayraklar vb.  
- `persistContinuityTurn(..., traceId: traceId || out.traceId || "")` → **M4**.

**M3′ — Yanıt + ürün aynası (ses)**  
- `handleVoiceTranscript`: UI `TRC-*` **yok**; persist **`out.traceId`** ile gider.  
- Aynı `setCommandLog` / bayraklar (ürün simetrisi sonrası).

**M4 — Kalıcı continuity yazımı**  
- `persistContinuityTurn` → `turns` append, `meta` (weighted turns, social, `rhizohProductSessionV1` snapshot, …), `writeClientContinuity` + **`syncClientContinuityRef`**.  
- Bu an: **hafıza SSOT** güncellenir; bir sonraki tur **M1** bunu okur.

---

## 3. Diyagram (yüksek seviye)

```mermaid
flowchart TB
  subgraph in [Input]
    TXT[Text: handleExecute]
    VOX[Voice: handleVoiceTranscript]
  end
  subgraph m0m1 [Pre-LLM merge]
    S0[loadRhizohProductSession → sessionId]
    C1[buildContinuityPayload → ref || disk turns/meta]
  end
  subgraph gw [Gateway]
    Q[queryRhizohLLM POST]
    T2[traceId = randomUUID per turn]
  end
  subgraph post [Post-LLM]
    UI[Product mirror: log flags intent HUD]
    P4[persistContinuityTurn → disk + syncClientContinuityRef]
  end
  TXT --> S0
  VOX --> S0
  TXT --> C1
  VOX --> C1
  S0 --> Q
  C1 --> Q
  Q --> T2
  T2 --> UI
  UI --> P4
  TXT -.->|optional TRC-*| UI
```

---

## 4. Bilinçli boşluklar (şimdilik çözülmeyen)

- **Client `traceId` → gateway:** İstekle gönderilmiyor; sunucu her zaman yeni UUID.  
- **`sessionId` ↔ gateway `traceId`:** İstek/yanıtta zorunlu parent-child alanı yok (V1+ ürün kararı).  
- **WebSocket:** Bu dosyada ayrı merge düğümü tanımlanmadı; eklendiğinde **M1 / M4** ile hizalanmalıdır.

---



*V0 — Runtime identity resolution flow; kod değişince güncellenir.*

