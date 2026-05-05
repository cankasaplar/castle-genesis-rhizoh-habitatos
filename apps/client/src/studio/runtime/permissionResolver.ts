/**
 * Namespace wildcard permission matching.
 * Examples: registry.*, registry.mind.*, registry.mind.register
 */

export function permissionKeyAllowsAction(key: string, action: string): boolean {
  if (key === action) return true;
  if (key.endsWith(".*")) {
    const base = key.slice(0, -2);
    return action === base || action.startsWith(`${base}.`);
  }
  return false;
}

export function identityAllowsAction(
  permissions: Record<string, boolean>,
  action: string
): boolean {
  for (const [k, granted] of Object.entries(permissions)) {
    if (!granted) continue;
    if (permissionKeyAllowsAction(k, action)) return true;
  }
  return false;
}
