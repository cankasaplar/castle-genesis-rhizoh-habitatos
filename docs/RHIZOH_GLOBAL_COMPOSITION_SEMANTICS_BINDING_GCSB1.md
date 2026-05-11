# Rhizoh — Global Composition Semantics Binding (GCSB-1)

**Rol:** RRHP sonrası parçalı iyileşmiş chart'ların anlamını tek ve geri kazanılabilir bir yorumda dikişleyen bağlama katmanı (*meaning stitching*). Bu belge, [GLOBAL_COMPOSITION_SEMANTICS_BINDING_V1](GLOBAL_COMPOSITION_SEMANTICS_BINDING_V1.md) ile uyumlu Rhizoh-bağlamı yol haritasıdır.

**Durum:** `PLANNED` — bağlama teorisi; instantiation açık.

**IBT’ye alternatif değil:** GCSB-1, “**ben**” yerine **semantic equivalence space** tanımlar — *ben olarak kabul edilen semantic trajectory seti* ([DRAS §18.1](RHIZOH_DISTRIBUTED_REALITY_AXIOMATIC_SYSTEM_DRAS_V1.md)). Kimlik bağlama ([IBT-1](RHIZOH_IDENTITY_BINDING_THEORY_IBT1.md)) ile **birlikte** okunur; birbirinin yerine geçmez.

**Yürütüm:** Anlam taşıyıcısı, **[Identity execution substrate — DRAS §18.9](RHIZOH_DISTRIBUTED_REALITY_AXIOMATIC_SYSTEM_DRAS_V1.md)** içindeki **identity state representation** ve **entropy threshold** döngüsüyle aynı zeminde somutlaşır (RRHP **runtime** ayrımı §18.9’da).

## Çekirdek soru

Reconcile/merge sonrası:

- aynı olay farklı semantik yüzeylerde nasıl tek yoruma bağlanır?
- hangi semantik parçalar korunur, hangileri degrade edilir?
- bounded inconsistency altında meaning continuity nasıl raporlanır?

## Kısa kapsam

- RRHP merge çıktıları için semantic stitching contract
- Identity binding ile semantik çelişki çözümü
- Operasyonel görünürlük (SR-1) ve hafıza sürekliliği (TMC-1) entegrasyonu

## Sonraki somut adım (öneri): semantic manifold equivalence classes

**Hedef:** RRHP sonrası çoklu chart / çoklu yorum yüzeyinde, anlamı **denklik sınıfları** (equivalence classes) olarak sabitleyen **semantic manifold** üzerinde “hangi okumalar aynı bileşik anlam” sorusunu **fizik diliyle** yazmak. Bu yazılmadan GCSB-1 **isimlendirilmiş** kalır; [DRAS §18.1](RHIZOH_DISTRIBUTED_REALITY_AXIOMATIC_SYSTEM_DRAS_V1.md) ile uyumlu.

## Kaçınılmaz formalizasyon (DRAS §18.7 — GCSB tarafı)

**Equivalence class boundary conditions:** aynı bileşik anlam sınıfının **içi / sınırı / dışı** — sınırda anlamın nasıl **kırıldığı**, degrade olduğu veya çoklu okumaya **ayrıldığı** koşullar. Bu yazılmadan §18.7’deki **üçlü kapanışın** GCSB ayağı tamamlanmış sayılmaz ([DRAS §18.7(2)](RHIZOH_DISTRIBUTED_REALITY_AXIOMATIC_SYSTEM_DRAS_V1.md)).

İlişkili: [RRHP](RHIZOH_REALITY_RECONCILIATION_HEALING_PHYSICS_V1.md) · [Identity stub](RHIZOH_IDENTITY_UNDER_HEALING_CONTINUITY_V1.md) · [IBT-1](RHIZOH_IDENTITY_BINDING_THEORY_IBT1.md) · [CSB-1](GLOBAL_COMPOSITION_SEMANTICS_BINDING_V1.md)
