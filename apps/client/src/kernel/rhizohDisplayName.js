/**
 * Rhizoh selamları için kısa görünen ad (Firebase Auth + users/{uid} profili).
 * İsim yoksa null — genel selam kullanılır (herkese "Can" denmez).
 */
export function resolveRhizohFirstName(user, profile) {
  const fromProfile = String(profile?.displayName || "").trim();
  const fromAuth = String(user?.displayName || "").trim();
  const combined = fromProfile || fromAuth;
  if (combined) {
    const first = combined.split(/\s+/)[0];
    return first || null;
  }
  const email = user?.email;
  if (email && typeof email === "string") {
    const local = email.split("@")[0];
    if (local) {
      const safe = local.replace(/[._-]+/g, " ").trim();
      if (!safe) return null;
      return safe.charAt(0).toUpperCase() + safe.slice(1);
    }
  }
  return null;
}

/** Sesli / kısa Türkçe keşif selamı */
export function buildRhizohExploreGreeting(firstName) {
  return firstName
    ? `Merhaba ${firstName}. Bugun ne kesfediyoruz?`
    : "Merhaba. Bugun ne kesfediyoruz?";
}

/** Sağ üst bilgi kartı (İngilizce) */
export function buildRhizohWelcomeBackLine(firstName) {
  return firstName
    ? `Welcome back, ${firstName}. Your world kept evolving.`
    : "Welcome back. Your world kept evolving.";
}
