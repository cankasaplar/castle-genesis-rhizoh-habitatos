# Agent & habitat context — Castle / Rhizoh

Bu repo için **kalıcı yürütme bağlamı** Cursor kurallarında tanımlıdır: [`.cursor/rules/frozen-core-habitat.mdc`](.cursor/rules/frozen-core-habitat.mdc). Cursor Agent’ın bu workspace’teki rol özeti: [`docs/CURSOR_AGENT_INTRO.md`](docs/CURSOR_AGENT_INTRO.md).

## Execution bias vs execution engine (ince çizgi)

| Katman | Rol |
|--------|-----|
| **Execution engine** | Derlenen / çalışan kod: özellikle **v562–v570** frozen subgraph + gerçek runtime |
| **Soft execution policy / bias** | `.cursor/rules`, bu dosya, habitat dokümanları — **ajan ve insanın neye öncelik vereceğini** ve hangi dosyalara dokunulacağını şekillendirir; **motor değildir**, CI graf doğrulayıcısının yerini almaz |

**Tek cümle (koordinasyon):** Frozen core üzerinde **multi-habitat epistemik işbirliği** — aynı kod tabanında **bağlama göre düşünme modları**, çekirdek sabit.

**Çoklu gözlemci (execution değil):** [`docs/OBSERVATION_FABRIC_V1.md`](docs/OBSERVATION_FABRIC_V1.md) — *Agents may influence interpretation, never execution.*

**Katman genişlemesi (core’u yeniden tanımlamadan):** [`docs/LAYER_EXPANSION_PROTOCOL.md`](docs/LAYER_EXPANSION_PROTOCOL.md)

**Kimlik / mühür / attribution:** [`docs/AGENT_IDENTITY_AND_ATTRIBUTION.md`](docs/AGENT_IDENTITY_AND_ATTRIBUTION.md)

**Laboratuvar evren snapshot’ı (replay/diff):** [`docs/WORLDSTATE_V0_SPEC.md`](docs/WORLDSTATE_V0_SPEC.md) · [`docs/schemas/worldstate-v0.schema.json`](docs/schemas/worldstate-v0.schema.json)

## Özet

| Katman | Ne |
|--------|-----|
| **Executable** | v562–v570 frozen faz zinciri + DAG/hash doğrulama |
| **Spec / policy** | `STABILIZATION.md`, `SPECFLOW_MARKERS.md`, ilgili CI scriptleri |
| **Epistemik alt hat** | v567–v570 deterministik güven / drift / anlambilim |
| **Habitat** | Sprint bazlı çalışma modu — dokümanda sabit |

## Aktif habitat dokümanları

- **Academic sprint:** [`docs/SPRINT_HABITAT_ACADEMIC.md`](docs/SPRINT_HABITAT_ACADEMIC.md)
- **Ortak öğrenme (sen + Nisa + Cursor + harici LLM / sıkı academic reviewer):** [`docs/HABITAT_COLLABORATION_ACADEMIC.md`](docs/HABITAT_COLLABORATION_ACADEMIC.md)
- **Oturum günlüğü (karar izi):** [`docs/academic/SESSION_LOG.md`](docs/academic/SESSION_LOG.md)
- **Sprint bootstrap şablonu:** [`docs/SPRINT_BOOTSTRAP_TEMPLATE.md`](docs/SPRINT_BOOTSTRAP_TEMPLATE.md)
- **Bağlam yeniden kurulum (Nisa / Cursor / review):** [`docs/CONTEXT_RECONSTRUCTION_PROMPT.md`](docs/CONTEXT_RECONSTRUCTION_PROMPT.md)
- **3D asset kontratı (semantic-first, üretim öncesi):** [`docs/ASSET_CONTRACT_SPEC.md`](docs/ASSET_CONTRACT_SPEC.md) · [`docs/ASSET_CONTRACT_V1_TO_WORLD_MODEL_MAPPING.md`](docs/ASSET_CONTRACT_V1_TO_WORLD_MODEL_MAPPING.md)

## Mimari özet (post-freeze)

[`docs/ARCHITECTURE_POST_FREEZE_SUMMARY.md`](docs/ARCHITECTURE_POST_FREEZE_SUMMARY.md)

## Related Operational Guides

- [Cursor Team Onboarding](docs/CURSOR_TEAM_ONBOARDING_CHECKLIST.md) — reference-layer, non-authoritative
