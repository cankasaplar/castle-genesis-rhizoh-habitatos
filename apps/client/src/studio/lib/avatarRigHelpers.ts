import type { AvatarRigAnimationState } from "../types/rskOntology";

export function mapReactionKindToRig(kind: string): AvatarRigAnimationState {
  const k = kind.toLowerCase();
  if (k.includes("applaud") || k.includes("clap")) return "clap";
  if (k.includes("cheer")) return "cheer";
  if (k.includes("laugh")) return "laugh";
  if (k.includes("think")) return "think";
  return "laugh";
}
