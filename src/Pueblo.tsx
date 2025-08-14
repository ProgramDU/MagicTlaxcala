import { useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

type Pueblo = {
  id: string;
  nombre: string;
  descripcion?: string;
  codigoPostal?: string;
  fechaFundacion?: string;
  patrono?: string;
  santoPatron?: string;
  fechaFeria?: string;
  imagen: string;
  restaurantes?: string[];
  hoteles?: string[];
  actividades?: string[];
};

export default function Pueblo() {
  const { id } = useParams();
  const location = useLocation();
  const [pueblo, setPueblo] = useState<Pueblo | null>(null);
  const [tab, setTab] = useState<"info" | "restaurantes" | "hoteles" | "actividades">("info");

  useEffect(() => {
    if (location.state?.pueblo) {
      setPueblo(location.state.pueblo);
    } else if (id) {
      // Si entró por URL directa, consulta Firestore
      const fetchPueblo = async () => {
        const ref = doc(db, "pueblosMagicos", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setPueblo({ id: snap.id, ...snap.data() } as Pueblo);
        }
      };
      fetchPueblo();
    }
  }, [id, location.state]);

  if (!pueblo) {
    return <div style={{ padding: "20px" }}>Cargando información...</div>;
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <div style={{ width: "300px", background: "#f7f7f7", padding: "20px", borderRight: "1px solid #ddd" }}>
        <img src={pueblo.imagen} alt={pueblo.nombre} style={{ width: "100%", borderRadius: "8px" }} />
        <h2>{pueblo.nombre}</h2>
        <div style={{ marginTop: "20px" }}>
          <button
            onClick={() => setTab("info")}
            style={{ display: "block", padding: "10px", width: "100%", background: tab === "info" ? "#2193b0" : "#eee", color: tab === "info" ? "#fff" : "#000", border: "none", marginBottom: "5px", borderRadius: "4px", cursor: "pointer" }}
          >
            ℹ Información
          </button>
          <button
            onClick={() => setTab("restaurantes")}
            style={{ display: "block", padding: "10px", width: "100%", background: tab === "restaurantes" ? "#2193b0" : "#eee", color: tab === "restaurantes" ? "#fff" : "#000", border: "none", marginBottom: "5px", borderRadius: "4px", cursor: "pointer" }}
          >
            🍽 Restaurantes
          </button>
          <button
            onClick={() => setTab("hoteles")}
            style={{ display: "block", padding: "10px", width: "100%", background: tab === "hoteles" ? "#2193b0" : "#eee", color: tab === "hoteles" ? "#fff" : "#000", border: "none", marginBottom: "5px", borderRadius: "4px", cursor: "pointer" }}
          >
            🏨 Hoteles
          </button>
          <button
            onClick={() => setTab("actividades")}
            style={{ display: "block", padding: "10px", width: "100%", background: tab === "actividades" ? "#2193b0" : "#eee", color: tab === "actividades" ? "#fff" : "#000", border: "none", marginBottom: "5px", borderRadius: "4px", cursor: "pointer" }}
          >
            🎯 Cosas que hacer
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div style={{ flex: 1, padding: "20px" }}>
        {tab === "info" && (
          <div>
            <h2>📜 Información</h2>
            <p>{pueblo.descripcion || "Sin descripción disponible."}</p>
            <p><strong>Código Postal:</strong> {pueblo.codigoPostal || "No disponible"}</p>
            <p><strong>Fecha de Fundación:</strong> {pueblo.fechaFundacion || "No disponible"}</p>
            <p><strong>Patrono:</strong> {pueblo.patrono || "No disponible"}</p>
            <p><strong>Santo Patrón:</strong> {pueblo.santoPatron || "No disponible"}</p>
            <p><strong>Fecha de Feria:</strong> {pueblo.fechaFeria || "No disponible"}</p>
          </div>
        )}

        {tab === "restaurantes" && (
          <div>
            <h2>🍽 Restaurantes</h2>
            {pueblo.restaurantes?.length ? (
              <ul>
                {pueblo.restaurantes.map((rest, idx) => (
                  <li key={idx}>{rest}</li>
                ))}
              </ul>
            ) : (
              <p>No hay restaurantes registrados.</p>
            )}
          </div>
        )}

        {tab === "hoteles" && (
          <div>
            <h2>🏨 Hoteles</h2>
            {pueblo.hoteles?.length ? (
              <ul>
                {pueblo.hoteles.map((hotel, idx) => (
                  <li key={idx}>{hotel}</li>
                ))}
              </ul>
            ) : (
              <p>No hay hoteles registrados.</p>
            )}
          </div>
        )}

        {tab === "actividades" && (
          <div>
            <h2>🎯 Cosas que hacer</h2>
            {pueblo.actividades?.length ? (
              <ul>
                {pueblo.actividades.map((act, idx) => (
                  <li key={idx}>{act}</li>
                ))}
              </ul>
            ) : (
              <p>No hay actividades registradas.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
