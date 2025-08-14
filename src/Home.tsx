import { useEffect, useState } from "react";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "./firebase";
import { useNavigate } from "react-router-dom";

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
};

export default function Home() {
  const [pueblos, setPueblos] = useState<Pueblo[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "pueblosMagicos"), (snapshot) => {
      const data: Pueblo[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Pueblo[];
      setPueblos(data);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Seguro que quieres eliminar este pueblo mágico?")) {
      await deleteDoc(doc(db, "pueblosMagicos", id));
    }
  };

  return (
    <div className="main-content">
      <div className="header">
        <h1>✨ Bienvenid@ a MagicTlax ✨</h1>
        <p>Explora los pueblos mágicos con historia</p>
      </div>

      <div className="cards-container">
        {pueblos.map((pueblo) => (
          <div key={pueblo.id} className="card">
            <img src={pueblo.imagen} alt={pueblo.nombre} />
            <div className="card-content">
              <h3>{pueblo.nombre}</h3>
              <p>{pueblo.descripcion || "Sin descripción disponible."}</p>
            </div>

            {/* Botones Editar y Eliminar */}
            <div style={{ display: "flex", gap: "8px", padding: "10px" }}>
              <button
                onClick={() => navigate(`/admin?id=${pueblo.id}`)}
                style={{
                  flex: 1,
                  padding: "8px",
                  background: "linear-gradient(45deg, #00b09b, #96c93d)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  transition: "transform 0.2s ease, opacity 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.opacity = "0.9";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.opacity = "1";
                }}
              >
                ✏️ Editar
              </button>

              <button
                onClick={() => handleDelete(pueblo.id)}
                style={{
                  flex: 1,
                  padding: "8px",
                  background: "linear-gradient(45deg, #ff512f, #dd2476)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  transition: "transform 0.2s ease, opacity 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.opacity = "0.9";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.opacity = "1";
                }}
              >
                🗑 Eliminar
              </button>
            </div>

            {/* Botón Explorar que manda datos a Pueblo.tsx */}
            <button
              onClick={() =>
                navigate(`/pueblo/${pueblo.id}`, { state: { pueblo } })
              }
              style={{
                margin: "10px",
                padding: "8px",
                background: "linear-gradient(45deg, #2193b0, #6dd5ed)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: "bold",
                transition: "transform 0.2s ease, opacity 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.opacity = "1";
              }}
            >
              🌎 Explorar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
