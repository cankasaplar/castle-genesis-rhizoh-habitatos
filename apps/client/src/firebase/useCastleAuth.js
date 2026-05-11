import { useEffect, useState, useCallback, useMemo } from "react";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  EmailAuthProvider,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  linkWithPopup,
  sendPasswordResetEmail,
  signOut,
  updateProfile
} from "firebase/auth";
import { getFirestore, doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseApp, firebaseConfigured } from "./castleFirebase.js";
import { buildRhizohAccessLayer } from "../membership/membershipCoreV1.js";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

function mapAuthError(e) {
  const code = String(e?.code || "");
  if (code === "auth/popup-blocked")
    return "Tarayıcı popup penceresini engelledi. Yönlendirme ile tekrar deneniyor.";
  if (code === "auth/unauthorized-domain")
    return "Bu alan adı Firebase yetkili domain listesinde değil. Firebase Console > Authentication > Settings > Authorized domains bölümüne mevcut host adını ekleyin.";
  if (code === "auth/operation-not-allowed")
    return "Google giriş yöntemi kapalı. Firebase Console > Authentication > Sign-in method altında Google'ı etkinleştirin.";
  if (code === "auth/network-request-failed")
    return "Ağ bağlantısı nedeniyle giriş tamamlanamadı. İnternet bağlantınızı kontrol edin.";
  if (code === "auth/email-already-in-use")
    return "Bu e-posta başka bir kullanıcıda kayıtlı.";
  if (code === "auth/provider-already-linked")
    return "Bu giriş yöntemi zaten mevcut hesaba bağlı.";
  if (code === "auth/requires-recent-login")
    return "Bu işlem için yeniden giriş yapmanız gerekiyor.";
  if (code === "auth/invalid-credential")
    return "Kimlik bilgisi geçersiz veya süresi dolmuş. Tekrar giriş deneyin.";
  return e?.message || String(e);
}

export function useCastleAuth() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [authResolved, setAuthResolved] = useState(!firebaseConfigured);
  const [profile, setProfile] = useState(null);
  const [profileReady, setProfileReady] = useState(!firebaseConfigured);
  const [membership, setMembership] = useState(null);
  const [membershipReady, setMembershipReady] = useState(!firebaseConfigured);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const rhizohAccess = useMemo(() => buildRhizohAccessLayer(membership), [membership]);

  useEffect(() => {
    if (!firebaseConfigured) return;
    const app = getFirebaseApp();
    const auth = getAuth(app);
    return onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
      setAuthResolved(true);
      setError("");
      if (!u) {
        setProfile(null);
        setProfileReady(true);
        setMembership(null);
        setMembershipReady(true);
      } else {
        setProfileReady(false);
        setMembershipReady(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!firebaseConfigured || !firebaseUser) return;
    const app = getFirebaseApp();
    const db = getFirestore(app);
    const ref = doc(db, "users", firebaseUser.uid);
    return onSnapshot(
      ref,
      async (snap) => {
        if (!snap.exists()) {
          await setDoc(ref, {
            displayName: firebaseUser.displayName || "",
            photoURL: firebaseUser.photoURL || "",
            onboardingCompleted: false,
            membershipTier: firebaseUser.isAnonymous ? "guest" : "member",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          return;
        }
        setProfile(snap.data());
        setProfileReady(true);
      },
      (e) => setError(String(e.message || e))
    );
  }, [firebaseUser?.uid]);

  useEffect(() => {
    if (!firebaseConfigured || !firebaseUser) {
      setMembership(null);
      setMembershipReady(true);
      return;
    }
    const app = getFirebaseApp();
    const db = getFirestore(app);
    const mref = doc(db, "memberships", firebaseUser.uid);
    setMembershipReady(false);
    return onSnapshot(
      mref,
      (snap) => {
        setMembership(snap.exists() ? snap.data() : null);
        setMembershipReady(true);
      },
      (e) => {
        setError(String(e.message || e));
        setMembershipReady(true);
      }
    );
  }, [firebaseUser?.uid]);

  const signInGuest = useCallback(async () => {
    if (!firebaseConfigured) return;
    setBusy(true);
    setError("");
    try {
      const auth = getAuth(getFirebaseApp());
      await signInAnonymously(auth);
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }, []);

  const signInEmail = useCallback(async (email, password) => {
    if (!firebaseConfigured) return;
    setBusy(true);
    setError("");
    try {
      const auth = getAuth(getFirebaseApp());
      await signInWithEmailAndPassword(auth, String(email).trim(), password);
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }, []);

  const resetPassword = useCallback(async (email) => {
    if (!firebaseConfigured) return;
    const target = String(email || "").trim();
    if (!target) {
      setError("Şifre sıfırlama için e-posta adresi girin.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const auth = getAuth(getFirebaseApp());
      await sendPasswordResetEmail(auth, target);
      setError("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.");
    } catch (e) {
      setError(mapAuthError(e));
    } finally {
      setBusy(false);
    }
  }, []);

  const signUpEmail = useCallback(async (email, password) => {
    if (!firebaseConfigured) return;
    setBusy(true);
    setError("");
    try {
      const auth = getAuth(getFirebaseApp());
      await createUserWithEmailAndPassword(auth, String(email).trim(), password);
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!firebaseConfigured) return;
    setBusy(true);
    setError("");
    try {
      const auth = getAuth(getFirebaseApp());
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      const code = String(e?.code || "");
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        setError("");
      } else if (code === "auth/account-exists-with-different-credential") {
        const auth = getAuth(getFirebaseApp());
        const pending = GoogleAuthProvider.credentialFromError(e);
        const targetEmail = String(e?.customData?.email || "").trim();
        if (!targetEmail) throw e;
        const methods = await fetchSignInMethodsForEmail(auth, targetEmail);
        if (methods.includes("password")) {
          setError(
            "Bu e-posta zaten şifreli hesapta kayıtlı. Önce e-posta+şifre ile giriş yapın, sonra hesap rozetinden Google hesabını bağlayın."
          );
        } else {
          setError("Bu e-posta farklı bir sağlayıcıyla kayıtlı. Önce o yöntemle giriş yapın.");
        }
        try {
          window.__CASTLE_PENDING_GOOGLE_CREDENTIAL__ = pending;
          window.__CASTLE_PENDING_GOOGLE_EMAIL__ = targetEmail;
        } catch {
          /* noop */
        }
      } else if (code === "auth/popup-blocked") {
        // Popup engellendiğinde redirect akışına düşmek mobil ve sıkı tarayıcılarda daha güvenli.
        setError(mapAuthError(e));
        const auth = getAuth(getFirebaseApp());
        await signInWithRedirect(auth, googleProvider);
      } else {
        setError(mapAuthError(e));
      }
    } finally {
      setBusy(false);
    }
  }, []);

  const linkGoogleForCurrentUser = useCallback(async () => {
    if (!firebaseConfigured) return;
    const auth = getAuth(getFirebaseApp());
    if (!auth.currentUser) {
      setError("Önce mevcut hesabınızla giriş yapın.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const pending = window.__CASTLE_PENDING_GOOGLE_CREDENTIAL__ || null;
      if (pending) {
        await linkWithCredential(auth.currentUser, pending);
      } else {
        await linkWithPopup(auth.currentUser, googleProvider);
      }
      try {
        window.__CASTLE_PENDING_GOOGLE_CREDENTIAL__ = null;
        window.__CASTLE_PENDING_GOOGLE_EMAIL__ = null;
      } catch {
        /* noop */
      }
    } catch (e) {
      const code = String(e?.code || "");
      if (code === "auth/credential-already-in-use") {
        setError("Bu Google hesabı başka bir kullanıcıya bağlı. Tek hesaba indirmek için Firebase Console'da hesapları birleştirin.");
      } else {
        setError(mapAuthError(e));
      }
    } finally {
      setBusy(false);
    }
  }, []);

  const linkEmailForCurrentUser = useCallback(async (email, password) => {
    if (!firebaseConfigured) return;
    const auth = getAuth(getFirebaseApp());
    if (!auth.currentUser) {
      setError("Önce mevcut hesabınızla giriş yapın.");
      return;
    }
    const targetEmail = String(email || "").trim();
    if (!targetEmail || !password) {
      setError("E-posta hesabını bağlamak için e-posta ve şifre gerekli.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const cred = EmailAuthProvider.credential(targetEmail, password);
      await linkWithCredential(auth.currentUser, cred);
    } catch (e) {
      setError(mapAuthError(e));
    } finally {
      setBusy(false);
    }
  }, []);

  const signOutUser = useCallback(async () => {
    if (!firebaseConfigured) return;
    setBusy(true);
    setError("");
    try {
      const auth = getAuth(getFirebaseApp());
      await signOut(auth);
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }, []);

  const completeOnboarding = useCallback(
    async (displayName) => {
      if (!firebaseConfigured || !firebaseUser) return;
      setBusy(true);
      setError("");
      try {
        const name = String(displayName || "").trim();
        if (name) await updateProfile(firebaseUser, { displayName: name });
        const db = getFirestore(getFirebaseApp());
        const ref = doc(db, "users", firebaseUser.uid);
        await setDoc(
          ref,
          {
            displayName: name || firebaseUser.displayName || "",
            onboardingCompleted: true,
            updatedAt: serverTimestamp()
          },
          { merge: true }
        );
      } catch (e) {
        setError(e?.message || String(e));
      } finally {
        setBusy(false);
      }
    },
    [firebaseUser]
  );

  const skipOnboardingDisplayOnly = useCallback(async () => {
    if (!firebaseConfigured || !firebaseUser) return;
    setBusy(true);
    setError("");
    try {
      const db = getFirestore(getFirebaseApp());
      const ref = doc(db, "users", firebaseUser.uid);
      await setDoc(
        ref,
        {
          displayName: firebaseUser.displayName || (firebaseUser.isAnonymous ? "Misafir" : ""),
          onboardingCompleted: true,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }, [firebaseUser]);

  const needsAuthGate = firebaseConfigured && authResolved && !firebaseUser;
  const needsOnboarding =
    firebaseConfigured && authResolved && firebaseUser && profileReady && profile && profile.onboardingCompleted !== true;

  return {
    firebaseConfigured,
    authResolved,
    profileReady,
    membership,
    membershipReady,
    rhizohAccess,
    user: firebaseUser,
    profile,
    error,
    busy,
    needsAuthGate,
    needsOnboarding,
    signInGuest,
    signInEmail,
    signUpEmail,
    resetPassword,
    signInWithGoogle,
    linkGoogleForCurrentUser,
    linkEmailForCurrentUser,
    signOutUser,
    completeOnboarding,
    skipOnboardingDisplayOnly
  };
}
