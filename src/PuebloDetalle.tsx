// PuebloDetalle.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "./firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function PuebloDetalle() {
  const { id } = useParams(); // ID del pueblo
  const [pueblo, setPueblo] = useState<any>(null);
  const [categoria, setCategoria] = useState("informacion");
  const [showForm, setShowForm] = useState(false);
  const [nuevoLugar, setNuevoLugar] = useState({
    nombre: "",
    descripcion: "",
    concepto: "",
    tipo: "",
    imagenBase64: ""
  });

  const isAdmin = localStorage.getItem("isAdmin") === "true";

  // Cargar datos del pueblo
  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(db, "pueblosMagicos", id!);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPueblo(docSnap.data());
      }
    };
    fetchData();
  }, [id]);

  // Manejar imagen comprimida
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const MAX_WIDTH = 800;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        const compressed = canvas.toDataURL("image/jpeg", 0.7);
        const byteLength = Math.ceil((compressed.length * 3) / 4);
        if (byteLength > 1048576) {
          alert("La imagen es muy grande, intenta con otra más pequeña.");
          return;
        }
        setNuevoLugar({ ...nuevoLugar, imagenBase64: compressed });
      };
    };
    reader.readAsDataURL(file);
  };

  // Guardar en Firestore
  const handleGuardar = async () => {
    if (!nuevoLugar.nombre || !nuevoLugar.descripcion) {
      alert("Completa todos los campos");
      return;
    }

    const docRef = doc(db, "pueblosMagicos", id!);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const key =
        categoria === "restaurantes"
          ? "restaurantes"
          : categoria === "hoteles"
          ? "hoteles"
          : "cosasQueHacer";

      const updated = [...(data[key] || []), nuevoLugar];
      await updateDoc(docRef, { [key]: updated });

      setPueblo({ ...data, [key]: updated });
      setShowForm(false);
      setNuevoLugar({
        nombre: "",
        descripcion: "",
        concepto: "",
        tipo: "",
        imagenBase64: ""
      });
    }
  };

  if (!pueblo) return <p>Cargando...</p>;

  const renderContenido = () => {
    const key =
      categoria === "restaurantes"
        ? "restaurantes"
        : categoria === "hoteles"
        ? "hoteles"
        : categoria === "cosasQueHacer"
        ? "cosasQueHacer"
        : null;

    if (!key) return <p>{pueblo.descripcion || "Sin descripción"}</p>;

    const lugares = pueblo[key] || [];
    return (
      <div>
        {lugares.length === 0 && <p>No hay elementos registrados.</p>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
          {lugares.map((lugar: any, i: number) => (
            <div key={i} style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "10px", width: "250px" }}>
              {lugar.imagenBase64 && <img src={lugar.imagenBase64} alt={lugar.nombre} style={{ width: "100%", borderRadius: "6px" }} />}
              <h4>{lugar.nombre}</h4>
              <p>{lugar.descripcion}</p>
              <small>{lugar.concepto} - {lugar.tipo}</small>
            </div>
          ))}
        </div>

        {isAdmin && (
          <>
            <button
              style={{ marginTop: "20px", padding: "10px", background: "#007bff", color: "#fff", border: "none", borderRadius: "5px" }}
              onClick={() => setShowForm(true)}
            >
              ➕ Añadir lugar
            </button>

            {showForm && (
              <div style={{ background: "#fff", padding: "20px", marginTop: "20px", borderRadius: "8px" }}>
                <h3>Nuevo lugar</h3>
                <input
                  type="text"
                  placeholder="Nombre"
                  value={nuevoLugar.nombre}
                  onChange={(e) => setNuevoLugar({ ...nuevoLugar, nombre: e.target.value })}
                />
                <textarea
                  placeholder="Descripción"
                  value={nuevoLugar.descripcion}
                  onChange={(e) => setNuevoLugar({ ...nuevoLugar, descripcion: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Concepto"
                  value={nuevoLugar.concepto}
                  onChange={(e) => setNuevoLugar({ ...nuevoLugar, concepto: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Tipo"
                  value={nuevoLugar.tipo}
                  onChange={(e) => setNuevoLugar({ ...nuevoLugar, tipo: e.target.value })}
                />
                <input type="file" accept="image/*" onChange={handleImageChange} />

                {nuevoLugar.imagenBase64 && (
                  <img src={nuevoLugar.imagenBase64} alt="Vista previa" style={{ maxWidth: "100%", marginTop: "10px" }} />
                )}

                <div style={{ marginTop: "10px" }}>
                  <button onClick={handleGuardar}>Guardar</button>
                  <button onClick={() => setShowForm(false)} style={{ marginLeft: "10px" }}>Cancelar</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", gap: "20px" }}>
      {/* Sidebar */}
      <div style={{ width: "200px" }}>
        <h3>{pueblo.nombre}</h3>
        <button onClick={() => setCategoria("informacion")}>ℹ Información</button>
        <button onClick={() => setCategoria("restaurantes")}>🍽 Restaurantes</button>
        <button onClick={() => setCategoria("hoteles")}>🏨 Hoteles</button>
        <button onClick={() => setCategoria("cosasQueHacer")}>🎯 Cosas que hacer</button>
      </div>

      {/* Contenido */}
      <div style={{ flex: 1 }}>
        {renderContenido()}
      </div>
    </div>
  );
}
