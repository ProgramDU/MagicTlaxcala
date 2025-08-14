import { useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "./firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

type Lugar = {
  nombre: string;
  descripcion: string;
  concepto: string;
  tipoComida?: string;
  imagen: string;
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

export default function Pueblo() {
  const { id } = useParams();
  const location = useLocation();
  const [pueblo, setPueblo] = useState<Pueblo | null>(null);
  const [tab, setTab] = useState<"info" | "restaurantes" | "hoteles" | "actividades">("info");

  // Estado para formulario
  const [nuevoLugar, setNuevoLugar] = useState<Lugar>({
    nombre: "",
    descripcion: "",
    concepto: "",
    tipoComida: "",
    imagen: "",
  });

  const [editIndex, setEditIndex] = useState<number | null>(null);

  useEffect(() => {
    if (location.state?.pueblo) {
      setPueblo(location.state.pueblo);
    } else if (id) {
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
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size <= 1024 * 1024) {
              const compressedReader = new FileReader();
              compressedReader.onloadend = () => {
                setNuevoLugar((prev) => ({ ...prev, imagen: compressedReader.result as string }));
              };
              compressedReader.readAsDataURL(blob);
            } else {
              alert("La imagen es demasiado grande incluso después de comprimir.");
            }
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
    const campo = tab === "restaurantes" ? "restaurantes" : tab === "hoteles" ? "hoteles" : "actividades";

    let actualizado;
    if (editIndex !== null) {
      actualizado = [...(pueblo[campo] || [])];
      actualizado[editIndex] = nuevoLugar;
    } else {
      actualizado = [...(pueblo[campo] || []), nuevoLugar];
    }

    await updateDoc(doc(db, "pueblosMagicos", id), {
      [campo]: actualizado,
    });
    setPueblo({ ...pueblo, [campo]: actualizado });
    setNuevoLugar({ nombre: "", descripcion: "", concepto: "", tipoComida: "", imagen: "" });
    setEditIndex(null);
    alert(editIndex !== null ? "Lugar actualizado correctamente." : "Lugar agregado correctamente.");
  };

  const handleEditarLugar = (index: number) => {
    if (!pueblo) return;
    const campo = tab === "restaurantes" ? "restaurantes" : tab === "hoteles" ? "hoteles" : "actividades";
    const lugar = (pueblo[campo] || [])[index];
    setNuevoLugar(lugar);
    setEditIndex(index);
  };

  const handleEliminarLugar = async (index: number) => {
    if (!pueblo || !id) return;
    if (!window.confirm("¿Seguro que quieres eliminar este lugar?")) return;

    const campo = tab === "restaurantes" ? "restaurantes" : tab === "hoteles" ? "hoteles" : "actividades";
    const actualizado = (pueblo[campo] || []).filter((_, i) => i !== index);

    await updateDoc(doc(db, "pueblosMagicos", id), { [campo]: actualizado });
    setPueblo({ ...pueblo, [campo]: actualizado });
  };

  if (!pueblo) return <div style={{ padding: "20px" }}>Cargando información...</div>;

  const cardGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "15px",
    marginTop: "15px",
  };

  const cardStyle = {
    background: "#fff",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    padding: "10px",
    textAlign: "center" as const,
  };

  const cardImage = {
    width: "100%",
    height: "150px",
    objectFit: "cover" as const,
    borderRadius: "6px",
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <div style={{ width: "300px", background: "#f7f7f7", padding: "20px", borderRight: "1px solid #ddd" }}>
        <img src={pueblo.imagen} alt={pueblo.nombre} style={{ width: "100%", borderRadius: "8px" }} />
        <h2>{pueblo.nombre}</h2>
        <div style={{ marginTop: "20px" }}>
          <button onClick={() => setTab("info")} style={tabButton(tab === "info")}>ℹ Información</button>
          <button onClick={() => setTab("restaurantes")} style={tabButton(tab === "restaurantes")}>🍽 Restaurantes</button>
          <button onClick={() => setTab("hoteles")} style={tabButton(tab === "hoteles")}>🏨 Hoteles</button>
          <button onClick={() => setTab("actividades")} style={tabButton(tab === "actividades")}>🎯 Cosas que hacer</button>
        </div>
      </div>

      {/* Contenido principal */}
      <div style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
        {tab === "info" && (
          <>
            <h2>📜 Información</h2>
            <p>{pueblo.descripcion || "Sin descripción disponible."}</p>
          </>
        )}

        {["restaurantes", "hoteles", "actividades"].includes(tab) && (
          <>
            {/* Formulario */}
            <h3>{editIndex !== null ? "Editar" : "Agregar"} {tab.slice(0, -1)}</h3>
            <input placeholder="Nombre" value={nuevoLugar.nombre} onChange={(e) => setNuevoLugar({ ...nuevoLugar, nombre: e.target.value })} />
            <input placeholder="Concepto" value={nuevoLugar.concepto} onChange={(e) => setNuevoLugar({ ...nuevoLugar, concepto: e.target.value })} />
            {tab === "restaurantes" && (
              <input placeholder="Tipo de comida" value={nuevoLugar.tipoComida} onChange={(e) => setNuevoLugar({ ...nuevoLugar, tipoComida: e.target.value })} />
            )}
            <textarea placeholder="Descripción" value={nuevoLugar.descripcion} onChange={(e) => setNuevoLugar({ ...nuevoLugar, descripcion: e.target.value })} />
            <input type="file" accept="image/*" onChange={handleImagen} />
            {nuevoLugar.imagen && <img src={nuevoLugar.imagen} alt="Preview" style={{ width: "100px", marginTop: "10px" }} />}
            <div style={{ marginTop: "10px" }}>
              <button onClick={handleGuardarLugar}>
                {editIndex !== null ? "Actualizar" : "Guardar"}
              </button>
              {editIndex !== null && (
                <button
                  style={{
                    marginLeft: "10px",
                    background: "#999",
                    color: "white",
                    border: "none",
                    padding: "5px 10px",
                    cursor: "pointer",
                    borderRadius: "4px"
                  }}
                  onClick={() => {
                    setNuevoLugar({ nombre: "", descripcion: "", concepto: "", tipoComida: "", imagen: "" });
                    setEditIndex(null);
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>

            {/* Listado */}
            <div style={cardGrid}>
              {(pueblo[tab] as Lugar[] | undefined)?.map((item, idx) => (
                <div key={idx} style={cardStyle}>
                  <img src={item.imagen} alt={item.nombre} style={cardImage} />
                  <h4>{item.nombre}</h4>
                  <p><strong>Concepto:</strong> {item.concepto}</p>
                  {tab === "restaurantes" && <p><strong>Tipo de comida:</strong> {item.tipoComida}</p>}
                  <p>{item.descripcion}</p>
                  <div style={{ marginTop: "10px" }}>
                    <button
                      style={{
                        marginRight: "5px",
                        background: "#4CAF50",
                        color: "white",
                        border: "none",
                        padding: "5px 10px",
                        cursor: "pointer",
                        borderRadius: "4px"
                      }}
                      onClick={() => handleEditarLugar(idx)}
                    >
                      ✏ Editar
                    </button>
                    <button
                      style={{
                        background: "#F44336",
                        color: "white",
                        border: "none",
                        padding: "5px 10px",
                        cursor: "pointer",
                        borderRadius: "4px"
                      }}
                      onClick={() => handleEliminarLugar(idx)}
                    >
                      🗑 Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function tabButton(active: boolean) {
  return {
    display: "block",
    padding: "10px",
    width: "100%",
    background: active ? "#2193b0" : "#eee",
    color: active ? "#fff" : "#000",
    border: "none",
    marginBottom: "5px",
    borderRadius: "4px",
    cursor: "pointer",
  };
}
