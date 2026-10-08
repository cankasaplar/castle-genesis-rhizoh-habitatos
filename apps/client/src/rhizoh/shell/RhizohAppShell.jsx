import React, { useState, useEffect } from "react";
import { NAV_ITEMS } from "./RhizohNavigation.jsx";
import { RhizohHomeScreen } from "../home/RhizohHomeScreen.jsx";
import { RhizohPlayHub } from "../play/RhizohPlayHub.jsx";
import { RhizohWorldHub } from "../world/RhizohWorldHub.jsx";
import { RhizohEvolutionHub } from "../evolution/RhizohEvolutionHub.jsx";
import { RhizohResearchHub } from "../research/RhizohResearchHub.jsx";
import { RhizohLearningHub } from "../learning/RhizohLearningHub.jsx";
import { RhizohCompetitionHub } from "../competition/RhizohCompetitionHub.jsx";
import { RhizohStoryHub } from "../story/RhizohStoryHub.jsx";
import { RhizohEconomyHub } from "../economy/RhizohEconomyHub.jsx";
import { RhizohIdentityHub } from "../identity/RhizohIdentityHub.jsx";
import { RhizohAboutHub } from "../about/RhizohAboutHub.jsx";
import {
  ShieldCheck,
  User,
  Activity,
  Menu,
  X,
  ExternalLink,
  Coins
} from "lucide-react";

export function RhizohAppShell() {
  const [activeTab, setActiveTab] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [playerSession, setPlayerSession] = useState(null);
  const [engineHealth, setEngineHealth] = useState({
    online: true,
    generation: "Generation 1",
    engine: "Castle Core v1.0.2 E5 Champion",
    model: "A50 Golden NNUE"
  });

  useEffect(() => {
    // Fetch Player Session
    const token = localStorage.getItem("rhizoh_player_token");
    fetch(`/api/player/session${token ? `?token=${encodeURIComponent(token)}` : ""}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.player) {
          setPlayerSession(d.player);
          if (d.token) localStorage.setItem("rhizoh_player_token", d.token);
        }
      })
      .catch(() => {});

    // Fetch Engine Health
    fetch("/api/chess/health")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setEngineHealth({
            online: true,
            generation: "Generation 1",
            engine: d.engine || "Castle Core v1.0.2 E5 Champion",
            model: d.model || "A50 Golden NNUE",
            e5_sha: d.engine_sha,
            a50_sha: d.model_sha
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleNavigate = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 flex flex-col justify-between">
      {/* 1. TOP HEADER & BRANDING */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Slogan */}
          <div
            onClick={() => handleNavigate("home")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              R
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wider text-white text-base">RHIZOH</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <span className="text-[10px] font-mono tracking-widest text-emerald-400 block -mt-0.5">
                CONTINUITY IN MOTION
              </span>
            </div>
          </div>

          {/* Center Engine Status (Desktop) */}
          <div className="hidden lg:flex items-center gap-3 text-xs font-mono bg-slate-900/90 border border-slate-800 px-3.5 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300 font-semibold">{engineHealth.generation}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">E5 Champion</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400">Chronicle #001</span>
          </div>

          {/* Right Player Identity / Menu Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNavigate("identity")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all ${
                activeTab === "identity"
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                  : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
              }`}
            >
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">
                {playerSession?.username || "Guest Player"}
              </span>
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* 2. NAVIGATION BAR (DESKTOP) */}
        <nav className="hidden lg:block border-t border-slate-900 bg-slate-950/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between overflow-x-auto scrollbar-none py-1.5 gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono tracking-wider transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-slate-800 text-emerald-400 font-bold border border-slate-700"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/80"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full border ${
                      item.badge.includes("Active")
                        ? "bg-emerald-950/80 border-emerald-800 text-emerald-400"
                        : "bg-slate-900 border-slate-800 text-slate-500"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* MOBILE NAVIGATION DRAWER */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-slate-950 px-4 py-4 space-y-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-mono ${
                    isActive
                      ? "bg-slate-800 text-emerald-400 font-bold border border-slate-700"
                      : "text-slate-400 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* 3. MAIN CONTENT ROUTER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full flex-grow">
        {activeTab === "home" && <RhizohHomeScreen onNavigate={handleNavigate} />}
        {activeTab === "play" && <RhizohPlayHub />}
        {activeTab === "world" && <RhizohWorldHub />}
        {activeTab === "evolution" && <RhizohEvolutionHub />}
        {activeTab === "research" && <RhizohResearchHub />}
        {activeTab === "learning" && <RhizohLearningHub />}
        {activeTab === "competition" && <RhizohCompetitionHub />}
        {activeTab === "story" && <RhizohStoryHub />}
        {activeTab === "economy" && <RhizohEconomyHub />}
        {activeTab === "identity" && <RhizohIdentityHub />}
        {activeTab === "about" && <RhizohAboutHub />}
      </main>

      {/* 4. FOOTER & REALITY SEAL */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-8 text-xs font-mono text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Reality Seal Active</span>
            <span className="text-slate-700">|</span>
            <span>E5: 00ccc8c4...</span>
            <span className="text-slate-700">|</span>
            <span>A50: 39d3d9ce...</span>
          </div>

          <div className="font-serif italic text-slate-400">
            “Bana inanma. İzle.”
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>P0–P13 Continuum</span>
            <button
              onClick={() => handleNavigate("economy")}
              className="text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              Support Rhizoh
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
