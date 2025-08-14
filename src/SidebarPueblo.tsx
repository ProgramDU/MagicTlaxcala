import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

type Pueblo = {
  nombre: string;
  descripcion?: string;
  restaurantes?: string[];
  hoteles?: string[];
  cosasQueHacer?: string[];
};

export default function SidebarPueblo() {
  const { id } = useParams();
  const [pueblo, setPueblo] = useState<Pueblo | null>(null);

  useEffect(() => {
    const fetchPueblo = async () => {
      if (!id) return;
      const ref = doc(db, "pueblosMagicos", id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setPueblo(snap.data() as Pueblo);
      }
    };
    fetchPueblo();
  }, [id]);

  if (!pueblo) {
    return (
      <div style={{ width: "250px", background: "#ffd966", padding: "1rem" }}>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div style={{ width: "250px", background: "#ffd966", padding: "1rem" }}>
      <h2>{pueblo.nombre}</h2>
      <p>{pueblo.descripcion}</p>

      <h3>🍽 Restaurantes</h3>
      <ul>
        {pueblo.restaurantes?.length
          ? pueblo.restaurantes.map((r, i) => <li key={i}>{r}</li>)
          : <li>No hay información</li>}
      </ul>

      <h3>🏨 Hoteles</h3>
      <ul>
        {pueblo.hoteles?.length
          ? pueblo.hoteles.map((h, i) => <li key={i}>{h}</li>)
          : <li>No hay información</li>}
      </ul>

      <h3>🎯 Cosas que hacer</h3>
      <ul>
        {pueblo.cosasQueHacer?.length
          ? pueblo.cosasQueHacer.map((c, i) => <li key={i}>{c}</li>)
          : <li>No hay información</li>}
      </ul>
    </div>
  );
}
