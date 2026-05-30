---- MODULE RhizohCore ----
(*
  Phase 0.5 minimal core — T1 + inactive data plane + no O→S on core.
  Parent: docs/RHIZOH_TLA_EXECUTION_CORE_SKETCH_V1.0.md
  Do not extend with metaphysics / full product model here.
*)
EXTENDS Naturals

CONSTANTS Packets

VARIABLES core, obs, tick, pkt

vars == <<core, obs, tick, pkt>>

\* Phase 0.5 instance constants (finite enumeration for TLC)
NullPacket == "NullPacket"
NullAction == "NullAction"
Core0 == "s0"
Obs0 == "o0"

TypeOK ==
  /\ core = Core0
  /\ obs \in {Obs0}
  /\ tick \in Nat
  /\ pkt \in Packets \cup {NullPacket}

Init ==
  /\ core = Core0
  /\ obs = Obs0
  /\ tick = 0
  /\ pkt = NullPacket

\* Semantic compression: DataPlaneActive = FALSE ⇒ always NullAction (A6)
ProjectInput(p) ==
  NullAction

ApplyDelta(s, a) ==
  IF a = NullAction THEN s ELSE s

\* Adversary delivers a packet; core unchanged until ProcessPacket
DeliverPacket ==
  /\ pkt = NullPacket
  /\ pkt' \in Packets
  /\ UNCHANGED <<core, obs, tick>>

\* π_core ∘ δ — under Phase 0.5 always NullAction ⇒ core unchanged (T1)
ProcessPacket ==
  /\ pkt # NullPacket
  /\ core' = ApplyDelta(core, ProjectInput(pkt))
  /\ pkt' = NullPacket
  /\ UNCHANGED <<obs, tick>>

\* TI1′ internal baseline drift only — does not mutate core in this model
InternalTick ==
  /\ tick' = tick + 1
  /\ UNCHANGED <<core, obs, pkt>>

\* γ : S → O read-only; stub keeps obs at Obs0 (lossy static projection)
Observe ==
  /\ obs' = Obs0
  /\ UNCHANGED <<core, tick, pkt>>

Next ==
  \/ DeliverPacket
  \/ ProcessPacket
  \/ InternalTick
  \/ Observe

Spec == Init /\ [][Next]_vars /\ WF_vars(Next)

\* --- Invariants (Rhizoh T1 / A3) ---
CoreUnchanged == core = Core0

InvNullReject == ApplyDelta(core, NullAction) = core

\* NI2: core' changes only in ProcessPacket; ProjectInput never reads obs
ObsNoFeedback ==
  obs = Obs0

\* --- Temporal (TI1′ sketch) ---
\* Packet delivery alone does not advance logical tick
TickUnchangedOnDeliver ==
  [][(pkt' # NullPacket /\ pkt = NullPacket) => tick' = tick]

====
