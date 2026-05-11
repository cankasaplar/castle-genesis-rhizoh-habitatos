# Layer expansion protocol — frozen core çevresinde genişleme

**SPECFLOW:** `FUTURE-PROOF-ONLY` \| `RESEARCH-ONLY`

**Attribution:** [`AGENT_IDENTITY_AND_ATTRIBUTION.md`](AGENT_IDENTITY_AND_ATTRIBUTION.md)

---

## 1. Frozen core neyi garanti eder?

“Sadece DAG” dar kalır; aslında sabitlenen:

- **Nedensellik yönü** (ileri import kuralı)
- **State transition kuralları** (frozen faz zinciri içinde)
- **Observation → interpretation → constraint** zincirinin **motor tarafı** (kod)

**Yeni katmanlar execution core’u yeniden tanımlamaz.** Core **genişlemez** — çevresinde **yorum ve gözlem uzayı** büyür.

---

## 2. İzinli genişleme alanları

| Tür | Örnek |
|-----|--------|
| **Observation expansion** | Yeni gözlemci, yeni feed, yeni şema |
| **Spec expansion** | Yeni “ne olabilir” alanı, yeni mapping türü (`ASSET_CONTRACT_*` benzeri) |
| **Epistemik analiz (üst)** | Trust/drift/semantics **üzerinde** okuma, rapor, sandbox |

---

## 3. Yasak veya yüksek risk

| Yasak | Neden |
|-------|--------|
| Yeni **execution path** frozen subgraph’a sızmak | Determinizm ve freeze anlamı bozulur |
| **Karar otoritesi** gözlem katmanına vermek | “Adaptif karar sistemi” sınıfına kayma |
| Observation → **doğrudan** core dosya yazımı **review dışı** | Kontrolsüz veri/ajan karmaşası |

---

## 4. Yeni katman = yeni view function

İzinli kalıp:

- **Trust projection** — güven görünümü  
- **Drift projection** — zamansal tutarsızlık haritası  
- **Semantic compression bias** (ör. Nisa oturumu) — **yorum ağırlığı**, execution branch değil  

❌ Yeni agent intelligence (otorite)  
✔ Yeni **yorum geometrisi** / projection space  

---

## 5. Genişleme checklist (PR öncesi)

- [ ] Bu değişiklik **v562–v570** `phase*.js` **import/topology** değiştiriyor mu? → Evet ise **CORE-ELIGIBLE** + graf/hash/script tek commit  
- [ ] Sadece `docs/` veya `experimental/` mu? → SPECFLOW uyumu  
- [ ] “Evrim” kelimesi execution’a **bulaşıyor** mu? → Reddedilmeli veya ayrı mimari ADR  

---

## 6. Sağlıklı büyüme özeti

```text
Frozen Core (causal invariants)
        ↓
Epistemic Layer (interpretation field — kod içi v567–v570)
        ↓
Observation Fabric (multi-agent sensors — policy)
        ↓
Dynamic projections / research sandbox
```

**Özet:** *Layered expansion over a frozen execution substrate.* — **Self-modifying runtime değil**; **self-expanding interpretation** (üst katmanlarda).

---

## 7. İlgili

- [`OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md)  
- [`ARCHITECTURE_POST_FREEZE_SUMMARY.md`](ARCHITECTURE_POST_FREEZE_SUMMARY.md)  
