// src/hooks/useIsAdmin.ts
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export function useIsAdmin() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const auth = getAuth();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (!u) {
        console.log("[ADMIN] sin usuario");
        setIsAdmin(false);
        return;
      }

      console.log("[ADMIN] uid:", u.uid, "email:", u.email);

      try {
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);

        console.log("[ADMIN] users doc exists?", snap.exists());

        if (snap.exists()) {
          console.log("[ADMIN] users data:", snap.data());
          setIsAdmin(snap.data()?.role === "admin");
        } else {
          setIsAdmin(false);
        }
      } catch (e) {
        console.error("[ADMIN] error leyendo users:", e);
        setIsAdmin(false);
      }
    });

    return () => unsub();
  }, []);

  return { user, isAdmin, auth };
}
