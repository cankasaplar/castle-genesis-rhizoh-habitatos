import { useEffect, useState, useCallback } from "react";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile
} from "firebase/auth";
import { getFirestore, doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseApp, firebaseConfigured } from "./castleFirebase.js";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export function useCastleAuth() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [authResolved, setAuthResolved] = useState(!firebaseConfigured);
  const [profile, setProfile] = useState(null);
  const [profileReady, setProfileReady] = useState(!firebaseConfigured);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
      } else {
        setProfileReady(false);
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
      if (e?.code === "auth/popup-closed-by-user" || e?.code === "auth/cancelled-popup-request") {
        setError("");
      } else {
        setError(e?.message || String(e));
      }
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
    user: firebaseUser,
    profile,
    error,
    busy,
    needsAuthGate,
    needsOnboarding,
    signInGuest,
    signInEmail,
    signUpEmail,
    signInWithGoogle,
    signOutUser,
    completeOnboarding,
    skipOnboardingDisplayOnly
  };
}
