import type { AvatarIdentity, CompanionIdentity, GhostPetIdentity } from "../types/rskOntology";
import {
  appendJournalClip,
  grantVaultUnlock,
  registerIdentityMeshPublisher,
  setIdentityMeshPublishEnabled,
  updateAvatarIdentity,
  updateCompanionIdentity,
  updateGhostPetIdentity,
  updateSignatureIdentity
} from "./identitySlice";

/** P2-C bridge: identity write APIs with causal append semantics. */
export function identityCausalUpdateAvatar(patch: Partial<AvatarIdentity>): void {
  updateAvatarIdentity(patch);
}

export function identityCausalUpdateCompanion(patch: Partial<CompanionIdentity>): void {
  updateCompanionIdentity(patch);
}

export function identityCausalUpdateGhostPet(patch: Partial<GhostPetIdentity>): void {
  updateGhostPetIdentity(patch);
}

export function identityCausalUpdateSignature(patch: { crest?: string; colorSystem?: string; motif?: string; publicCard?: string }): void {
  updateSignatureIdentity(patch);
}

export function identityCausalUnlockVault(unlockId: string): void {
  grantVaultUnlock(unlockId);
}

export function identityCausalJournalAppend(clip: string): void {
  appendJournalClip(clip);
}

export { setIdentityMeshPublishEnabled, registerIdentityMeshPublisher };
