import React, { useState, useEffect } from "react";
import { User, LogIn, LogOut, Loader2 } from "lucide-react";

function GoogleMark() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-.9 2.4-1.9 3.1l3 2.3c1.8-1.7 2.8-4.1 2.8-7.1 0-.7-.1-1.3-.2-2H12z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.4 0 4.5-.8 6-2.2l-3-2.3c-.8.5-1.8.9-3 .9-2.3 0-4.3-1.6-5-3.7H4v2.4C5.5 20 8.6 22 12 22z"
      />
      <path
        fill="#4A90E2"
        d="M7 13.9c-.2-.5-.3-1.1-.3-1.9s.1-1.4.3-1.9V7.7H4.1C3.4 9.1 3 10.5 3 12s.4 2.9 1.1 4.3L7 13.9z"
      />
      <path
        fill="#FBBC05"
        d="M12 5.4c1.3 0 2.5.4 3.4 1.2l2.6-2.6C16.5 2.7 14.4 2 12 2 8.6 2 5.5 4 4.1 7.7L7 10.1c.7-2.1 2.7-3.7 5-3.7z"
      />
    </svg>
  );
}

function panelClass() {
  return "bg-[#0a0f2a]/98 border border-cyan-400/40 rounded-[2rem] shadow-[0_0_80px_rgba(0,255,255,0.12)] backdrop-blur-xl p-8 max-w-md w-full pointer-events-auto";
}

export function CastleAccountBadge({ auth }) {
  const { firebaseConfigured, user, profile, signOutUser, busy } = auth;
  if (!firebaseConfigured || !user) return null;
  const label =
    profile?.displayName ||
    user.displayName ||
    (user.isAnonymous ? "Misafir" : null) ||
    user.email?.split("@")[0] ||
    "Üye";
  const tier = profile?.membershipTier === "guest" ? "misafir" : "üye";
  return (
    <div className="flex items-center gap-2 self-end text-[10px] font-black tracking-widest text-cyan-200/90 uppercase pointer-events-auto">
      <User size={14} className="text-cyan-400 shrink-0" />
      <span className="truncate max-w-[140px]" title={user.email || user.uid}>
        {label}
      </span>
      <span className="text-white/35">·</span>
      <span className="text-white/50">{tier}</span>
      <button
        type="button"
        disabled={busy}
        onClick={() => void signOutUser()}
        className="ml-1 p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-rose-300 border border-white/10 disabled:opacity-40"
        title="Çıkış"
      >
        <LogOut size={14} />
      </button>
    </div>
  );
}

export function CastleAuthOverlay({ auth }) {
  const {
    firebaseConfigured,
    authResolved,
    needsAuthGate,
    needsOnboarding,
    error,
    busy,
    signInGuest,
    signInEmail,
    signUpEmail,
    signInWithGoogle,
    user: authUser,
    completeOnboarding,
    skipOnboardingDisplayOnly
  } = auth;

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (needsOnboarding && authUser?.displayName) setDisplayName(authUser.displayName);
  }, [needsOnboarding, authUser?.uid, authUser?.displayName]);

  if (!firebaseConfigured) return null;
  if (!authResolved) {
    return (
      <div className="absolute inset-0 z-[5900] flex items-center justify-center bg-[#010103]/80 pointer-events-auto">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (needsAuthGate) {
    return (
      <div className="absolute inset-0 z-[6000] flex items-center justify-center bg-[#010103]/95 p-6 pointer-events-auto">
        <div className={panelClass()}>
          <div className="text-[11px] text-cyan-400 tracking-[0.4em] mb-2 uppercase">Castle Genesis</div>
          <h1 className="text-xl text-white font-black tracking-tight mb-1 normal-case">Hoş geldiniz</h1>
          <p className="text-[11px] text-white/50 leading-relaxed mb-6 normal-case font-medium">
            Üyelik ile ilerlemeniz Firestore&apos;da güvenli şekilde saklanır. İsterseniz önce misafir olarak deneyebilirsiniz.
          </p>

          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest ${
                mode === "login" ? "bg-cyan-400 text-black" : "bg-white/5 text-white/60"
              }`}
            >
              <LogIn size={14} className="inline mr-1 align-text-bottom" />
              Giriş
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest ${
                mode === "register" ? "bg-cyan-400 text-black" : "bg-white/5 text-white/60"
              }`}
            >
              Kayıt
            </button>
          </div>

          <div className="space-y-3 mb-4 normal-case">
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta"
              className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60"
            />
            <input
              type="password"
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifre (en az 6 karakter)"
              className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60"
            />
          </div>

          {error ? <div className="text-rose-400 text-[11px] mb-3 normal-case font-medium">{error}</div> : null}

          <button
            type="button"
            disabled={busy}
            onClick={() => (mode === "login" ? void signInEmail(email, password) : void signUpEmail(email, password))}
            className="w-full py-3 rounded-xl bg-cyan-400 text-black font-black text-xs uppercase tracking-widest mb-3 disabled:opacity-50"
          >
            {busy ? "…" : mode === "login" ? "Giriş yap" : "Hesap oluştur"}
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] text-white/35 uppercase tracking-widest">veya</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() => void signInWithGoogle()}
            className="w-full py-3 rounded-xl bg-white text-gray-900 font-black text-xs uppercase tracking-widest mb-3 flex items-center justify-center gap-2 disabled:opacity-50 border border-white/20"
          >
            <GoogleMark />
            Google ile devam et
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => void signInGuest()}
            className="w-full py-3 rounded-xl bg-white/10 text-white font-black text-xs uppercase tracking-widest border border-white/15 mb-2 disabled:opacity-50"
          >
            Misafir olarak devam et
          </button>
          <p className="text-[10px] text-white/35 normal-case leading-relaxed">
            Firebase Authentication: E-posta/Şifre, Google ve Anonim yöntemleri etkin olmalı; Hosting alan adınızı yetkili domain listesine ekleyin.
          </p>
        </div>
      </div>
    );
  }

  if (needsOnboarding) {
    return (
      <div className="absolute inset-0 z-[6000] flex items-center justify-center bg-[#010103]/90 p-6 pointer-events-auto">
        <div className={panelClass()}>
          <div className="text-[11px] text-cyan-400 tracking-[0.4em] mb-2 uppercase">Onboarding</div>
          <h2 className="text-lg text-white font-black mb-2 normal-case">Profilinizi tamamlayın</h2>
          <p className="text-[11px] text-white/50 mb-4 normal-case font-medium">
            Görünen adınız arayüzde gösterilir. İsterseniz atlayıp sonra düzenleyebilirsiniz.
          </p>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Görünen ad"
            className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60 mb-4 normal-case"
          />
          {error ? <div className="text-rose-400 text-[11px] mb-3 normal-case">{error}</div> : null}
          <button
            type="button"
            disabled={busy}
            onClick={() => void completeOnboarding(displayName)}
            className="w-full py-3 rounded-xl bg-cyan-400 text-black font-black text-xs uppercase tracking-widest mb-2 disabled:opacity-50"
          >
            {busy ? "…" : "Başla"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void skipOnboardingDisplayOnly()}
            className="w-full py-2 text-[11px] text-white/45 uppercase tracking-widest hover:text-white/70"
          >
            Atla
          </button>
        </div>
      </div>
    );
  }

  return null;
}
