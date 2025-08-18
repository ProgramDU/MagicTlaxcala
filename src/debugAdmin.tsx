import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export async function debugMakeMeAdmin() {
  const auth = getAuth();
  const u = auth.currentUser;
  if (!u) {
    console.warn("[DEBUG] No hay usuario logeado");
    return;
  }

  console.log("[DEBUG] uid:", u.uid, "email:", u.email);

  const ref = doc(db, "users", u.uid);
  const snap = await getDoc(ref);
  console.log("[DEBUG] users doc exists?:", snap.exists(), snap.data());

  if (!snap.exists() || snap.data()?.role !== "admin") {
    await setDoc(
      ref,
      { role: "admin", email: u.email || null, updatedAt: serverTimestamp() },
      { merge: true }
    );
    console.log("[DEBUG] users doc actualizado a role:'admin'");
  }

  const after = await getDoc(ref);
  console.log("[DEBUG] users doc after set:", after.exists(), after.data());
}
