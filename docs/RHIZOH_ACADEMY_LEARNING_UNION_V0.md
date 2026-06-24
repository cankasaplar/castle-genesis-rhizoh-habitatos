# Rhizoh Academy Learning Union v0

**SPECFLOW:** `RESEARCH-ONLY` — cross-discipline observation aggregate; no execution authority.

## Gap closed

Chess, Go, and Checkers each ship independent learning reports and media tube wires. Product matrix listed **Go / Checkers media** as `◐ channel + holding slide` without a **unified academy observability surface**. v0 adds a single union report that aggregates discipline digests without mutating any learning lane.

## Three disciplines (paper-aligned)

| Discipline | Report API | Media tube | Causal space |
|------------|------------|------------|--------------|
| **Chess** | `learningReport()` / `chessLearningReport()` | `chess_cluster_live` (cluster boot) | implicit cross-space |
| **Go** | `goLearningReport()` | `wireGoLearningTube()` · `goLearningTube()` | `go.causal.space` |
| **Checkers** | `checkersLearningReport()` | `wireCheckersLearningTube()` · `checkersLearningTube()` | `checkers.causal.space` |

**Principle (unchanged):** `learning = f(agreement, not events)` — union counts observation only; never grants weight updates or execution.

## Union outputs

| Field | Meaning |
|-------|---------|
| `unionLabel` | `dormant` · `{discipline}_solo` · `multi_active` · `triad_active` |
| `dominantDiscipline` | discipline with highest `movesSeen` this session |
| `armedDisciplineCount` | disciplines with any move or tube activity |
| `totalMovesSeen` | sum across chess + go + checkers |
| `disciplines.*` | per-discipline digest: moves, batches, gate, causal space |

## Not in v0

- Cross-discipline weight transfer or shared UGL adapter
- Academy landing UI (`/academy`) wiring
- KataGo / lc0 engine truth merge (see Go GTP bridge track)
- Frozen `phase*.js` mutation

## Module chain

| PR | Scope |
|----|-------|
| docs | This file |
| core | `rhizohAcademyLearningUnionReportV0.js` |
| wire | `academyLearningUnionWireV0.js` · boot · full report · promise matrix |

## DevTools smoke

```javascript
await __rhizoh.wireAcademyLearningUnion({ demoMove: true })
__rhizoh.academyLearningUnion()
__rhizoh.learningReport()       // chess (legacy alias)
__rhizoh.goLearningReport()
__rhizoh.checkersLearningReport()
```

*interpretationOnly: true · Observation ≠ Execution*
