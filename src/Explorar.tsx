// src/Explorar.tsx
import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "./firebase";
import type { PuebloMagico } from "./types";

export default function Explorar() {
  const [pueblos, setPueblos] = useState<PuebloMagico[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "pueblosMagicos"), orderBy("nombre"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as PuebloMagico[];
      setPueblos(data);
      setCargando(false);
    });
    return () => unsub();
  }, []);

  return (
    <div className="main-content">
      <div className="header">
        <h1>Pueblos mágicos</h1>
        <p>Explora el catálogo registrado por el administrador</p>
      </div>

      {cargando ? (
        <p>Cargando....</p>
      ) : pueblos.length === 0 ? (
        <p>No hay pueblos registrados aún.</p>
      ) : (
        <div className="cards-container">
          {pueblos.map((pueblo) => (
            <div key={pueblo.id} className="card">
              {pueblo.imagen && <img src={pueblo.imagen} alt={pueblo.nombre} />}
              <div className="card-content">
                <h3>{pueblo.nombre}</h3>
                {pueblo.descripcion && <p>{pueblo.descripcion}</p>}
                {pueblo.codigoPostal && <p><strong>CP:</strong> {pueblo.codigoPostal}</p>}
                {pueblo.fechaFundacion && <p><strong>Fundación:</strong> {pueblo.fechaFundacion}</p>}
                {pueblo.patrono && <p><strong>Patrono:</strong> {pueblo.patrono}</p>}
                {pueblo.santoPatron && <p><strong>Santo Patrón:</strong> {pueblo.santoPatron}</p>}
                {pueblo.fechaFeria && <p><strong>Feria:</strong> {pueblo.fechaFeria}</p>}
              </div>
              <button>Explorar</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
