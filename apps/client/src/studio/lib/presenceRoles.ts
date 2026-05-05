import type { PresenceRole } from "../types/rskOntology";

export const PRESENCE_ROLE_IDS: readonly PresenceRole[] = [
  "owner",
  "moderator",
  "speaker",
  "guest",
  "vip",
  "builder",
  "agent",
  "observer"
];

export function isPresenceRole(v: unknown): v is PresenceRole {
  return typeof v === "string" && (PRESENCE_ROLE_IDS as readonly string[]).includes(v);
}

export function roleCanModerate(role: PresenceRole | undefined): boolean {
  return role === "owner" || role === "moderator";
}
