/** Gemini Visual Master Tower — design SSOT (V11 workspace). */

export const GEMINI_TOWER_GALLERY_STORAGE_KEY_V0 = "gemini_tower_gallery";

export const GEMINI_TOWER_DESIGN_V0 = Object.freeze({
  identity: Object.freeze({
    name: "Gemini Visual Master Tower",
    tagline: "Imagine. Create. Manifest.",
    personality: Object.freeze(["imaginative", "prismatic", "multimodal", "fluid"]),
    style: "Glassmorphism + Neon Futurism",
    colors: Object.freeze({
      background: "#0F172A",
      primary: "#D946EF",
      secondary: "#3B82F6",
      accent: "#8B5CF6",
      gradient: "linear-gradient(135deg, #3B82F6 0%, #D946EF 100%)",
      text: "#F8FAFC"
    })
  }),
  rooms: Object.freeze([
    Object.freeze({
      id: "lobby",
      name: "Prism Gallery",
      icon: "💎",
      description: "The showcase of generated masterpieces.",
      default: false
    }),
    Object.freeze({
      id: "imagine_atelier",
      name: "Imagine Atelier",
      icon: "🎨",
      description: "The main canvas. Where words become pixels.",
      default: true
    }),
    Object.freeze({
      id: "vision_lens",
      name: "Vision Lens",
      icon: "👁️",
      description: "Multimodal analysis and reverse-engineering.",
      default: false
    }),
    Object.freeze({
      id: "motion_deck",
      name: "Motion Deck",
      icon: "🎬",
      description: "Time-based creativity (Video/GIF).",
      default: false
    }),
    Object.freeze({
      id: "dimension_sandbox",
      name: "Dimension Sandbox",
      icon: "🧊",
      description: "3D exploration space.",
      default: false
    })
  ])
});

export function resolveDefaultGeminiTowerRoomIdV0() {
  return GEMINI_TOWER_DESIGN_V0.rooms.find((r) => r.default)?.id || "imagine_atelier";
}
