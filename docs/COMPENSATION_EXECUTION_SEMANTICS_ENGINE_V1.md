# Compensation Execution Semantics Engine (CESE-1)

**Durum:** Canonical spec — **runtime binding**: CEE çıktısı (artefakt) → **AEE apply enjeksiyonu**, kısmi kurtarma yürütmesi, çoklu amendment mutabakatı ve **deterministik onarım sırası**.  
**Kod:** `scripts/ceseRepairOrdering.mjs` (sıralama); `scripts/fixtures/cese-runtime-artifact.sample.json` (CRA örneği).  
**Sürüm:** CESE-1  
**İlişkili:** [`CESE_AEE_CLOSED_LOOP_FEEDBACK_V1.md`](CESE_AEE_CLOSED_LOOP_FEEDBACK_V1.md) (CLFB-1 — outcome → CRA, retry, amendment-only sıra) · [`COMPENSATION_EXECUTION_ENGINE_V1.md`](COMPENSATION_EXECUTION_ENGINE_V1.md) · [`APPLY_SEMANTICS_ENGINE_V1.md`](APPLY_SEMANTICS_ENGINE_V1.md) · [`AEE_RUNTIME_STATE_MACHINE_V1.md`](AEE_RUNTIME_STATE_MACHINE_V1.md) · [`EPISTEMIC_PHASE2_EXECUTION_VALIDATION_V1.md`](EPISTEMIC_PHASE2_EXECUTION_VALIDATION_V1.md)

---

## 1. Katman ayrımı

| Katman | Rol |
|--------|-----|
| **CEE-1** | Telafi *sözü* — markdown/insan süreci, şablon üretimi. |
| **CESE-1 (bu belge)** | Telafi *çalışma zamanı anlamı* — artefaktı AEE hattına **bağlama**, sıra, kısmi kurtarma adımları. |
| **AEE / ARSM** | Parse → verify → (ileride) apply — CESE **enjekte edilen** faz sırasını ve önkoşulları taşır. |
| **CLFB-1** | AEE **outcome** → CRA güncelleme + retry sözleşmesi; sıra değişimi yalnız **amendment** ile. |

CESE **dosya yazmaz**; üretilen **plan** deterministik JSON’dur (CI / orchestrator / insan aynı sırayı türetir). **Kapalı döngü:** [`CESE_AEE_CLOSED_LOOP_FEEDBACK_V1.md`](CESE_AEE_CLOSED_LOOP_FEEDBACK_V1.md).

---

## 2. CEE Runtime Artifact (CRA) v1

CEE markdown’dan veya otomasyondan türetilen **makine-okur** kayıt. AEE’ye enjeksiyonun kaynağı. **Kimlik vs state:** [`CLFB-1` §1](CESE_AEE_CLOSED_LOOP_FEEDBACK_V1.md) — CRA düğümü **identity chain** nesnesi; `amendmentId` / `compensationOf` / `priorCraAnchor` outcome ile **değişmez**.

```json
{
  "craVersion": "1.0",
  "priorCraAnchor": "commit:… | null (ilk düğüm)",
  "ceeArtifactId": "CRA-unique-id",
  "amendmentId": "CIL-AMENDMENT id ile aynı",
  "compensationOf": "EP2-1-X veya boş",
  "priorAnchor": "commit:… veya genesis:…",
  "failureContext": { "codes": ["ASE_ATOMIC_VIOLATION"], "aeeRunState": "FAILED" },
  "targetsRemaining": ["docs/a.md"],
  "targetsReverted": [],
  "partialRecovery": {
    "mode": "ATOMIC_GAP_CLOSE | BEST_EFFORT_RECONCILE",
    "inventoryCommit": "commit:… | null"
  },
  "retryPolicy": { "name": "IDEMPOTENT_REPLAY", "maxRetries": 2 },
  "inject": {
    "aeePhases": ["parse", "verify", "apply_git", "post_verify"],
    "failFast": true
  }
}
```

**Zorunlu:** `craVersion`, `ceeArtifactId`, `amendmentId`, `priorAnchor`, `inject.aeePhases` (en az bir faz). `priorCraAnchor` iterasyon 2+ için önerilir.

**Not:** Tam şema doğrulaması ileride `validateCra.mjs`; şimdilik CESE sıralayıcı ve doküman sözleşmesi.

---

## 3. CRA → AEE apply injection (runtime binding)

| CRA alanı | AEE / ARSM bağlantısı |
|-----------|------------------------|
| `inject.aeePhases` | Hangi adımların **zorunlu** çalıştırılacağı (ör. verify önce, apply sonra). |
| `inject.failFast` | İlk kırmızıda dur; kısmi ilerleme yok (ATOMIC ile hizalı). |
| `failureContext.aeeRunState` | Önceki koşunun son durumu — `apply_start` öncesi **idempotency** kontrolü. |
| `partialRecovery` | `TARGETS_RESOLVED` sonrası **gap** kapatma; ASE-1 §4 ile hizalı. |
| `targetsRemaining` | Apply hedef kümesi; ASE **atomik** birleşim. |

**Enjeksiyon akışı (mantıksal):**

1. `RECEIVED` — CRA + repo snapshot referansı.  
2. `PARSED` … `VERIFIED` — mevcut `validateCilAmendment` + hook’lar; CRA `inject.aeePhases` içeriyorsa **ek** doğrulayıcılar (ileride).  
3. `apply_start` — yalnız CRA + insan onayı + ASE önkoşulları sağ.  
4. `APPLYING` → `APPLIED` — git/artefakt; sonra `post_verify` fazı varsa tekrar doğrulama.

CESE **AEE kodunu değiştirmez**; **orchestration sözleşmesi** sunar (GitHub Action / iç runner aynı sırayı uygular).

---

## 4. Partial recovery execution

| Mod | Çalışma zamanı anlamı |
|-----|------------------------|
| **ATOMIC_GAP_CLOSE** | `targetsRemaining` tam kapanana kadar apply **tek transaction** (PR) olarak kalır. |
| **BEST_EFFORT_RECONCILE** | Envanter commit’i (`inventoryCommit`) ile **kanıtlanmış** kısmi durum; sonraki CRA ile gap listesi güncellenir. |

**Idempotency anahtarı (öneri):** `sha256(canonicalJson({ priorAnchor, targetsRemaining, compensationOf, inventoryCommit }))` — aynı anahtar tekrar koşuda **aynı plan**ı üretir.

**Checkpoint:** Her başarılı faz sonunda (ileride) `CESE_CHECKPOINT` JSON artefaktı — TAL’a pointer; ECG’ye **otomatik yazım yok**.

---

## 5. Multi-amendment reconciliation runtime

Aynı batch’te birden fazla CRA / bekleyen amendment:

| Kural | Açıklama |
|--------|-----------|
| **Bağımlılık** | `compensationOf === X` ise X **önce** çözülmüş veya aynı batch’te X’ten **önce** sıralanır (X başarısızlığı bilinir). |
| **Döngü** | `compensationOf` zinciri döngüsel → `CESE_ORDER_CYCLE`; merge **yasak**; insan hakem. |
| **Topolojik + tie-break** | Bkz. §6. |

Çakışan `targetsRemaining` (iki CRA aynı dosyayı farklı yamalar) → `CESE_TARGET_CONTENTION`; çözüm: CEE-1 steward merge veya tek CRA birleşimi.

---

## 6. Deterministik repair ordering

**Girdi:** `RepairItem[]` — `{ id, compensationOf?: string | null, priorAnchor: string }`

**Çıktı:** Topolojik sıra; eşdeğerler için sabit tie-break.

**Algoritma (CESE-1 resmi):**

1. `byId` haritası oluştur.  
2. Her düğüm için `depth`: `compensationOf` yok veya listede yok → `0`; aksi halde `1 + depth(compensationOf)` (memo + döngü tespiti).  
3. Döngü varsa → hata.  
4. Sıralama anahtarı: `(depth asc, priorAnchor asc, id asc)` — string karşılaştırma UTF-8 bayt lex veya Unicode code point (implementasyon: `localeCompare('en')` **yasak**; `String.prototype.localeCompare` yerine basit `a < b ? -1 : a > b ? 1 : 0` veya `compareUTF8`).  
5. **Determinizm:** Aynı girdi → her platformda aynı sıra; Node’da `a.localeCompare(b, 'en', { sensitivity: 'variant' })` platforma göre değişebilir — bu yüzden **basit kod noktası** veya **byte** sırası kullan.

Repo implementasyonu: `scripts/ceseRepairOrdering.mjs` — `compareDeterministic(a, b)` = `a === b ? 0 : a < b ? -1 : 1` (JavaScript string karşılaştırması UTF-16 code unit — dokümanda “JS string `<` sırası” diye not).

**CLI:** `npm run epistemic:cese-order -- --file scripts/fixtures/cese-ordering-items.json`

---

## 7. Reason codes (CESE)

| Kod | Anlam |
|-----|--------|
| `CESE_ORDER_CYCLE` | compensationOf zincirinde döngü |
| `CESE_TARGET_CONTENTION` | İki CRA aynı hedefi uyumsuz yamalar |
| `CESE_CRA_INVALID` | CRA şema / zorunlu alan |
| `CESE_INJECT_PHASE_UNKNOWN` | inject.aeePhases bilinmeyen faz |
| `CESE_IDEMPOTENCY_MISMATCH` | Aynı anahtar, farklı hedef listesi |

---

## 8. Mutation policy

CESE-1 güncellemeleri append-only; CRA v2 ayrı `craVersion`. **AEE sonucundan CRA’ya geri besleme** ve sıra kısıtı: [`CLFB-1`](CESE_AEE_CLOSED_LOOP_FEEDBACK_V1.md).

---

*CESE-1 — CEE artifact → AEE injection + partial recovery + multi-amendment reconcile + deterministic order.*
