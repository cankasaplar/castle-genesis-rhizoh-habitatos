import { useEffect, useState, useCallback } from "react";
import { getFirestore, collection, doc, onSnapshot, setDoc, serverTimestamp, arrayUnion } from "firebase/firestore";
import { getFirebaseApp, firebaseConfigured } from "./castleFirebase.js";

const STALE_MS = 120_000;
const HEARTBEAT_MS = 22_000;

/**
 * Çevrimiçi kaleler: `active_castles/{uid}` belgeleri (lat, lon, nexusEnergy, updatedAt).
 * Yerel kaleniz ACTIVE + geo varsa periyodik heartbeat yazar.
 */
export function useCastleActiveCastles(firebaseUserUid) {
  const [remoteCastles, setRemoteCastles] = useState([]);
  const uid = String(firebaseUserUid || "");

  useEffect(() => {
    if (!firebaseConfigured || !uid || !getFirebaseApp()) {
      setRemoteCastles([]);
      return undefined;
    }
    const db = getFirestore(getFirebaseApp());
    const col = collection(db, "active_castles");
    return onSnapshot(
      col,
      (snap) => {
        const now = Date.now();
        const rows = [];
        snap.forEach((d) => {
          if (d.id === uid) return;
          const v = d.data() || {};
          const t = v.updatedAt?.toMillis?.() ?? 0;
          if (!t || now - t > STALE_MS) return;
          rows.push({
            id: d.id,
            lat: v.lat,
            lon: v.lon,
            nexusEnergy: v.nexusEnergy,
            displayName: v.displayName || "",
            bridgePeers: Array.isArray(v.bridgePeers) ? v.bridgePeers : []
          });
        });
        setRemoteCastles(rows);
      },
      () => setRemoteCastles([])
    );
  }, [uid]);

  useEffect(() => {
    if (!firebaseConfigured || !uid || !getFirebaseApp()) return undefined;
    const db = getFirestore(getFirebaseApp());
    const ref = doc(db, "active_castles", uid);
    const pulse = () => {
      try {
        if (typeof window === "undefined") return;
        if (window.__CASTLE_CLIENT_CASTLE_STATE__ !== "ACTIVE") return;
        const geo = window.__CASTLE_NEXUS_GEO__;
        if (!geo || !Number.isFinite(geo.lat) || !Number.isFinite(geo.lon)) return;
        void setDoc(
          ref,
          {
            lat: geo.lat,
            lon: geo.lon,
            nexusEnergy: Math.min(0.98, 0.55 + Math.sin(Date.now() / 9000) * 0.22),
            updatedAt: serverTimestamp()
          },
          { merge: true }
        );
      } catch {
        /* noop */
      }
    };
    pulse();
    const id = window.setInterval(pulse, HEARTBEAT_MS);
    return () => window.clearInterval(id);
  }, [uid]);

  const recordBridgePeer = useCallback(
    async (peerUid) => {
      const p = String(peerUid || "").trim();
      if (!firebaseConfigured || !uid || !p || p === uid || !getFirebaseApp()) return false;
      try {
        const db = getFirestore(getFirebaseApp());
        const ref = doc(db, "active_castles", uid);
        await setDoc(
          ref,
          {
            bridgePeers: arrayUnion(p),
            lastBridgeAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          },
          { merge: true }
        );
        return true;
      } catch {
        return false;
      }
    },
    [uid]
  );

  return { remoteCastles, recordBridgePeer, registryReady: firebaseConfigured && !!uid };
}
