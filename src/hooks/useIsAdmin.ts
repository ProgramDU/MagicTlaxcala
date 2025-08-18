// src/hooks/useIsAdmin.ts
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

type AdminState = {
  isAdmin: boolean | null; // null = cargando; true/false = resuelto
  user: User | null;
};


export function useIsAdmin(): AdminState {
  const [state, setState] = useState<AdminState>({ isAdmin: null, user: null });

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setState({ isAdmin: false, user: null });
        return;
      }
      try {
        // Reglas: users/{uid}.role === "admin"
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);
        const role = snap.exists() ? (snap.data() as any).role : undefined;
        setState({ isAdmin: role === "admin", user: u });
      } catch {
        setState({ isAdmin: false, user: u });
      }
    });
    return () => unsub();
  }, []);

  return state;
}

