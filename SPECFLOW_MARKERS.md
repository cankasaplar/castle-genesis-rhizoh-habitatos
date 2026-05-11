# Specflow markers — core vs research boundary

Bu dosya, backlog ve sprint maddelerinin **Executable Core** (repo + CI ile korunan gerçeklik) ile **Specification / Research Layer** (belge, hipotez, gelecek kanıt) arasında **yanlışlıkla karışmasını** önlemek için kullanılır.

İlişkili belgeler: [`STABILIZATION.md`](STABILIZATION.md), [`STABILIZATION_GRAPH.md`](STABILIZATION_GRAPH.md), [`docs/SPRINT_PREP_ACADEMIC_ROBOTICS_FROZEN_CORE.md`](docs/SPRINT_PREP_ACADEMIC_ROBOTICS_FROZEN_CORE.md), [`docs/ARCHITECTURE_POST_FREEZE_SUMMARY.md`](docs/ARCHITECTURE_POST_FREEZE_SUMMARY.md).

**Habitat (kalıcı görev bağlamı):** [`AGENTS.md`](AGENTS.md), [`.cursor/rules/frozen-core-habitat.mdc`](.cursor/rules/frozen-core-habitat.mdc), [`docs/SPRINT_HABITAT_ACADEMIC.md`](docs/SPRINT_HABITAT_ACADEMIC.md), [`docs/HABITAT_COLLABORATION_ACADEMIC.md`](docs/HABITAT_COLLABORATION_ACADEMIC.md), [`docs/SPRINT_BOOTSTRAP_TEMPLATE.md`](docs/SPRINT_BOOTSTRAP_TEMPLATE.md), [`docs/CONTEXT_RECONSTRUCTION_PROMPT.md`](docs/CONTEXT_RECONSTRUCTION_PROMPT.md), [`docs/ASSET_CONTRACT_SPEC.md`](docs/ASSET_CONTRACT_SPEC.md), [`docs/ASSET_CONTRACT_V1_TO_WORLD_MODEL_MAPPING.md`](docs/ASSET_CONTRACT_V1_TO_WORLD_MODEL_MAPPING.md) (kontrat → world model / observed-state taslağı — `RESEARCH-ONLY` / `FUTURE-PROOF-ONLY`).

**Observation fabric & layer expansion:** [`docs/OBSERVATION_FABRIC_V1.md`](docs/OBSERVATION_FABRIC_V1.md), [`docs/LAYER_EXPANSION_PROTOCOL.md`](docs/LAYER_EXPANSION_PROTOCOL.md), [`docs/AGENT_IDENTITY_AND_ATTRIBUTION.md`](docs/AGENT_IDENTITY_AND_ATTRIBUTION.md), [`docs/WORLDSTATE_V0_SPEC.md`](docs/WORLDSTATE_V0_SPEC.md).

---

## Policy vs otomasyon (net sınır)

| Ne | Durum |
|----|--------|
| **Yapısal gerçeklik** (DAG, hash, import) | `validateStabilizationGraph.mjs` + CI — **makine tarafından zorunlu** |
| **SPECFLOW belge bütünlüğü** (üç etiket, çapraz linkler) | `validateSpecflowCoherence.mjs` + CI — **policy dokümanının silinmesi / sözlüğün bozulması** yakalanır |
| **PR/Issue üzerinde `CORE-ELIGIBLE` vs `RESEARCH-ONLY` etiketi** | Varsayılan olarak **insan süreci**; ileride GitHub Action ile “frozen path değiştiyse şu label zorunlu” eklenebilir |

Dolayısıyla “research’ün yanlışlıkla core’a sızması” pratikte **graf kilidi + review disiplini + etiket politikası** ile düşük risk; **%100 otomatik** ise PR-label gate eklenene kadar abartılı bir iddia olur.

---

## Ne “Core”, ne “değil”

| Alan | Core’a ait | Core’a ait değil |
|------|------------|------------------|
| v563–v570 frozen faz modülleri (`apps/client/src/ghost/phase*.js` ilgili zincir) | ✔ bakım seviyesi değişiklik | ✔ yeni özellik / topoloji değişimi (→ v571+ veya experimental) |
| `validateStabilizationGraph.mjs`, graf hash lock, CI gate | ✔ | ✔ bu araçları bypass eden “kolay yol” |
| `STABILIZATION_GRAPH.md` + `stabilization-graph.sha256.lock` | ✔ doc–hash uyumu zorunlu | ✔ grafı güncellemeden kod kenarı değiştirmek |
| L0 / L1 / L6–7 / L12 / L13 gibi anlatı katmanları | ⚠ yalnızca mental / roadmap haritası | ✔ core’un parçası sanılırsa **semantic drift** riski |
| SAT / SMT tam seslik, encoding kanıtı, model-checker invariant proof | | ✔ research / ayrı sprint kanıtı |
| Digital twin performans garantisi, üretim ölçeği SLA | | ✔ ölçüm + staging ile doğrulanmadıkça core iddiası değil |

---

## Sprint / issue etiketleri

Her iş kalemi için **tam olarak birincil** etiket seçin (gerekirse ikincil not Issues / PR açıklamasında).

### `CORE-ELIGIBLE`

- Frozen core sınırına **dokunabilir** ancak yalnızca [`STABILIZATION.md`](STABILIZATION.md) içindeki **izinli değişiklik** türlerinden olmalıdır (bugfix, test, determinizm, yorum, graf/script ile uyumlu doc güncellemesi).
- PR: `npm run stabilization:validate-graph` yeşil; graf doc değiştiyse hash lock aynı commit’te.

### `RESEARCH-ONLY`

- Akademik yazım, formalizasyon taslağı, deney, kanıt **hipotezi**, L-katmanı mapping genişletmesi.
- **Frozen core dosyalarına** davranış değişikliği içeren merge **yok**; çıktı genelde `docs/` veya `experimental/` veya v571+ yolu.

### `FUTURE-PROOF-ONLY`

- Tasarım kararı, ADR, API şekli, “ileride şunu bağlarız” notu; **şu an implementasyon veya core garantisi üretmez**.
- Üretim iddiası veya CI gate ile karıştırılmamalıdır.

---

## Çekirdek kural (tek cümle)

**Executable truth** yalnızca repo + doğrulayıcı + freeze politikasında tanımlıdır; **speculative truth** etiketli işler core’a sızmamalıdır.

---

## Özet

| Etiket | Core merge | Örnek |
|--------|------------|--------|
| `CORE-ELIGIBLE` | İzinli bakım çerçevesinde evet | Vitest, drift testi, yorum/determinizm |
| `RESEARCH-ONLY` | Hayır (davranış) | SMT encoding makalesi, MFA varsayımları |
| `FUTURE-PROOF-ONLY` | Hayır | Roadmap ADR, ticari senaryo taslağı |

*Separated executable truth from speculative truth — bu dosyanın amacı budur.*
