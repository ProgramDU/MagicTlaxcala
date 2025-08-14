// src/Pueblo.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { db } from "./firebase"; // ajusta si tu ruta real es ./firebase/config
import { doc, getDoc, updateDoc } from "firebase/firestore";

import Tradiciones from "./tradiciones";
import Gastronomia from "./gastronomia";
import Leyendas from "./leyendas";

type Lugar = {
  nombre: string;
  descripcion: string;
  concepto: string;
  tipoComida?: string;
  imagen: string; // DataURL comprimido
};

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
  restaurantes?: Lugar[];
  hoteles?: Lugar[];
  actividades?: Lugar[];
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

  // ---------- Estado CRUD para restaurantes/hoteles/actividades ----------
  const [nuevoLugar, setNuevoLugar] = useState<Lugar>({
    nombre: "",
    descripcion: "",
    concepto: "",
    tipoComida: "",
    imagen: "",
  });
  const [editIndex, setEditIndex] = useState<number | null>(null);

  // ---------- Carga inicial del documento de pueblo (desde state o Firestore) ----------
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

  // ---------- Títulos por pestaña ----------
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

  // ---------- Utilidades restaurante/hotel/actividad ----------
  const getCampoFromTab = (
    t: typeof tab
  ): "restaurantes" | "hoteles" | "actividades" | null => {
    if (t === "restaurantes") return "restaurantes";
    if (t === "hoteles") return "hoteles";
    if (t === "actividades") return "actividades";
    return null;
  };

  // Compresión a DataURL (jpeg) en el navegador
  const handleImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const MAX_WIDTH = 800;
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return alert("No se pudo procesar la imagen.");
            // Límite ~1 MB post-compresión
            if (blob.size > 1024 * 1024) {
              return alert("La imagen es demasiado grande incluso después de comprimir.");
            }
            const compressedReader = new FileReader();
            compressedReader.onloadend = () => {
              setNuevoLugar((prev) => ({
                ...prev,
                imagen: compressedReader.result as string,
              }));
            };
            compressedReader.readAsDataURL(blob);
          },
          "image/jpeg",
          0.8
        );
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleGuardarLugar = async () => {
    if (!pueblo || !id) return;
    const campo = getCampoFromTab(tab);
    if (!campo) return;

    const listaActual = (pueblo[campo] || []) as Lugar[];
    let actualizado: Lugar[];

    if (editIndex !== null) {
      actualizado = [...listaActual];
      actualizado[editIndex] = nuevoLugar;
    } else {
      actualizado = [...listaActual, nuevoLugar];
    }

    await updateDoc(doc(db, "pueblosMagicos", id), { [campo]: actualizado });
    setPueblo({ ...pueblo, [campo]: actualizado });
    setNuevoLugar({ nombre: "", descripcion: "", concepto: "", tipoComida: "", imagen: "" });
    setEditIndex(null);
    alert(editIndex !== null ? "Lugar actualizado correctamente." : "Lugar agregado correctamente.");
  };

  const handleEditarLugar = (index: number) => {
    if (!pueblo) return;
    const campo = getCampoFromTab(tab);
    if (!campo) return;
    const lugar = (pueblo[campo] || [])[index];
    setNuevoLugar(lugar);
    setEditIndex(index);
  };

  const handleEliminarLugar = async (index: number) => {
    if (!pueblo || !id) return;
    if (!window.confirm("¿Seguro que quieres eliminar este lugar?")) return;

    const campo = getCampoFromTab(tab);
    if (!campo) return;

    const actualizado = (pueblo[campo] || []).filter((_, i) => i !== index);
    await updateDoc(doc(db, "pueblosMagicos", id), { [campo]: actualizado });
    setPueblo({ ...pueblo, [campo]: actualizado as any });
  };

  if (!pueblo) return <div style={{ padding: 20 }}>Cargando información...</div>;

  // ---------- estilos locales ----------
  const cardGrid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "15px",
    marginTop: "15px",
  };

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    padding: "10px",
    textAlign: "center",
  };

  const cardImage: React.CSSProperties = {
    width: "100%",
    height: "150px",
    objectFit: "cover",
    borderRadius: "6px",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    marginBottom: "10px",
  };

  const actionBtn: React.CSSProperties = {
    padding: "10px 16px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    color: "#fff",
    fontWeight: 700,
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#faf6f0" }}>
      {/* Sidebar */}
      <aside style={{ width: 300, background: "#fff", padding: 20, borderRight: "2px solid #ddd" }}>
        <img
          src={pueblo.imagen}
          alt={pueblo.nombre}
          style={{ width: "100%", borderRadius: 10, marginBottom: 10, objectFit: "cover" }}
        />
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
      <main style={{ flex: 1, padding: 16, overflow: "auto" }}>
        <h2 style={{ marginTop: 0, marginBottom: 14 }}>{tituloContenido}</h2>

        {/* INFO */}
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

        {/* TRADICIONES / GASTRONOMÍA / LEYENDAS */}
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

        {/* RESTAURANTES / HOTELES / ACTIVIDADES (CRUD local en el doc del pueblo) */}
        {["restaurantes", "hoteles", "actividades"].includes(tab) && (
          <section>
            <h3>{editIndex !== null ? "Editar" : "Agregar"} {tab.slice(0, -1)}</h3>

            <input
              style={inputStyle}
              placeholder="Nombre"
              value={nuevoLugar.nombre}
              onChange={(e) => setNuevoLugar({ ...nuevoLugar, nombre: e.target.value })}
            />
            <input
              style={inputStyle}
              placeholder="Concepto"
              value={nuevoLugar.concepto}
              onChange={(e) => setNuevoLugar({ ...nuevoLugar, concepto: e.target.value })}
            />
            {tab === "restaurantes" && (
              <input
                style={inputStyle}
                placeholder="Tipo de comida"
                value={nuevoLugar.tipoComida}
                onChange={(e) => setNuevoLugar({ ...nuevoLugar, tipoComida: e.target.value })}
              />
            )}
            <textarea
              style={{ ...inputStyle, minHeight: 90 }}
              placeholder="Descripción"
              value={nuevoLugar.descripcion}
              onChange={(e) => setNuevoLugar({ ...nuevoLugar, descripcion: e.target.value })}
            />
            <input type="file" accept="image/*" onChange={handleImagen} />
            {nuevoLugar.imagen && (
              <img
                src={nuevoLugar.imagen}
                alt="Preview"
                style={{ width: "160px", height: "120px", objectFit: "cover", borderRadius: 8, marginTop: 10 }}
              />
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
              <button
                onClick={handleGuardarLugar}
                style={{ ...actionBtn, background: "linear-gradient(90deg,#00b09b,#96c93d)" }}
              >
                {editIndex !== null ? "Actualizar" : "Guardar"}
              </button>
              {editIndex !== null && (
                <button
                  onClick={() => {
                    setNuevoLugar({ nombre: "", descripcion: "", concepto: "", tipoComida: "", imagen: "" });
                    setEditIndex(null);
                  }}
                  style={{ ...actionBtn, background: "#888" }}
                >
                  Cancelar
                </button>
              )}
            </div>

            {/* Listado */}
            <div style={cardGrid}>
              {(pueblo[getCampoFromTab(tab)!] as Lugar[] | undefined)?.map((item, idx) => (
                <div key={idx} style={cardStyle}>
                  {item.imagen && <img src={item.imagen} alt={item.nombre} style={cardImage} />}
                  <h4 style={{ margin: "8px 0 4px" }}>{item.nombre}</h4>
                  <p style={{ margin: 0 }}><strong>Concepto:</strong> {item.concepto}</p>
                  {tab === "restaurantes" && (
                    <p style={{ margin: 0 }}>
                      <strong>Tipo de comida:</strong> {item.tipoComida || "—"}
                    </p>
                  )}
                  <p style={{ marginTop: 6 }}>{item.descripcion}</p>

                  <div style={{ marginTop: 10 }}>
                    <button
                      style={{
                        ...actionBtn,
                        background: "#4CAF50",
                        marginRight: 6,
                      }}
                      onClick={() => handleEditarLugar(idx)}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      style={{ ...actionBtn, background: "#F44336" }}
                      onClick={() => handleEliminarLugar(idx)}
                    >
                      🗑 Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
