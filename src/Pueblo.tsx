// src/Pueblo.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

import Tradiciones from "./tradiciones";
import Gastronomia from "./gastronomia";
import Leyendas from "./leyendas";
import Restaurantes from "./Restaurantes";
import Hoteles from "./Hoteles";
import Actividades from "./Actividades";

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

const btnStyle = (active: boolean): React.CSSProperties => ({
  display: "block",
  padding: "12px",
  width: "100%",
  background: active ? "linear-gradient(90deg, #ff8c00, #ff0080)" : "#eee",
  color: active ? "#fff" : "#000",
  border: "none",
  marginBottom: "6px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 700,
});

export default function Pueblo() {
  const { id } = useParams();
  const location = useLocation();
  const [pueblo, setPueblo] = useState<Pueblo | null>(null);

  const [tab, setTab] = useState<
    "info" | "gastronomia" | "tradiciones" | "leyendas" | "restaurantes" | "hoteles" | "actividades"
  >("info");

  // Carga inicial del documento (state del Home o Firestore)
  useEffect(() => {
    const fromState = location.state as { pueblo?: Pueblo } | undefined;
    if (fromState?.pueblo) {
      setPueblo(fromState.pueblo);
      return;
    }
    if (id) {
      (async () => {
        const ref = doc(db, "pueblosMagicos", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setPueblo({ id: snap.id, ...(snap.data() as Omit<Pueblo, "id">) });
        }
      })();
    }
  }, [id, location.state]);

  const tituloContenido = useMemo(() => {
    switch (tab) {
      case "info":
        return "📜 Información";
      case "gastronomia":
        return "🍲 Gastronomía";
      case "tradiciones":
        return "🎉 Tradiciones";
      case "leyendas":
        return "📖 Leyendas";
      case "restaurantes":
        return "🍽 Restaurantes";
      case "hoteles":
        return "🏨 Hoteles";
      case "actividades":
        return "🎯 Actividades";
      default:
        return "";
    }
  }, [tab]);

  if (!pueblo) return <div style={{ padding: 20 }}>Cargando información...</div>;

  // estilos locales
  const mainWrap: React.CSSProperties = { display: "flex", height: "100vh", background: "#faf6f0" };
  const asideCss: React.CSSProperties = { width: 300, background: "#fff", padding: 20, borderRight: "2px solid #ddd" };
  const heroImg: React.CSSProperties = { width: "100%", borderRadius: 10, marginBottom: 10, objectFit: "cover" };
  const mainCss: React.CSSProperties = { flex: 1, padding: 16, overflow: "auto" };

  return (
    <div style={mainWrap}>
      {/* Sidebar */}
      <aside style={asideCss}>
        <img src={pueblo.imagen} alt={pueblo.nombre} style={heroImg} />
        <h2 style={{ color: "#ff0080", textAlign: "center", margin: "8px 0 16px" }}>{pueblo.nombre}</h2>

        <nav style={{ marginTop: 10 }}>
          <button onClick={() => setTab("info")} style={btnStyle(tab === "info")}>
            ℹ Información
          </button>
          <button onClick={() => setTab("gastronomia")} style={btnStyle(tab === "gastronomia")}>
            🍲 Gastronomía
          </button>
          <button onClick={() => setTab("tradiciones")} style={btnStyle(tab === "tradiciones")}>
            🎉 Tradiciones
          </button>
          <button onClick={() => setTab("leyendas")} style={btnStyle(tab === "leyendas")}>
            📖 Leyendas
          </button>
          <button onClick={() => setTab("restaurantes")} style={btnStyle(tab === "restaurantes")}>
            🍽 Restaurantes
          </button>
          <button onClick={() => setTab("hoteles")} style={btnStyle(tab === "hoteles")}>
            🏨 Hoteles
          </button>
          <button onClick={() => setTab("actividades")} style={btnStyle(tab === "actividades")}>
            🎯 Actividades
          </button>
        </nav>
      </aside>

      {/* Contenido principal */}
      <main style={mainCss}>
        <h2 style={{ marginTop: 0, marginBottom: 14 }}>{tituloContenido}</h2>

        {/* INFO (solo lectura aquí) */}
        {tab === "info" && (
          <section>
            <p>{pueblo.descripcion || "Sin descripción disponible."}</p>
            <p>
              <strong>Código Postal:</strong> {pueblo.codigoPostal || "No disponible"}
            </p>
            <p>
              <strong>Fecha de Fundación:</strong> {pueblo.fechaFundacion || "No disponible"}
            </p>
            <p>
              <strong>Patrono:</strong> {pueblo.patrono || "No disponible"}
            </p>
            <p>
              <strong>Santo Patrón:</strong> {pueblo.santoPatron || "No disponible"}
            </p>
            <p>
              <strong>Fecha de Feria:</strong> {pueblo.fechaFeria || "No disponible"}
            </p>
          </section>
        )}

        {/* Subcolecciones administradas en sus componentes */}
        {tab === "tradiciones" && (
          <section>
            <Tradiciones puebloId={pueblo.id} />
          </section>
        )}

        {tab === "gastronomia" && (
          <section>
            <Gastronomia puebloId={pueblo.id} />
          </section>
        )}

        {tab === "leyendas" && (
          <section>
            <Leyendas puebloId={pueblo.id} />
          </section>
        )}

        {tab === "restaurantes" && (
          <section>
            <Restaurantes puebloId={pueblo.id} />
          </section>
        )}

        {tab === "hoteles" && (
          <section>
            <Hoteles puebloId={pueblo.id} />
          </section>
        )}

        {tab === "actividades" && (
          <section>
            <Actividades puebloId={pueblo.id} />
          </section>
        )}
      </main>
    </div>
  );
}
