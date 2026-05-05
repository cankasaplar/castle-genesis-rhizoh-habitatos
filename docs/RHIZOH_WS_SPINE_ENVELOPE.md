# Rhizoh spine — WebSocket envelope (minimal)

Amaç: **yeni kabuk uydurmamak**; dış taşıyıcı her zaman `@castle/protocol` **`createEnvelope(type, payload)`** ile aynı:

```json
{
  "type": "WORLD_PATCH",
  "ts": 1714720000000,
  "payload": {
    "v": 1,
    "traceId": "uuid",
    "source": "rhizoh.gateway",
    "scope": "global",
    "patch": {}
  }
}
```

- **`type`**: `WS_MESSAGE` sabitlerinden biri (aşağıda).
- **`ts`**: milisaniye (sunucu üretir).
- **`payload`**: Rhizoh spine meta + tip-özel gövde.

Üretim için `createRhizohSpineEnvelope(type, fields)` kullanın; `fields` içindeki `traceId`, `source`, `scope` ve kalan anahtarlar `payload` içine normalize edilir.

## Mesaj tipleri (`WS_MESSAGE`)

| `type` | Kullanım |
|--------|----------|
| `WORLD_PATCH` | Dünya / sahnenin kısmi güncellemesi |
| `PRESENCE_UPDATE` | Oda / kullanıcı presence |
| `ENTITY_EVENT` | Varlık (GhostPet, scout, …) olayı |
| `REALITY_PATCH` | Geo / hava / ADS-B vb. enjeksiyon |
| `SYSTEM_NOTICE` | Bakım, sürüm, rate-limit uyarısı |

## `payload` ortak alanlar

| Alan | Zorunlu | Açıklama |
|------|---------|----------|
| `v` | evet | Şema sürümü; şimdilik `1` |
| `traceId` | önerilir | HTTP `/rhizoh/llm` ile aynı UUID (korelasyon) |
| `source` | hayır | Varsayılan `rhizoh.gateway` |
| `scope` | hayır | `user` \| `room` \| `global` — `RHIZOH_SPINE_SCOPE` |

Tip-özel: örn. `WORLD_PATCH` → `patch: { ... }`, `ENTITY_EVENT` → `entityId`, `event`, `data`, vb.

## Örnekler

**WORLD_PATCH**

```js
import { WS_MESSAGE, createRhizohSpineEnvelope, RHIZOH_SPINE_SCOPE } from "@castle/protocol";

const msg = createRhizohSpineEnvelope(WS_MESSAGE.WORLD_PATCH, {
  traceId: "550e8400-e29b-41d4-a716-446655440000",
  scope: RHIZOH_SPINE_SCOPE.ROOM,
  patch: { roomId: "studio-main", layers: ["intent_hint"] }
});
// JSON.stringify(msg) → WS gönder
```

**PRESENCE_UPDATE**

```js
createRhizohSpineEnvelope(WS_MESSAGE.PRESENCE_UPDATE, {
  traceId,
  scope: "user",
  userId: "…",
  state: { phase: "awake", energy: 0.82 }
});
```

## İstemci tarafı

1. WS mesajını `safeJsonParse` + `parsed.type` ile ayır.
2. Yukarıdaki tipler için ortak handler: `payload.v`, `payload.traceId`, `payload.scope` oku; sonra tip switch → kernel / Cesium / entity pipeline.

## Gateway’de yayın

Şu an **zorunlu otomatik yayın yok**. İleride eklenecekse ortam: **`CASTLE_RHIZOH_WS_EMIT_PATCH=1`** (MVP freeze’de **`0`** — `render.yaml` ve `apps/gateway/.env.production.example`).

## İlgili doküman

- Omurga HTTP + telemetry: `docs/RHIZOH_SPINE_MVP.md`
