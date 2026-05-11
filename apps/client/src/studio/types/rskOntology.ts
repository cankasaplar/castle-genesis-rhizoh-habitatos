/**
 * Rhizoh Studio Kernel (RSK) — ontology
 * Castle Studio (UI) → RSK → Gateway → Runtime / World / Memory / Agents
 */

export const RSK_KERNEL_VERSION = "0.9.9";

/** Ontology / constitution schema version (migration ladder). */
export const RSK_ONTOLOGY_VERSION = "0.1.0";

export type StudioShellMode = "forge" | "simulate" | "observe" | "live" | "archive" | "dream";

/** Simulation lane — includes read-only observe */
export type SimulationMode = "draft" | "shadow" | "sim" | "observe" | "live" | "archive";

export type MindLifecycleState = "draft" | "trained" | "active" | "sleeping" | "archived";

export interface MindLifecycle {
  state: MindLifecycleState;
  energy: number;
  decay: number;
}

export interface MindAlignment {
  kernel: number;
  creator: number;
  autonomy: number;
}

export type EngineRoutingLogic = "cost_optimized" | "latency_optimized" | "intelligence_heavy";

export interface RSKMindMetadata {
  alias: string;
  creatorId?: string;
  createdAt?: number;
}

export interface RSKMindEngine {
  model: string;
  provider?: string;
  temperature: number;
  maxTokens: number;
  routingLogic: EngineRoutingLogic;
}

export interface RSKMindDna {
  curiosity: number;
  resonance: number;
  stability: number;
  creativity: number;
  empathy: number;
}

export interface MindCapabilities {
  toolIds: string[];
  perceptions: string[];
  memoryProfileId?: string;
  policyId?: string;
}

/** Immutable template (architect) — no runtime lifecycle */
export interface MindDefinition {
  uid: string;
  version: string;
  label?: string;
  metadata: RSKMindMetadata;
  engine: RSKMindEngine;
  dna: RSKMindDna;
  capabilities: MindCapabilities;
  defaultAlignment?: MindAlignment;
  soulUid?: string;
  /** When set, instance inherits unless spawn overrides (society layer). */
  societyMindRole?: SocietyMindRole;
}

/** Running instance spawned from a definition */
export interface MindInstance {
  uid: string;
  definitionUid: string;
  version: string;
  metadata: RSKMindMetadata;
  engine: RSKMindEngine;
  dna: RSKMindDna;
  capabilities: MindCapabilities;
  lifecycle: MindLifecycle;
  alignment: MindAlignment;
  soulUid?: string;
  ownerId?: string;
  sharedWith?: string[];
  societyMindRole?: SocietyMindRole;
}

/** @deprecated use MindDefinition — kept for migration typing */
export type RSKMind = MindInstance;

export interface RegisterMindDefinitionInput {
  uid: string;
  metadata: RSKMindMetadata;
  engine: RSKMindEngine;
  dna: RSKMindDna;
  capabilities: MindCapabilities;
  defaultAlignment?: MindAlignment;
  soulUid?: string;
  label?: string;
  societyMindRole?: SocietyMindRole;
}

export interface SpawnMindInstanceInput {
  uid: string;
  definitionUid: string;
  soulUid?: string;
  lifecycle?: Partial<MindLifecycle>;
  alignment?: Partial<MindAlignment>;
  ownerId?: string;
  sharedWith?: string[];
  /** Instance display / audit overrides */
  metadata?: Partial<RSKMindMetadata>;
  societyMindRole?: SocietyMindRole;
}

export type ToolCategory =
  | "world"
  | "memory"
  | "render"
  | "network"
  | "economic"
  | "creative";

export interface ToolSpec {
  uid: string;
  name: string;
  category: ToolCategory;
  cost: number;
  latency: number;
  risk: number;
  permissions: string[];
  fn: string;
  grantedTo?: string[];
}

export interface MemoryProfile {
  uid: string;
  label?: string;
  short: number;
  episodic: number;
  semantic: number;
  relational: number;
  dream: number;
  archive: number;
}

/**
 * Per-tier weights for context selection before LLM (0–1; unset keys fall back to builder defaults).
 * Example: `{ episodic: 0.7, social: 0.9, broadcast: 0.4, ecology: 0.2 }`.
 */
export type RhizohMemorySalienceWeightsV0 = Partial<{
  episodic: number;
  room: number;
  region: number;
  social: number;
  broadcast: number;
  longTerm: number;
  ecology: number;
}>;

/** LLM-declared focus — bias next-turn salience (self-steering). */
export type RhizohAttentionFocusV0 = "world" | "room" | "social" | "broadcast" | "memory";

/** Audit trail for agent turns (Historian / replay). */
export interface RhizohAgentRationaleEntryV0 {
  ts: number;
  turnId: string;
  intentIndex: number;
  toolId: string;
  kernelAction?: string;
  confidence?: number;
  rationale?: string;
  attentionFocus?: RhizohAttentionFocusV0;
  phase: "dry_run" | "commit";
  ok: boolean;
  error?: string;
}

/**
 * Multi-tier context pack for Rhizoh cognition (heartbeat → LLM runway).
 * Hydration from causal graph + presence is intentionally out of band here — types only.
 */
export interface RhizohMemoryContextPackV0 {
  episodicClipIds: string[];
  roomDigestByRoomUid: Record<string, string>;
  regionDigestByRegionUid: Record<string, string>;
  socialEdgeDigests: string[];
  broadcastDigestByBroadcastUid: Record<string, string>;
  longTermDistilled: string;
  /** Context graph selection — which tiers matter for this turn / route. */
  salienceWeights?: RhizohMemorySalienceWeightsV0;
}

/** Parsed LLM output → guarded kernel / registry tool invocation (agent bridge v0). */
export interface RhizohAgentToolIntentV0 {
  toolId: string;
  /** When set, should match a `KernelActionId` or tool fn the runner understands */
  kernelAction?: string;
  payload: Record<string, unknown>;
  confidence?: number;
  rationale?: string;
  /** Biases the next context pack salience scorer. */
  attentionFocus?: RhizohAttentionFocusV0;
}

/** Society / cast specialization — civic roles + world-memory keeper (`historian`). */
export type SocietyMindRole =
  | "principal"
  | "observer"
  | "curator"
  | "trader"
  | "moderator"
  | "guide"
  | "companion"
  | "builder"
  | "historian";

export interface MindPolicy {
  uid: string;
  label?: string;
  privacy: number;
  safety: number;
  obedience: number;
  curiosityLimit: number;
  resourceLimit: number;
}

export type MindLinkState = "active" | "paused" | "broken";

export interface MindLink {
  uid: string;
  ownerId: string;
  entityId: string;
  mindInstanceId: string;
  authority: number;
  sync: number;
  bond: number;
  state: MindLinkState;
  startedAt: number;
}

export interface GhostDNA {
  frequency: number;
  resonance: number;
  bonding: number;
  curiosity: number;
  fear: number;
  playfulness: number;
  memoryBias: number;
  dreamAffinity: number;
}

export interface GhostProfile {
  uid: string;
  soulUid: string;
  mindDefinitionUid?: string;
  mindInstanceUid?: string;
  dna: GhostDNA;
}

export interface SpiralNode {
  id: string;
  kind: string;
  time: number;
  memoryWeight: number;
  resonance: number;
  links: string[];
}

export interface EntityRecord {
  uid: string;
  soulUid?: string;
  ownerId?: string;
  delegates?: string[];
}

/** 3D position in derived entity physics. */
export interface EntityPos3 {
  x: number;
  y: number;
  z: number;
}

/** Deterministic spatial partition id (`b:gx:gy:gz` grid coords). */
export type SpatialBucketId = string;

/** One hash-grid bucket — broad-phase causal locality (derived index, not source of truth). */
export interface SpatialBucket {
  id: SpatialBucketId;
  gridX: number;
  gridY: number;
  gridZ: number;
  entityIds: string[];
  lastUpdatedTick: number;
}

/** Ephemeral or snapshot spatial index over entity projections. */
export interface SpatialRegistry {
  buckets: Record<string, SpatialBucket>;
}

/** Collision resolution semantics (v1 implements STOP only). */
export type CollisionResolutionType = "STOP" | "SLIDE" | "BOUNCE";

/** Branch-local derived physics (projection truth — not registry row). */
export interface EntityDerivedPhysics {
  pos: EntityPos3;
  rot: number;
  vel: number;
}

/**
 * History-bearing projection: Entity ≠ stored state; Entity = fold(branch-local causal past).
 * LAW: projection never writes the causal graph (no backward causation).
 */
export interface EntityProjection {
  uid: string;
  /** First genesis causal id for this entity (existence proof). */
  genesisNodeId: string;
  soulUid?: string;
  anchors: {
    lastAppliedBranchId: string;
    lastAppliedTickIndex: number;
    /** Branch lineage depth at reduction time (replay / merge UI). */
    lineageDepth: number;
  };
  state: {
    physical: EntityDerivedPhysics;
    integrity: number;
    metadata: Record<string, unknown>;
  };
  /** Last causal node consumed by the fold (rollback / shadow / divergence anchor). */
  lastProjectionNodeId?: string;
}

/**
 * Mind / tool intent — physics-neutral semantic decision before validation & causal append.
 * Pipeline: Mind → Intent → (Physics Validator) → Tool → CausalNode → Projection.
 */
export interface RSKIntent {
  actorId: string;
  target: unknown;
  action: string;
  constraints?: Record<string, unknown>;
}

/** Semantic move decision (physics-neutral until validated). */
export interface EntityMoveIntent {
  kind: "entity.move";
  actorId: string;
  entityUid: string;
  /** World-space addend (deterministic; applied after feasibility checks). */
  dpos: EntityPos3;
}

/** PhysicsValidator gate — feasibility, causal consistency, projection predict. */
export interface PhysicsValidationResult {
  ok: boolean;
  /** Ordered reasons (success ends with `validated_ok`). */
  rejectionTrace: string[];
  /** Post-move projection preview (only when ok). */
  predictedProjection?: EntityProjection;
  /**
   * Narrow-phase co-presence violation — causal layer may emit `tool.collision` (resolution artifact).
   * Mutually exclusive with `predictedProjection`.
   */
  collisionResolution?: {
    targetEntityUid: string;
    impactVector: EntityPos3;
    resolutionType: CollisionResolutionType;
  };
}

/** Continuity root — cognitive shells (Mind) attach here */
export interface SoulMetadata {
  name?: string;
  origin?: string;
}

export interface Soul {
  uid: string;
  ownerId: string;
  continuityHash: string;
  resonance: number;
  history: string[];
  metadata?: SoulMetadata;
  identitySeed?: string;
  linkedMindIds?: string[];
  linkedEntityIds?: string[];
}

/** Soul ↔ MindInstance cognitive binding (distinct from entity MindLink) */
export type SoulMindBindingState = "active" | "paused" | "broken";

export interface SoulMindBinding {
  uid: string;
  soulUid: string;
  mindInstanceUid: string;
  state: SoulMindBindingState;
}

export interface MindNamespace {
  definition: Record<string, MindDefinition>;
  instance: Record<string, MindInstance>;
}

/** Smallest causal atom — timeline DAG vertex (append-only; no effectIds / reverse edges). */
export type CausalNodeKind = "mind" | "entity" | "tool" | "tool.collision" | "system";

/** Disciplined payload — delta is immutable material for id + merge. */
export interface CausalNodePayload {
  delta: unknown;
  input: unknown;
  output?: unknown;
  /** Projection reducer selects nodes touching these entity uids (no direct entity mutation). */
  affectsEntityIds?: string[];
  /**
   * Causal economy (Phase 4 kernel) — stamped at append when integrator is active.
   * Enforcement: optional caps on `StudioKernelState.causalEconomy`.
   */
  economy?: {
    computeWeight: number;
    entropyImpact: number;
  };
}

export interface CausalNode {
  /** Hash-stable id (tickIndex + actorId + delta + branch + subject). */
  id: string;
  tickIndex: number;
  timestamp: number;
  type: CausalNodeKind;
  /** Parents only (past-facing). */
  causeIds: string[];
  actorId: string;
  branchId: string;
  payload: CausalNodePayload;
}

export type BranchStatus = "active" | "merged" | "discarded";

export interface Branch {
  id: string;
  parentBranchId?: string;
  forkTick: number;
  forkCauseNodeId: string;
  status: BranchStatus;
  /** Fork depth from trunk (UI + policy caps). */
  lineageDepth: number;
}

/** When two branches reconcile: deterministic diff; shadow wins on conflict (policy stub). */
export type CausalMergePolicy = "deterministic-diff-resolution";

/**
 * Causal graph namespace — event DAG + branch metadata.
 * `writerHeads`: `${branchId}::${writerSubjectId}` → last emitted node id (kernel writer index).
 */
export interface CausalGraphRegistry {
  nodes: Record<string, CausalNode>;
  branches: Record<string, Branch>;
  writerHeads: Record<string, string>;
}

/** Namespaced registry for scale */
export interface RegistryState {
  mind: MindNamespace;
  ghost: Record<string, GhostProfile>;
  spiral: Record<string, SpiralNode>;
  link: Record<string, MindLink>;
  entity: Record<string, EntityRecord>;
  tool: Record<string, ToolSpec>;
  memoryProfile: Record<string, MemoryProfile>;
  policy: Record<string, MindPolicy>;
  soul: Record<string, Soul>;
  soulMind: Record<string, SoulMindBinding>;
  causalGraph: CausalGraphRegistry;
}

export type ActorKind = "human" | "agent" | "system" | "delegate";

export interface ActorState {
  id: string;
  kind: ActorKind;
}

export interface SessionState {
  token: string;
  issuedAt: number;
  expiresAt: number;
}

export interface IdentityRoot {
  userUid: string;
  avatarUid: string;
  companionUid: string;
  ghostPetUid: string;
  inventoryUid: string;
  vaultUid: string;
  journalUid: string;
  signatureUid: string;
  profileMeta: {
    displayName: string;
    homeRegionUid: string;
    updatedAt: number;
  };
}

export interface AvatarIdentity {
  bodyArchetype: string;
  palette: string;
  motionStyle: string;
  aura: string;
  badges: string[];
  homeRegion: string;
}

export interface CompanionIdentity {
  name: string;
  voice: string;
  archetype: string;
  tone: string;
  memoryBias: string;
  preferredRole: string;
}

export interface GhostPetIdentity {
  species: string;
  temperament: string;
  orbitStyle: string;
  bondLevel: number;
}

export interface InventoryIdentity {
  tools: string[];
  artifacts: string[];
  wearables: string[];
  keys: string[];
}

export interface VaultIdentity {
  permanentUnlocks: string[];
  creatorLicenses: string[];
  rareMemories: string[];
}

export interface MemoryJournalIdentity {
  clips: string[];
  bookmarks: string[];
  milestones: string[];
  notes: string[];
}

export interface SignatureIdentity {
  crest: string;
  colorSystem: string;
  motif: string;
  publicCard: string;
}

export interface IdentityGraphState {
  root: IdentityRoot;
  avatar: AvatarIdentity;
  companion: CompanionIdentity;
  ghostPet: GhostPetIdentity;
  inventory: InventoryIdentity;
  vault: VaultIdentity;
  journal: MemoryJournalIdentity;
  signature: SignatureIdentity;
  reputation: {
    score: number;
    tier: string;
  };
}

export interface IdentityCausalEventV0 {
  type:
    | "identity.avatar.update"
    | "identity.companion.update"
    | "identity.ghostpet.update"
    | "identity.signature.update"
    | "identity.vault.unlock"
    | "identity.journal.append";
  actorUid: string;
  targetUid: string;
  patch: Record<string, unknown>;
  causeNodeId?: string;
  timestamp: number;
}

/**
 * Persistent identity shell. Session is ephemeral but carried alongside for kernel + UI;
 * do not treat session as durable profile data.
 */
export interface IdentityState {
  ownerId: string | null;
  actor: ActorState | null;
  session?: SessionState | null;
  identityGraph?: IdentityGraphState;
  /** Namespaced capability flags, e.g. registry.*, sim.shadow.run */
  permissions: Record<string, boolean>;
  delegates: string[];
  sharedOwnerIds: string[];
  /**
   * Optional: RHIZOH ActionPolicyMatrix v1 actor stratum. When set, KernelGuard enforces
   * the semantic class `identity_floor` before permission wildcards (`actionPolicyMatrixV1`).
   */
  rhizohMembraneFloor?: "ghost" | "trusted" | "verified" | "sovereign_verified";
}

/** Merge / shadow conflict hint for Fracture View (lite heuristics). */
export interface CausalFractureHint {
  tickIndex: number;
  reason: string;
  shadowBranchId?: string;
}

/** Shadow-only fork pack; never committed to live registry until merge (future). */
export interface CausalShadowPack {
  branch: Branch;
  nodes: Record<string, CausalNode>;
  mergePolicy: CausalMergePolicy;
  nodeCount: number;
  /** Live graph tip for the same mind on parent branch (for diff / merge UI). */
  liveWriterTipId?: string;
  shadowWriterTipId?: string;
  /** Heuristic divergence vs trunk (deterministic-diff-resolution staging). */
  fractures?: CausalFractureHint[];
}

export interface SimulationDiff {
  ok: boolean;
  notes: string[];
  costs?: Record<string, number>;
  riskScore?: number;
  trace?: unknown[];
  output?: string;
  /** Ephemeral fork subgraph from shadow engine (replay / recomposition). */
  causalShadow?: CausalShadowPack;
  /** Flattened fracture hints for console (optional mirror of causalShadow.fractures). */
  causalFractures?: CausalFractureHint[];
}

export interface SimulationState {
  mode: SimulationMode;
  forkId?: string;
  diff?: SimulationDiff;
}

/** Cognitive pulse for a MindInstance (temporal OS). */
export interface RSKMindRuntimeInternal {
  mood: number;
  focus: number;
  energy: number;
  load: number;
  /** Thermodynamic axis: drives decay of focus/energy and mood oscillation */
  entropy: number;
}

export interface RSKMindRuntimeCognition {
  lastThoughtAt: number;
  currentTask?: string;
  /** Last N inner monologue lines (kernel-local; not LLM transcript) */
  thoughtBuffer: string[];
}

export interface RSKMindRuntimePerception {
  inputs: string[];
  lastInputAt: number;
  signalStrength: number;
}

export interface RSKMindRuntimeState {
  internal: RSKMindRuntimeInternal;
  cognition: RSKMindRuntimeCognition;
  perception: RSKMindRuntimePerception;
}

/** First-login / cold-start policy for sovereign bootstrap */
export type BootstrapEnvironment = "empty" | "default" | "guided" | "guest";

export interface BootstrapContext {
  environment: BootstrapEnvironment;
}

/**
 * World Physics Layer (WPL) — declared early; time dilation, decay rules, causal graph hook here later.
 */
export interface WorldPhysicsLayerState {
  /** Monotonic kernel tick (shadow vs live may diverge in fork) */
  globalTick: number;
  /** Placeholder for dilation factor (1.0 = nominal) */
  timeDilation: number;
}

export type WorldRegionKind =
  | "district"
  | "academy"
  | "garden"
  | "lab"
  | "watch_tower"
  | "hall"
  | "green_room"
  | "marketplace"
  | "arena"
  | "dream_spiral"
  | "wild_zone";

export interface WorldRegion {
  uid: string;
  kind: WorldRegionKind;
  title: string;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  /** Higher wins when bounds overlap (hall vs portal strip). */
  priority?: number;
  portals: string[];
  density: number;
  weather: string;
  biome: string;
  ecologyHealth: number;
}

export interface WorldPortalEdge {
  uid: string;
  fromRegionUid: string;
  toRegionUid: string;
  cost: number;
  bidirectional?: boolean;
  gateRule?: string;
}

export interface PresenceRoomMapBinding {
  roomUid: string;
  regionUid: string;
}

export interface WorldTopologyState {
  regions: Record<string, WorldRegion>;
  edges: Record<string, WorldPortalEdge>;
  roomBindings: Record<string, PresenceRoomMapBinding>;
}

/** Avatar ↔ world region resolution (locomotion kernel). */
export interface WorldLocomotionState {
  avatarRegionUid: Record<string, string>;
  lastCrossAtByAvatar: Record<string, number>;
  /** Map / shell focus for active geography. */
  activeRegionUid?: string;
}

export interface RegionChunkRuntime {
  regionUid: string;
  loaded: boolean;
  ownerId?: string;
  occupancy: number;
  lastLoadedAt?: number;
  lastUnloadedAt?: number;
}

export interface WorldChunkRuntimeState {
  chunks: Record<string, RegionChunkRuntime>;
}

export interface WorldEcologyRuntimeState {
  weatherByRegionUid: Record<string, string>;
  biomeByRegionUid: Record<string, string>;
  healthByRegionUid: Record<string, number>;
}

export interface RhizohAgentRuntimeState {
  enabled: boolean;
  heartbeatMs: number;
  lastTickAt: number;
  activeMindUid?: string;
  schedulerState: "idle" | "running" | "paused";
  /** epoch ms — toolId key (normalized) */
  toolCooldownUntilByToolId?: Record<string, number>;
  /** Ring buffer semantics: trim in runner (Historian). */
  rationaleLog?: RhizohAgentRationaleEntryV0[];
  /** Last committed intent focus (salience bias on next build). */
  lastAttentionFocus?: RhizohAttentionFocusV0;
}

export interface SocietyEconomyState {
  reputationByAvatarUid: Record<string, number>;
  marketHeatByRegionUid: Record<string, number>;
  civicCohesion: number;
}

/** Cumulative causal cost — self-limiting substrate when caps are set. */
export interface CausalEconomyLayerState {
  cumulativeComputeWeight: number;
  cumulativeEntropyImpact: number;
  /** When set, live causal appends reject if cumulative + charge would exceed. */
  maxComputeWeight?: number;
  maxEntropyImpact?: number;
  /** Observability: last shadow simulation charge applied to cumulative totals. */
  lastShadowCharge?: {
    computeWeight: number;
    entropyImpact: number;
    shadowBranchId?: string;
    shadowNodeCount: number;
  };
}

export interface RuntimeState {
  /** Active MindInstance uid */
  activeMind?: string;
  /** Continuity root Soul uid */
  activeSoul?: string;
  /** Timeline branch for live causal writes (shadow forks are ephemeral). */
  activeBranchId?: string;
  selectedEntity?: string;
  currentPanel: string;
  shellMode?: StudioShellMode;
}

export interface StudioKernelMeta {
  productName: string;
  kernelName: string;
  kernelVersion: string;
  ontologyVersion: string;
}

/** P2 spatial presence — ring / UI affordance (voice is transport; this is kernel-visible posture). */
export type AvatarSpatialPresenceStatus = "quiet" | "talking" | "broadcasting" | "watching" | "away";

/** Avatar rig v1 — presentation shell driven by causal replay + viewport polish. */
export type AvatarRigAnimationState = "idle" | "walk" | "talk" | "clap" | "cheer" | "think" | "laugh";

/** Social authority / capability — orthogonal to `PresenceZoneId` (physical context). */
export type PresenceRole =
  | "owner"
  | "moderator"
  | "speaker"
  | "guest"
  | "vip"
  | "builder"
  | "agent"
  | "observer";

/** Social-physics regions inside a `PresenceRoom` (Mirror-style hall semantics). */
export type PresenceZoneId =
  | "stage"
  | "audience"
  | "lounge"
  | "backstage"
  | "vip"
  | "sandbox";

/** Policy hooks for moderation, broadcast, economy — interpreted by kernel + UI; replay-friendly. */
export interface PresenceZoneSemantics {
  /** On-stage / mic surface — default posture while presenting. */
  broadcastingSurface?: boolean;
  /** Seated / crowd tier — default spectator posture. */
  spectatorTier?: boolean;
  /** Creative / tool-heavy demos (future: gate causal tool ids). */
  toolAccess?: boolean;
  /** Requires `PresenceRoom.vipAllowlistAvatarUids` when non-empty. */
  vipGated?: boolean;
  /** Staff-only / low-visibility pocket (future: visibility graph). */
  backstageHidden?: boolean;
  /** Green room pocket — companion / pet policy hints for shell + gateway. */
  agentAllowed?: boolean;
  petAllowed?: boolean;
  defaultStatus?: AvatarSpatialPresenceStatus;
}

export interface PresenceZoneDef {
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  semantics: PresenceZoneSemantics;
}

export type PresenceRoomZones = Record<PresenceZoneId, PresenceZoneDef>;

/**
 * Room-scoped avatar pose + status (causal `avatar.spawn` / `avatar.move` replay).
 * Distinct from `EntityProjection` (physics entity); both may coexist while P2 ramps.
 */
export interface AvatarProjection {
  roomUid: string;
  /** Which social region the avatar is occupying (context for rules + replay). */
  zoneId: PresenceZoneId;
  /** Social role in this room (moderation, stage, economy hooks). */
  role: PresenceRole;
  transform: { x: number; y: number; z: number; rotY: number };
  status: AvatarSpatialPresenceStatus;
  /** Presence protocol — transport-agnostic atoms (voice / pet / agent / UI consume + causal replay). */
  raisedHand?: boolean;
  lastReactionKind?: string;
  lastReactionAt?: number;
  summonedPetUid?: string;
  lastAgentInvokeUid?: string;
  lastAgentInvokeIntent?: string;
  lastAgentInvokeAt?: number;
  /** Rig presentation — mirrors social intent for shell + gateway stream. */
  rigAnimation?: AvatarRigAnimationState;
  lookAtTargetUid?: string;
  rigMood?: string;
  rigGesture?: string;
  /** Wall clock ms — viewport uses for decay / flash. */
  lastRigEventAt?: number;
}

/** Phase P1 — avatar shell bound to continuity + optional world entity (projection drives 3D pose). */
export interface AvatarEntity {
  uid: string;
  ownerId?: string;
  soulUid?: string;
  /** RSK entity whose `EntityProjection` supplies world position for this avatar. */
  linkedEntityUid?: string;
  /** Opaque appearance seed (future: DNA / asset bundle). */
  appearanceDNA?: string;
  animationState?: string;
  lastEmoteId?: string;
  /** Active social space membership (kernel-local; gateway sync is separate). */
  currentRoomUid?: string;
  currentBroadcastUid?: string;
  /** P2 — hall / stage coordinates when `currentRoomUid` matches `projection.roomUid`. */
  projection?: AvatarProjection;
  /** Real Map OS — current topology region for this avatar (locomotion). */
  worldRegionUid?: string;
  /** Rhizoh companion agent uid bound after first `agent.spawn` (kernel-local). */
  companionAgentUid?: string;
  /** Stable slot `pet:bound:${avatarUid}` when ghost pet orbit is active. */
  ghostPetSlotUid?: string;
}

/** Ghost pet ambient layer — causal `pet.*` + viewport mesh. */
export type PetGhostState = "orbit" | "perch" | "react" | "observing" | "idle";

export interface PetProjection {
  /** Stable slot uid per owner (`pet:bound:${ownerAvatarUid}`). */
  uid: string;
  displayPetUid: string;
  ownerAvatarUid: string;
  roomUid: string;
  kind: "ghost";
  state: PetGhostState;
  transform: { x: number; y: number; z: number; rotY: number };
  lastEchoKind?: string;
  rhizohAgentUid?: string;
  lastStateAt?: number;
}

/** In-world companion intelligence (Rhizoh v1) — causal `agent.*` + viewport mesh. */
export type RhizohCompanionAgentState =
  | "idle"
  | "listening"
  | "responding"
  | "speaking"
  | "observing"
  | "guiding"
  | "orbiting";

export type CompanionAgentArchetype = "rhizoh";

export interface AgentProjection {
  uid: string;
  archetype: CompanionAgentArchetype;
  ownerAvatarUid: string;
  roomUid: string;
  state: RhizohCompanionAgentState;
  transform: { x: number; y: number; z: number; rotY: number };
  attentionTargetUid?: string;
  lastResponseSummary?: string;
  lastStateAt?: number;
}

/** Shared spatial / social room (Castle hub slice). */
export interface PresenceRoom {
  uid: string;
  ownerSoulUid?: string;
  title: string;
  topic?: string;
  memberAvatarUids: string[];
  createdAt: number;
  /** Zone layout — omitted on legacy snapshots; use `ensureRoomZones` when consuming. */
  zones?: PresenceRoomZones;
  /** When non-empty, entering `vip` zone requires listed avatar UIDs (creator economy hook). */
  vipAllowlistAvatarUids?: string[];
  /** First member to join becomes owner (kernel-local; gateway may mirror). */
  ownerAvatarUid?: string;
  /** Avatars with enforced silence (social moderation substrate). */
  mutedAvatarUids?: string[];
  /** Stage spotlight / pinned context (replay + UI). */
  stagePin?: { summary: string; pinnedByAvatarUid: string; at: number };
}

export type BroadcastStreamState = "idle" | "live" | "ended";

/** 5A — Director deck + replay; causal fold target (distinct from legacy `BroadcastChannel`). */
export type BroadcastProjectionState = "idle" | "prelive" | "live" | "paused" | "ended";

export type BroadcastCameraMode = "auto" | "focus" | "follow" | "cut";

export interface BroadcastOverlayEntry {
  id: string;
  kind: string;
  payload?: string;
}

export interface BroadcastProjection {
  uid: string;
  roomUid: string;
  state: BroadcastProjectionState;
  hostAvatarUid?: string;
  stageAvatarUids: string[];
  audienceCount: number;
  spotlightTargetUid?: string;
  cameraMode: BroadcastCameraMode;
  overlayStack: BroadcastOverlayEntry[];
  startedAt?: number;
  lastEventAt?: number;
  /** Open production segment (from `segment.open`). */
  activeSegmentId?: string;
  /** Last audience energy hint (0–1), from audience.* atoms. */
  audienceEnergy?: number;
}

export interface DirectorClipMarker {
  atMs: number;
  label: string;
  causalNodeId: string;
}

export interface DirectorState {
  currentBroadcastUid?: string;
  sceneMode: string;
  clipMarkers: DirectorClipMarker[];
}

/** Directed gaze / binding edge for attention graph (replay-derived + projection). */
export interface AttentionGazeEdge {
  fromUid: string;
  toUid: string;
  kind: "avatar_lookAt" | "companion_attention" | "pet_anchor";
}

/** Paired resonance hint (symmetric pair for effects, analytics, gateway fan-out). */
export interface AttentionResonancePair {
  a: string;
  b: string;
  kind: "gaze" | "companion" | "pet_owner" | "spotlight";
}

/**
 * Unified attention read model — pure derive from `PresenceLayerState` (+ broadcast fold).
 * Not persisted; recompute on read for deterministic shell + future shadow/replay tests.
 */
export interface AttentionField {
  roomUid: string;
  /** Entity uid → primary gaze / anchor target (avatar lookAt, companion attention, pet → owner). */
  gazeTargets: Record<string, string | undefined>;
  gazeGraph: AttentionGazeEdge[];
  focusHeatmap: Partial<Record<PresenceZoneId, number>>;
  resonancePairs: AttentionResonancePair[];
  spotlightField: { broadcastUid?: string; targetUid?: string; bias: number };
  audienceField: { energy: number; broadcastUid?: string };
  companionLinks: Array<{ companionUid: string; ownerAvatarUid: string; attentionTargetUid?: string }>;
  petLinks: Array<{ petUid: string; ownerAvatarUid: string }>;
}

/** Single emissive target for viewport / Three.js material bias (5B). */
export interface RenderBiasEmissiveMapEntry {
  /** e.g. `zone:stage`, `zone:audience`, `avatar:uid`, `pet:uid`, `companion:uid` */
  key: string;
  /** 0 = baseline, 1 = strong boost (consumer scales to material units). */
  intensity: number;
}

/**
 * 5B-A — Lighting / focus bias derived from `AttentionField` + presence posture (pure, recomputable).
 * Feeds viewport emissive, camera hint, pet/Rhizoh polish without new causal atoms.
 */
export interface RenderBiasField {
  roomUid: string;
  emissiveMap: RenderBiasEmissiveMapEntry[];
  /** 0..1 — auto camera / framing lock-in weight. */
  cameraFocusWeight: number;
  /** 0..1 — stage plane / aura intensity. */
  stageIntensity: number;
  /** Per-avatar body emissive bias 0..1 */
  avatarGlow: Record<string, number>;
  petGlow: Record<string, number>;
  rhizohPulse: Record<string, number>;
}

/** One-shot perception + render bias for a room (optional convenience). */
export interface AttentionRenderPack {
  attention: AttentionField;
  renderBias: RenderBiasField;
}

/** Wide-participation stream shell (replayable via causal join/leave). */
export interface BroadcastChannel {
  uid: string;
  ownerSoulUid?: string;
  title: string;
  topic?: string;
  speakerAvatarUids: string[];
  audienceAvatarUids: string[];
  streamState: BroadcastStreamState;
  createdAt: number;
}

/**
 * Voice transport stub (no RTP/WebRTC) — mirrors `avatar.speak.*` for UI + replay previews.
 * Closed segments get `causalStopNodeId`; coalesced opens may omit it.
 */
export interface VoiceStubSegment {
  avatarUid: string;
  startMs: number;
  endMs?: number;
  causalStartNodeId: string;
  causalStopNodeId?: string;
}

export interface VoiceStubRoomState {
  segments: VoiceStubSegment[];
}

/** Presence layer — social shell state (avatars, future rooms). */
/** Bounded cross-room field coupling (omit or [] = no cross bleed; prevents global coupling explosion). */
export interface RoomFieldEdge {
  fromRoomUid: string;
  toRoomUid: string;
  /** 0..1 — scaled by kernel `maxBleed` cap when stitching. */
  coupling: number;
}

export interface PresenceLayerState {
  avatars: Record<string, AvatarEntity>;
  rooms: Record<string, PresenceRoom>;
  /** Optional: only listed pairs receive bleed; keeps interference partitioned. */
  roomFieldEdges?: RoomFieldEdge[];
  broadcasts: Record<string, BroadcastChannel>;
  /** 5A — Folded from `broadcast:${uid}` writer chain (+ join/leave deltas). */
  broadcastProjections?: Record<string, BroadcastProjection>;
  /** 5A — Director deck per hall room. */
  directorByRoomUid?: Record<string, DirectorState>;
  /** Per-room speak segments; keyed by `PresenceRoom.uid`. */
  voiceStubByRoomUid?: Record<string, VoiceStubRoomState>;
  /** Companion agents (Rhizoh v1) keyed by `AgentProjection.uid`. */
  companionAgents?: Record<string, AgentProjection>;
  /** Ghost pets (orbit v1) keyed by `PetProjection.uid` (stable per owner). */
  pets?: Record<string, PetProjection>;
}

export interface StudioKernelState {
  meta: StudioKernelMeta;
  identity: IdentityState;
  registry: RegistryState;
  simulation: SimulationState;
  runtime: RuntimeState;
  /** MindInstance uid → runtime cognitive pulse */
  mindRuntime: Record<string, RSKMindRuntimeState>;
  /** Declarative physics substrate (stub v0) */
  worldPhysics: WorldPhysicsLayerState;
  /** Real Map OS: canonical geography and portals */
  worldTopology: WorldTopologyState;
  /** World locomotion — region per avatar + portal debounce. */
  worldLocomotion: WorldLocomotionState;
  /** Region chunk lifecycle (load/unload/ownership/occupancy) */
  worldChunks: WorldChunkRuntimeState;
  /** Persistent geography facets (weather, biome, ecology health) */
  worldEcology: WorldEcologyRuntimeState;
  /** Rhizoh autonomous loop scheduler state */
  agentRuntime: RhizohAgentRuntimeState;
  /** Society/economy macro state */
  societyEconomy: SocietyEconomyState;
  /** Causal economy — cumulative costs + optional enforcement caps. */
  causalEconomy: CausalEconomyLayerState;
  /** Phase P — presence / avatar (product shell); causal join + emote nodes append to graph. */
  presence: PresenceLayerState;
  /**
   * Snapshot cache: `${branchId}::${entityUid}` → last reduced projection.
   * Truth = causal graph only; cache is never an input to `projectEntity` (read-only acceleration).
   */
  entityProjectionCache: Record<string, EntityProjection>;
}

export type StudioResult<T> = { ok: true; value: T } | { ok: false; error: string };

/** KernelGuard action ids (namespaced) */
export type KernelActionId =
  | "registry.mind.definition.register"
  | "registry.mind.instance.spawn"
  | "registry.mind.instance.upsert"
  | "registry.link.attach"
  | "registry.soul.register"
  | "registry.soulMind.bind"
  | "registry.ghost.register"
  | "registry.tool.register"
  | "registry.memoryProfile.register"
  | "registry.policy.register"
  | "registry.entity.register"
  | "registry.spiral.upsert"
  | "sim.shadow.run"
  | "sim.sim.run"
  | "sim.draft.run"
  | "sim.observe.run"
  | "sim.shadow.execute"
  | "registry.mind.tick"
  | "registry.soul.entity.link"
  | "ops.entity.spawn"
  | "physics.entity.move.apply"
  | "presence.avatar.bind"
  | "presence.avatar.emote"
  | "presence.avatar.spawn"
  | "presence.avatar.move"
  | "presence.avatar.zone.enter"
  | "presence.avatar.zone.leave"
  | "presence.avatar.zone.transition"
  | "presence.role.assign"
  | "presence.role.revoke"
  | "presence.moderate.kick"
  | "presence.moderate.mute"
  | "presence.stage.pin"
  | "presence.stage.invite"
  | "presence.avatar.speak.start"
  | "presence.avatar.speak.stop"
  | "presence.avatar.react"
  | "presence.avatar.raise_hand"
  | "presence.avatar.pet.summon"
  | "presence.avatar.agent.invoke"
  | "presence.agent.spawn"
  | "presence.agent.follow"
  | "presence.agent.observe"
  | "presence.agent.listen"
  | "presence.agent.respond"
  | "presence.agent.depart"
  | "presence.pet.spawn"
  | "presence.pet.follow"
  | "presence.pet.observe"
  | "presence.pet.react"
  | "presence.pet.depart"
  | "presence.room.create"
  | "presence.room.join"
  | "presence.room.leave"
  | "presence.broadcast.create"
  | "presence.broadcast.join"
  | "presence.broadcast.leave"
  | "presence.broadcast.start"
  | "presence.broadcast.pause"
  | "presence.broadcast.resume"
  | "presence.broadcast.stop"
  | "presence.broadcast.segment.open"
  | "presence.broadcast.segment.close"
  | "presence.broadcast.spotlight.assign"
  | "presence.broadcast.spotlight.release"
  | "presence.broadcast.camera.focus"
  | "presence.broadcast.camera.follow"
  | "presence.broadcast.camera.cut"
  | "presence.broadcast.overlay.push"
  | "presence.broadcast.overlay.remove"
  | "presence.broadcast.audience.wave"
  | "presence.broadcast.audience.applause"
  | "presence.broadcast.audience.cheer"
  | "presence.broadcast.audience.emojiRain"
  | "presence.broadcast.clip.mark"
  | "presence.broadcast.scene.set"
  | "world.avatar.region.enter"
  | "world.avatar.region.leave"
  | "world.portal.cross"
  | "world.chunk.activate"
  | "world.chunk.deactivate";

export interface KernelGuardRunInput {
  identity: IdentityState;
  action: KernelActionId | string;
  payload: unknown;
  /** Internal bootstrap / tests only */
  skipGuard?: boolean;
  /** If true, authorize/validate/sanitize run but kernel audit trail is not written (dry-run). */
  dryRun?: boolean;
}

export interface KernelGuardRunResult {
  allowed: boolean;
  sanitizedPayload?: unknown;
  auditId?: string;
  error?: string;
  /** Pipeline stage that failed (if any) */
  stage?: "authorize" | "validate" | "sanitize" | "audit" | "commit";
}
