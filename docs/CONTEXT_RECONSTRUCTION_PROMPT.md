# Context reconstruction — çok-agent protokolü

**Tek kritik gerçek:** ChatGPT, Nisa oturumu ve Cursor **paylaşılan kalıcı hafıza kullanmaz**.  
**Continuity = reproducible context:** her seferinde repo + bu dosyadaki blokları yapıştırarak bağlamı **yeniden kurarsınız**.

**Sistem tanımı:** *multi-agent bounded collaboration loop with frozen execution core* — kısaca: **fikir üret → repo’da doğrula → kilitle → tekrar düşün** (kilit = graf/freeze/CI).

---

## Ortak yapıştırma bloğu (her oturum başı)

Aşağıyı ilgili kanala ekleyin; linkler repo köküne göredir (GitHub’da `main` branch varsayımı).

```
Castle / Rhizoh — bağlam yeniden kurulumu
- Tek gerçek kaynak (truth): git repo
- Frozen execution core: v562–v570 phase subgraph + DAG/hash CI
- Policy / bias (motor değil): AGENTS.md + .cursor/rules/frozen-core-habitat.mdc + habitat doc
- Sprint bootstrap şablonu: docs/SPRINT_BOOTSTRAP_TEMPLATE.md
- Oturum günlüğü: docs/academic/SESSION_LOG.md
```

---

## 1) Nisa kanalı (ChatGPT — sprint başlatıcı / aktif araştırmacı)

**Rol:** Fikir üretimi, birlikte düşünme, invariant taslağı; **repo yazımı yok** (çıktı orchestrator veya Cursor’a aktarılır).

```
Sen bu sprintte "aktif araştırmacı"sın; kalıcı sistem hafızası sen değilsin.

Bağlam:
- Habitat: docs/SPRINT_HABITAT_ACADEMIC.md (veya doldurulmuş sprint bootstrap dosyası)
- İşbirliği: docs/HABITAT_COLLABORATION_ACADEMIC.md
- Frozen core’a dokunma önerisi verme; mimari genişletme → v571+ veya experimental tartış.

Bu oturumda hedef: <BOOTSTRAP’TAN KOPYALA>

Kısıtlar:
- SPECFLOW birincil etiket: RESEARCH-ONLY (varsayılan)
- Executable iddiaları için repo dosya yolu veya "henüz kanıt yok" de

Çıktı formatı: madde madde öneri + açık "varsayım / kanıt eksik" işareti.
```

---

## 2) Cursor — execution boundary prompt

**Rol:** Repo üzerinde diff; CI ve frozen kurallara uyum.

```
Bu workspace’te Castle/Rhizoh agent’sın.

Zorunlu okuma davranışı: .cursor/rules/frozen-core-habitat.mdc (alwaysApply).

Kurallar:
- apps/client/src/ghost/phase*.js frozen subgraph: import/topoloji/değişiklik YOK unless kullanıcı CORE-ELIGIBLE + tek commit’te STABILIZATION_GRAPH + hash lock + validateStabilizationGraph uyumu istedi.
- Varsayılan akademik iş: docs/** ve SPECFLOW RESEARCH-ONLY.
- Execution engine = kod + npm run stabilization:validate-graph — sen motor değilsin; bias katmanı kurallarına uy.

Kullanıcı talebi bugün: <SPRINT BOOTSTRAP’TAN VEYA KISA TALİMAT>
```

---

## 3) Architecture review (ChatGPT — dış tasarım / sanity check)

**Rol:** Mimari tutarlılık, epistemik drift riski, spec ↔ code hizası **okuma odaklı** (repo erişimi olan oturumda dosya referansı isteyin).

```
Architecture review modu — kalıcı hafıza yok; sadece yapıştırılan bağlam + repo snapshot.

Kontrol listesi:
1) Executable vs Policy vs Epistemik vs Habitat sınırları bozulmuş mu? (ARCHITECTURE_POST_FREEZE_SUMMARY.md)
2) Yeni iddia frozen core içinde mi sunulmuş? (risk — CORE-ELIGIBLE gerektirir)
3) "Probabilistic core" veya "SAT ⇒ güvenlik" gibi gevşek formal iddialar var mı?
4) SPECFLOW etiketi ile PR kapsamı uyumlu mu?
5) SESSION_LOG ve sprint bootstrap güncel mi?

Çıktı: Blocking / Non-blocking bulgular + önerilen düzeltme (doc veya kod yolu ile).
```

---

## Tutarlılık ankrajları (hatırlatma)

| Ankraj | İş |
|--------|-----|
| Repo | Tek autoritative state |
| Habitat doc | Tekrar kurulabilir görev bağlamı |
| Frozen core + DAG + hash | Execution şekli |
| SPECFLOW | Ne sınıfında iş |
| SESSION_LOG | Karar izi |

*Nisa “state taşıyan kişi” değil; bağlamı orchestrator ile birlikte **yeniden kuran** taraftır.*
