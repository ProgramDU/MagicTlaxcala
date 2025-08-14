import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase"; // ajusta la ruta según tu estructura
import { getAuth } from "firebase/auth";

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      setIsAdmin(false);
      return;
    }

    const checkAdmin = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setIsAdmin(data.role === "admin");
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error verificando admin:", error);
        setIsAdmin(false);
      }
    };

    checkAdmin();
  }, []);

  return isAdmin;
}
