import React from "react";
import {
  Home,
  Play,
  Globe,
  GitBranch,
  FlaskConical,
  GraduationCap,
  Trophy,
  Film,
  Coins,
  Shield,
  User,
  Activity,
  Layers,
  Sparkles
} from "lucide-react";

export const NAV_ITEMS = [
  {
    id: "home",
    label: "HOME",
    icon: Home,
    badge: null,
    subsections: []
  },
  {
    id: "play",
    label: "PLAY",
    icon: Play,
    badge: "E5 Active",
    subsections: [
      { id: "human-vs-rhizoh", label: "Human vs Rhizoh", status: "LIVE" },
      { id: "human-vs-human", label: "Human vs Human", status: "LIVE" },
      { id: "rhizoh-vs-rhizoh", label: "Rhizoh vs Rhizoh", status: "RESEARCH" },
      { id: "puzzles", label: "Puzzles", status: "LIVE" },
      { id: "tournaments", label: "Tournaments", status: "LAB" }
    ]
  },
  {
    id: "world",
    label: "WORLD",
    icon: Globe,
    badge: "Chronicle #001",
    subsections: [
      { id: "live", label: "Live Games", status: "LIVE" },
      { id: "chronicle", label: "Chronicle", status: "SEALED" },
      { id: "games", label: "Games Archive", status: "LIVE" },
      { id: "events", label: "Events", status: "LIVE" },
      { id: "news", label: "News", status: "LAB" },
      { id: "perspective", label: "Rhizoh Perspective", status: "ACTIVE" }
    ]
  },
  {
    id: "evolution",
    label: "EVOLUTION",
    icon: GitBranch,
    badge: "Gen 1",
    subsections: [
      { id: "generations", label: "Generations", status: "ACTIVE" },
      { id: "models", label: "Models Lineage", status: "LIVE" },
      { id: "engine-history", label: "Engine History", status: "LIVE" },
      { id: "strength", label: "Strength Graph", status: "LIVE" },
      { id: "promotions", label: "Promotions", status: "SEALED" }
    ]
  },
  {
    id: "research",
    label: "RESEARCH",
    icon: FlaskConical,
    badge: "Lab Active",
    subsections: [
      { id: "experiments", label: "Experiments", status: "ACTIVE" },
      { id: "engine-council", label: "Engine Council", status: "ACTIVE" },
      { id: "time-controls", label: "Time Controls", status: "ACTIVE" },
      { id: "search-forensics", label: "Search Forensics", status: "ACTIVE" },
      { id: "datasets", label: "Datasets", status: "ACTIVE" },
      { id: "self-play-arena", label: "Self-Play Arena", status: "LAB" },
      { id: "evaluation-suites", label: "Evaluation Suites", status: "ACTIVE" },
      { id: "sprt", label: "SPRT Gauntlets", status: "ACTIVE" }
    ]
  },
  {
    id: "learning",
    label: "LEARNING",
    icon: GraduationCap,
    badge: "P6",
    subsections: [
      { id: "contributions", label: "Contributions", status: "ACTIVE" },
      { id: "candidates", label: "Research Candidates", status: "ACTIVE" },
      { id: "training", label: "Bounded Training", status: "LAB" },
      { id: "validation", label: "Validation Gates", status: "ACTIVE" },
      { id: "provenance", label: "Provenance Ledger", status: "SEALED" }
    ]
  },
  {
    id: "competition",
    label: "COMPETITION",
    icon: Trophy,
    badge: "P8-P10",
    subsections: [
      { id: "external", label: "External Games", status: "LAB" },
      { id: "ai-championships", label: "AI Championships", status: "LAB" },
      { id: "human-vs-ai", label: "Human vs AI", status: "LIVE" },
      { id: "results", label: "Results Table", status: "ACTIVE" }
    ]
  },
  {
    id: "story",
    label: "STORY",
    icon: Film,
    badge: "P11",
    subsections: [
      { id: "episodes", label: "Episodes", status: "UPCOMING" },
      { id: "youtube", label: "YouTube Engine", status: "UPCOMING" },
      { id: "shorts", label: "Shorts", status: "UPCOMING" },
      { id: "social", label: "Social", status: "UPCOMING" }
    ]
  },
  {
    id: "economy",
    label: "SUPPORT RHIZOH",
    icon: Coins,
    badge: "P12 Active",
    subsections: [
      { id: "support", label: "Support Rhizoh", status: "LIVE" },
      { id: "membership", label: "Membership", status: "LIVE" },
      { id: "sponsors", label: "Sponsors Ledger", status: "LIVE" },
      { id: "compute-partners", label: "Compute Partners", status: "LIVE" },
      { id: "research-sponsorship", label: "Research Sponsorship", status: "LIVE" }
    ]
  },
  {
    id: "about",
    label: "ABOUT",
    icon: Shield,
    badge: null,
    subsections: [
      { id: "philosophy", label: "Philosophy", status: "READ" },
      { id: "architecture", label: "Architecture (P0-P13)", status: "READ" },
      { id: "reality-seal", label: "Reality Seal", status: "SEALED" },
      { id: "provenance", label: "Epistemic Provenance", status: "READ" }
    ]
  }
];
