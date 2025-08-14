// src/Explorar.tsx
import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "./firebase";
import type { PuebloMagico } from "./types";
import AddLugarModal from "./AddLugarModal";

export default function Explorar() {
  const [pueblos, setPueblos] = useState<PuebloMagico[]>([]);
  const [cargando, setCargando] = useState(true);
  const [puebloSeleccionado, setPuebloSeleccionado] = useState<PuebloMagico | null>(null);

  const isAdmin = true; // 🔹 Aquí pon tu validación real para admin

  useEffect(() => {
    const q = query(collection(db, "pueblosMagicos"), orderBy("nombre"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as PuebloMagico[];
      setPueblos(data);
      setCargando(false);
    });
    return () => unsub();
  }, []);

  // 🔹 Vista de lista de pueblos
  if (!puebloSeleccionado) {
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
                </div>
                <button onClick={() => setPuebloSeleccionado(pueblo)}>Explorar</button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 🔹 Vista de detalles del pueblo
  return (
    <div className="main-content">
      <button onClick={() => setPuebloSeleccionado(null)}>⬅ Volver</button>
      <h1>{puebloSeleccionado.nombre}</h1>
      <img src={puebloSeleccionado.imagen} alt={puebloSeleccionado.nombre} style={{ maxWidth: "400px" }} />

      <div style={{ marginTop: "20px" }}>
        <Categoria
          titulo="Restaurantes"
          categoria="restaurantes"
          lugares={puebloSeleccionado.restaurantes || []}
          puebloId={puebloSeleccionado.id}
          isAdmin={isAdmin}
        />
        <Categoria
          titulo="Hoteles"
          categoria="hoteles"
          lugares={puebloSeleccionado.hoteles || []}
          puebloId={puebloSeleccionado.id}
          isAdmin={isAdmin}
        />
        <Categoria
          titulo="Cosas por hacer"
          categoria="actividades"
          lugares={puebloSeleccionado.actividades || []}
          puebloId={puebloSeleccionado.id}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}

// 🔹 Componente para cada categoría
function Categoria({ titulo, categoria, lugares, puebloId, isAdmin }: any) {
  return (
    <div style={{ marginBottom: "30px" }}>
      <h2>{titulo}</h2>
      {isAdmin && <AddLugarModal categoria={categoria} puebloId={puebloId} />}
      {lugares.length === 0 ? (
        <p>No hay lugares registrados.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {lugares.map((lugar: any, i: number) => (
            <li key={i} style={{ border: "1px solid #ccc", margin: "8px 0", padding: "8px" }}>
              <h4>{lugar.nombre}</h4>
              <p>{lugar.descripcion}</p>
              <small>{lugar.tipo}</small>
              {lugar.imagen && (
                <img src={lugar.imagen} alt={lugar.nombre} style={{ maxWidth: "150px", display: "block", marginTop: "5px" }} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
