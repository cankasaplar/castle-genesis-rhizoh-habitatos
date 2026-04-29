(function initCastleStudioShared() {
  const SETTINGS_KEY = "CASTLE_STUDIO_SETTINGS";
  const defaults = {
    language: "tr",
    accent: "#8b5cf6",
    accent2: "#22d3ee"
  };

  function readSettings() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
      return { ...defaults, ...parsed };
    } catch {
      return { ...defaults };
    }
  }

  function writeSettings(next) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  }

  function applySettings(settings) {
    const root = document.documentElement;
    root.style.setProperty("--castle-accent", settings.accent);
    root.style.setProperty("--castle-accent-2", settings.accent2);
    document.documentElement.lang = settings.language || "tr";
    window.dispatchEvent(new CustomEvent("castle:settings-changed", { detail: settings }));
  }

  const settings = readSettings();
  applySettings(settings);

  window.CastleStudioSettings = {
    get: () => ({ ...settings }),
    set: (patch) => {
      const next = { ...readSettings(), ...(patch || {}) };
      writeSettings(next);
      applySettings(next);
      return next;
    }
  };
})();
