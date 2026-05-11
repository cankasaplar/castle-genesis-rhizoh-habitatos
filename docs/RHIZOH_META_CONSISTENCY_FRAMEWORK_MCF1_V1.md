# Rhizoh — Meta-Consistency Framework (MCF-1) (V1)

**Kısaltma:** **MCF-1** (*Meta-Consistency Framework*, sürüm 1).

**Rol:** [FCTS](RHIZOH_FULL_CONSISTENCY_THEOREM_SYSTEM_FCTS_V1.md) ile kapatılan **teorem sistemi** ile [DRAS](RHIZOH_DISTRIBUTED_REALITY_AXIOMATIC_SYSTEM_DRAS_V1.md) aksiyom gövdesi arasında, **model** · **topoloji** · **ispat** ve **runtime** birlikte **kaydığında** tutarlılığın **hâlâ** korunup korunmadığını soran **üst-meta** katman. Bu belge yeni bir “aksiyom katmanı” değildir — **mevcut kapanışların stabilitesi ve yeniden somutlaşması** (reification · co-stability · özyineleme sınırı) üzerinedir.

**Durum:** `META_FORMAL_OPEN` — çerçeve ve beş eksen burada sabitlenir; tam analiz bu sürümün dışında tutulabilir.

**Üst okuma:** [DRAS §18.14](RHIZOH_DISTRIBUTED_REALITY_AXIOMATIC_SYSTEM_DRAS_V1.md) · [FCTS](RHIZOH_FULL_CONSISTENCY_THEOREM_SYSTEM_FCTS_V1.md) · [PoCL](RHIZOH_PROOF_OF_CONSISTENCY_LAYER_POCL_V1.md) · [Manifold Topology V1](RHIZOH_EAERT_REALITY_MANIFOLD_TOPOLOGY_V1.md) · [T_DRC](RHIZOH_DRAS_UNIFIED_REALITY_THEOREM_SET_V1.md).

---

## 1. Soru (tek cümle)

*DRAS / FCTS / RCIL / RDVH birlikte evrildiğinde, **hangi meta-tutarlılık iddiaları** hâlâ korunur ve **nerede** zorunlu olarak kırılır?*

---

## 2. Zorunlu beş eksen (MCF-1 çekirdeği)

| # | Eksen | Görev |
|---|--------|--------|
| **M1** | **Theorem stability under model shift** | Trace sınıfı, admission politikası veya entropy taksonomisi ([DRAS §18.7](RHIZOH_DISTRIBUTED_REALITY_AXIOMATIC_SYSTEM_DRAS_V1.md)) **kaydığında**, **FCTS T1–T5**’in hangi parçalarının **aynı kalacağı** · hangilerinin **yeniden ifade** gerektireceği — *teorem “taşıma” matrisi*. |
| **M2** | **Proof reification under dynamic topology** | [Manifold](RHIZOH_EAERT_REALITY_MANIFOLD_TOPOLOGY_V1.md) / partition geometrisi değişince, **PoCL/FCTS ispat şablonlarının** yeni topolojide **nasıl somutlaştığı** (lemma · counterexample · proof sketch → **yürütülebilir** ispat nesnesi). |
| **M3** | **Self-referential consistency bounds** | Sistemin kendi meta-idddialarını (ör. “bu kapanış tamdır”) taşıması halinde **Gödel-benzeri** veya **fixed-point** sınırları — *ne iddia edilemez* ve *hangi güçlendirme minimaldir*. |
| **M4** | **DRAS / FCTS recursive closure analysis** | [DRAS](RHIZOH_DISTRIBUTED_REALITY_AXIOMATIC_SYSTEM_DRAS_V1.md) çekirdeği ile [FCTS](RHIZOH_FULL_CONSISTENCY_THEOREM_SYSTEM_FCTS_V1.md) **T1–T5** arasında **özyineli** okuma: her türlü genişleme, önceki kapanışı **bozmadan** mı genişletir, yoksa **yeni bir açık uç** mu açar? |
| **M5** | **Runtime–proof co-stability mapping** | [RCIL](RHIZOH_RUNTIME_CONTRACTS_IMPLEMENTATION_LAYER_RCIL_V1.md) / [IRE-1](RHIZOH_IDENTITY_RUNTIME_ENGINE_IRE1_BLUEPRINT_V1.md) **runtime** değişimi ile [FCTS **T5**](RHIZOH_FULL_CONSISTENCY_THEOREM_SYSTEM_FCTS_V1.md) **proof yükü** birlikte **stabil** mi — bir taraf güncellenince diğerinin **zorunlu revizyonu** (veya **imkânsızlık**). |

---

## 3. FCTS ile ilişki

| FCTS | MCF-1 okuması |
|------|----------------|
| **T1–T4** | **M1, M2, M4** altında **model / topoloji kayması** altında yeniden sınıflandırılır. |
| **T5** (runtime↔proof) | **M5** ile **ikili stabilite** olarak genişletilir; **M4** ile DRAS’a **recursive** bağlanır. |

**Özet:** **FCTS** = sabit indeks altında teorem paketi; **MCF-1** = bu paketin ve **DRAS**’ın **dinamik evrim** altında **meta-tutarlılığı**.

---

## 4. RDVH / PoCL girdileri

- **RDVH** çıktıları **M2** reification için **ham topoloji + trace** verir.  
- **PoCL** artefaktları **M1** stabilite matrisinin **satırları** olabilir.

---

## 5. Çıkış kriteri (MCF-1 “çerçevelendi” sayılması)

1. **M1–M5** için her biri **en az bir tanım + taşınamaz önkoşul + bilinen kırılma modu** (varsa) yazılmış olmalıdır.  
2. **M3** ile **M4** birlikte okunduğunda **sonsuz regres** veya **sahte kapama** iddiası **engellenmiş** olmalıdır (minimal güçlendirme).  
3. **M5**, FCTS **T5** sözlüğünü **açıkça** genişletir veya **uyumluluk koşulu** koyar.

---

*MCF-1 V1 — Meta-Consistency Framework; FCTS + DRAS üzerinde **evrim altı tutarlılık meta-katmanı**.*
