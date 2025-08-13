import { useEffect, useState, useRef } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import type { PuebloMagico } from "./types";
import { Link } from "react-router-dom"; // ⬅️ Import aquí
import "./home.css";

export default function Home() {
  const [pueblos, setPueblos] = useState<PuebloMagico[]>([]);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const prevIds = useRef<string[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "pueblosMagicos"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PuebloMagico[];

      const newIds = data.map(p => p.id);
      const addedId = newIds.find(id => !prevIds.current.includes(id));
      if (addedId) {
        setHighlightId(addedId);
        setTimeout(() => setHighlightId(null), 2000);
      }

      prevIds.current = newIds;
      setPueblos(data);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="main-content">
      <div className="header">
        <h1>✨ Bienvenid@ a MagicTlax ✨</h1>
        <p>Explora los pueblos mágicos con historia</p>
      </div>
      <div className="cards-container">
        {pueblos.length === 0 ? (
          <p className="no-data">No hay pueblos mágicos registrados aún.</p>
        ) : (
          pueblos.map((pueblo) => (
            <div
              key={pueblo.id}
              className={`card fade-in ${highlightId === pueblo.id ? "highlight" : ""}`}
            >
              {pueblo.imagen && <img src={pueblo.imagen} alt={pueblo.nombre} />}
              <div className="card-content">
                <h3>{pueblo.nombre}</h3>
                <p>{pueblo.descripcion || "Sin descripción disponible."}</p>
              </div>

              {/* Botón Link sin romper estilos */}
              <Link to={`/pueblo/${pueblo.id}`} className="explorar-btn">
                Explorar
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
