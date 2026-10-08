import React, { useState, useEffect } from "react";
import { User, Shield, Trophy, Clock, Swords, CheckCircle2, ChevronRight, Lock, Award, History, Activity, Sparkles, BookOpen } from "lucide-react";

export default function RhizohPlayerProfile({ player, onUpdatePlayer, onPlayRhizoh, onBackToOverview }) {
  const [activeSubTab, setActiveSubTab] = useState("overview"); // 'overview' | 'games' | 'my-rhizoh'
  const [games, setGames] = useState([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [newHandle, setNewHandle] = useState(player?.handle?.startsWith("anon-") ? "" : (player?.handle || ""));
  const [newDisplayName, setNewDisplayName] = useState(player?.display_name?.startsWith("Anonymous") ? "" : (player?.display_name || ""));
  const [claimError, setClaimError] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [selectedPgn, setSelectedPgn] = useState(null);

  useEffect(() => {
    if (!player?.player_id) return;
    let isMounted = true;
    const fetchGames = async () => {
      setGamesLoading(true);
      try {
        const res = await fetch(`/api/player/games?id=${player.player_id}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.games) {
            setGames(data.games);
          }
        }
      } catch (err) {
        console.error("Failed to load player games:", err);
      } finally {
        if (isMounted) setGamesLoading(false);
      }
    };
    fetchGames();
    return () => { isMounted = false; };
  }, [player?.player_id]);

  const handleClaim = async (e) => {
    e.preventDefault();
    setClaimError(null);
    setClaiming(true);
    try {
      const res = await fetch("/api/player/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: player.player_id,
          sessionToken: localStorage.getItem("rhizoh_player_token"),
          newHandle,
          displayName: newDisplayName || newHandle
        })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        onUpdatePlayer(data.player);
        setClaimModalOpen(false);
      } else {
        setClaimError(data.message || data.error || "Claim failed.");
      }
    } catch (err) {
      setClaimError(err.message);
    } finally {
      setClaiming(false);
    }
  };

  const blitzRating = player?.ratings?.blitz ?? 1200;
  const isProvisional = player?.ratings_provisional?.blitz !== false;
  const totalGames = player?.stats?.games_played ?? 0;
  const wins = player?.stats?.wins ?? 0;
  const draws = player?.stats?.draws ?? 0;
  const losses = player?.stats?.losses ?? 0;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1040, margin: "0 auto" }}>
      {/* Top Banner & Identity Card */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.7) 100%)",
          border: "1px solid rgba(148, 163, 184, 0.2)",
          borderRadius: 20,
          padding: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20,
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: player?.is_anonymous
                ? "linear-gradient(135deg, #64748b 0%, #475569 100%)"
                : "linear-gradient(135deg, #10b981 0%, #065f46 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#f8fafc",
              fontSize: 26,
              fontWeight: 900,
              boxShadow: player?.is_anonymous ? "none" : "0 0 20px rgba(16, 185, 129, 0.4)",
              border: "2px solid rgba(255,255,255,0.2)"
            }}
          >
            {player?.display_name ? player.display_name.charAt(0).toUpperCase() : "A"}
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#f8fafc", letterSpacing: "-0.01em" }}>
                {player?.display_name || "Anonymous Challenger"}
              </h1>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 6,
                  background: player?.is_anonymous ? "rgba(148, 163, 184, 0.15)" : "rgba(16, 185, 129, 0.2)",
                  color: player?.is_anonymous ? "#94a3b8" : "#34d399",
                  border: `1px solid ${player?.is_anonymous ? "rgba(148, 163, 184, 0.3)" : "rgba(16, 185, 129, 0.4)"}`
                }}
              >
                {player?.is_anonymous ? "Provisional Guest" : "Verified Account"}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4, fontSize: 13, color: "#94a3b8" }}>
              <span>@{player?.handle || "anon"}</span>
              <span>•</span>
              <span>ID: <code style={{ color: "#38bdf8" }}>{player?.player_id?.slice(0, 14)}...</code></span>
              <span>•</span>
              <span>Joined: {player?.created_at ? player.created_at.slice(0, 10) : "2026-10-08"}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {player?.is_anonymous && (
            <button
              onClick={() => setClaimModalOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 10,
                background: "rgba(56, 189, 248, 0.15)",
                color: "#38bdf8",
                border: "1px solid rgba(56, 189, 248, 0.4)",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <Sparkles size={14} /> Claim Custom Handle
            </button>
          )}
          <button
            onClick={onPlayRhizoh}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 18px",
              borderRadius: 10,
              background: "#10b981",
              color: "#020617",
              border: "none",
              fontWeight: 800,
              fontSize: 13,
              cursor: "pointer",
              boxShadow: "0 0 16px rgba(16, 185, 129, 0.4)"
            }}
          >
            <Swords size={15} /> Play Rhizoh
          </button>
        </div>
      </div>

      {/* Ratings Strip (Phase 2 - P2-B & P2-C) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        {/* Blitz */}
        <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(148, 163, 184, 0.15)", borderRadius: 14, padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>⚡ Blitz</span>
            {isProvisional && <span style={{ fontSize: 10, color: "#f59e0b", background: "rgba(245, 158, 11, 0.15)", padding: "1px 6px", borderRadius: 4 }}>Provisional</span>}
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#f8fafc" }}>
            {totalGames > 0 ? blitzRating : 1200}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Anchor Challenge Elo</div>
        </div>

        {/* Rapid */}
        <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(148, 163, 184, 0.15)", borderRadius: 14, padding: "16px 20px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>⏱️ Rapid</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#64748b" }}>—</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Unrated (Reality Seal: No Mock)</div>
        </div>

        {/* Classical */}
        <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(148, 163, 184, 0.15)", borderRadius: 14, padding: "16px 20px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>🏛️ Classical</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#64748b" }}>—</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Unrated (Reality Seal: No Mock)</div>
        </div>

        {/* Puzzle */}
        <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(148, 163, 184, 0.15)", borderRadius: 14, padding: "16px 20px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>🧩 Tactical Rating</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#64748b" }}>—</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Unrated (Reality Seal: No Mock)</div>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid rgba(148, 163, 184, 0.15)", paddingBottom: 10 }}>
        <button
          onClick={() => setActiveSubTab("overview")}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            background: activeSubTab === "overview" ? "rgba(255, 255, 255, 0.1)" : "transparent",
            color: activeSubTab === "overview" ? "#f8fafc" : "#94a3b8",
            border: "none",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer"
          }}
        >
          📊 Performance Overview
        </button>
        <button
          onClick={() => setActiveSubTab("games")}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            background: activeSubTab === "games" ? "rgba(255, 255, 255, 0.1)" : "transparent",
            color: activeSubTab === "games" ? "#f8fafc" : "#94a3b8",
            border: "none",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer"
          }}
        >
          📜 My Verified Games ({games.length})
        </button>
        <button
          onClick={() => setActiveSubTab("my-rhizoh")}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            background: activeSubTab === "my-rhizoh" ? "rgba(56, 189, 248, 0.15)" : "transparent",
            color: activeSubTab === "my-rhizoh" ? "#38bdf8" : "#94a3b8",
            border: "none",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer"
          }}
        >
          🧠 My Rhizoh (Relationship Identity)
        </button>
      </div>

      {/* Sub-tab Content: Overview */}
      {activeSubTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18 }}>
          {/* Match Record */}
          <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(148, 163, 184, 0.15)", borderRadius: 16, padding: 22 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#f8fafc", margin: "0 0 16px" }}>🏆 Match Record</h3>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#f8fafc" }}>{totalGames}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Matches Played</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#10b981" }}>{wins}W / {draws}D / {losses}L</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Win Rate: {winRate}%</div>
              </div>
            </div>
            <div style={{ height: 6, background: "rgba(148, 163, 184, 0.15)", borderRadius: 3, overflow: "hidden", display: "flex" }}>
              <div style={{ width: `${winRate}%`, background: "#10b981" }} />
              <div style={{ width: `${totalGames > 0 ? (draws / totalGames) * 100 : 0}%`, background: "#64748b" }} />
              <div style={{ width: `${totalGames > 0 ? (losses / totalGames) * 100 : 0}%`, background: "#f43f5e" }} />
            </div>
          </div>

          {/* Performance Accuracy & Error Breakdown */}
          <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(148, 163, 184, 0.15)", borderRadius: 16, padding: 22 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#f8fafc", margin: "0 0 16px" }}>🎯 Precision & Error Analysis</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Decision Accuracy</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#64748b", marginTop: 2 }}>—</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Blunder Rate</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#64748b", marginTop: 2 }}>—</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Mistakes</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#64748b", marginTop: 2 }}>—</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Avg Move Time</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#64748b", marginTop: 2 }}>—</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 14, fontStyle: "italic" }}>
              * Deep telemetry evaluation is performed during Phase 2 game processing.
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab Content: My Games (Phase 2 - P2-D) */}
      {activeSubTab === "games" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {gamesLoading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Loading cryptographic game ledger...</div>
          ) : games.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, background: "rgba(15, 23, 42, 0.6)", borderRadius: 16, border: "1px dashed rgba(148, 163, 184, 0.2)" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>♟️</div>
              <h4 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800, color: "#f8fafc" }}>No Verified Games Yet</h4>
              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#94a3b8" }}>Play a match against Rhizoh Castle Core to mint your first verified game into the Event Ledger.</p>
              <button
                onClick={onPlayRhizoh}
                style={{ padding: "8px 18px", borderRadius: 10, background: "#10b981", color: "#020617", border: "none", fontWeight: 800, fontSize: 13, cursor: "pointer" }}
              >
                Start Match Now
              </button>
            </div>
          ) : (
            games.map((g, idx) => (
              <div
                key={g.game_id || idx}
                style={{
                  background: "rgba(15, 23, 42, 0.75)",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  borderRadius: 14,
                  padding: "16px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 14
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 900, color: g.result === "1-0" ? "#10b981" : (g.result === "0-1" ? "#f43f5e" : "#e2e8f0"), background: "rgba(255,255,255,0.08)", padding: "2px 8px", borderRadius: 4 }}>
                      {g.result}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#f8fafc" }}>
                      {g.white} vs {g.black}
                    </span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>({g.termination})</span>
                  </div>

                  <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 11, color: "#64748b" }}>
                    <span>Plies: {g.ply_count}</span>
                    <span>•</span>
                    <span>TC: {g.time_control}</span>
                    <span>•</span>
                    <span>Date: {g.timestamp_utc?.slice(0, 10)}</span>
                    <span>•</span>
                    <span>PGN SHA: <code style={{ color: "#34d399" }}>{g.pgn_sha256?.slice(0, 12)}...</code></span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "#38bdf8", border: "1px solid rgba(56, 189, 248, 0.3)", padding: "4px 8px", borderRadius: 6 }}>
                    ✓ Replay Verified
                  </span>
                  {g.canonical_pgn && (
                    <button
                      onClick={() => setSelectedPgn(selectedPgn === g.canonical_pgn ? null : g.canonical_pgn)}
                      style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.08)", color: "#f8fafc", border: "none", fontSize: 12, cursor: "pointer", fontWeight: 700 }}
                    >
                      {selectedPgn === g.canonical_pgn ? "Hide PGN" : "View PGN"}
                    </button>
                  )}
                </div>

                {selectedPgn === g.canonical_pgn && (
                  <div style={{ width: "100%", marginTop: 10, background: "rgba(2, 6, 23, 0.8)", padding: 12, borderRadius: 8, border: "1px solid rgba(148, 163, 184, 0.15)" }}>
                    <pre style={{ margin: 0, fontSize: 11, color: "#94a3b8", whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                      {g.canonical_pgn}
                    </pre>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Sub-tab Content: My Rhizoh (Relationship Identity) */}
      {activeSubTab === "my-rhizoh" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ background: "rgba(15, 23, 42, 0.75)", border: "1px solid rgba(56, 189, 248, 0.3)", borderRadius: 16, padding: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <Sparkles size={18} style={{ color: "#38bdf8" }} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#f8fafc" }}>
                Relationship Dynamics: You & Rhizoh E5 Champion
              </h3>
            </div>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
              Rhizoh continuously builds a localized behavioral profile of your play style, opening comfort, and tactical vulnerabilities.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
              <div style={{ background: "rgba(0,0,0,0.3)", padding: 14, borderRadius: 10, border: "1px solid rgba(148, 163, 184, 0.1)" }}>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Total Encounters</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#f8fafc", marginTop: 2 }}>{player?.my_rhizoh?.matches_vs_rhizoh ?? 0}</div>
              </div>
              <div style={{ background: "rgba(0,0,0,0.3)", padding: 14, borderRadius: 10, border: "1px solid rgba(148, 163, 184, 0.1)" }}>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Score vs Rhizoh</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#10b981", marginTop: 2 }}>
                  {player?.my_rhizoh?.wins_vs_rhizoh ?? 0}W - {player?.my_rhizoh?.draws_vs_rhizoh ?? 0}D - {player?.my_rhizoh?.losses_vs_rhizoh ?? 0}L
                </div>
              </div>
              <div style={{ background: "rgba(0,0,0,0.3)", padding: 14, borderRadius: 10, border: "1px solid rgba(148, 163, 184, 0.1)" }}>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Engine Version Met</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#38bdf8", marginTop: 4 }}>Castle Core v1.0.2 E5</div>
              </div>
            </div>

            {/* Strict Firewall Callout */}
            <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.3)", display: "flex", alignItems: "flex-start", gap: 10 }}>
              <Shield size={16} style={{ color: "#f43f5e", marginTop: 2, flexShrink: 0 }} />
              <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.5 }}>
                <b style={{ color: "#f43f5e" }}>Strict Governance Firewall:</b> Your personal tendencies, profile metrics, and games are maintained as isolated research observations. Under no circumstances do personal play logs directly mutate the immutable production NNUE weights.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Claim Profile Modal */}
      {claimModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div style={{ background: "#0f172a", border: "1px solid rgba(148, 163, 184, 0.25)", borderRadius: 20, padding: 28, width: "100%", maxWidth: 440, boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 900, color: "#f8fafc" }}>Claim Your Player Identity</h3>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>
              Choose a custom username to turn your provisional session into a permanent, verified identity. All existing games and rating history are seamlessly preserved.
            </p>

            {claimError && (
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(244, 63, 94, 0.15)", border: "1px solid rgba(244, 63, 94, 0.4)", color: "#f43f5e", fontSize: 12, marginBottom: 14 }}>
                {claimError}
              </div>
            )}

            <form onSubmit={handleClaim} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>Username (Handle)</label>
                <input
                  type="text"
                  value={newHandle}
                  onChange={(e) => setNewHandle(e.target.value)}
                  placeholder="e.g. can_kasaplar"
                  required
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(2, 6, 23, 0.8)", border: "1px solid rgba(148, 163, 184, 0.2)", color: "#f8fafc", fontSize: 14, boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>Display Name</label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="e.g. Can Kasaplar"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(2, 6, 23, 0.8)", border: "1px solid rgba(148, 163, 184, 0.2)", color: "#f8fafc", fontSize: 14, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setClaimModalOpen(false)}
                  style={{ padding: "8px 16px", borderRadius: 8, background: "transparent", color: "#94a3b8", border: "1px solid rgba(148, 163, 184, 0.2)", fontSize: 13, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={claiming}
                  style={{ padding: "8px 20px", borderRadius: 8, background: "#10b981", color: "#020617", border: "none", fontWeight: 800, fontSize: 13, cursor: "pointer" }}
                >
                  {claiming ? "Claiming..." : "Confirm & Claim"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
