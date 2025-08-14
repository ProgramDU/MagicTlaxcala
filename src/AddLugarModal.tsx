// AddLugarModal.tsx
import { useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

interface Props {
  categoria: "restaurantes" | "hoteles" | "actividades";
  puebloId: string;
  onLugarAgregado?: () => void;
}

export default function AddLugarModal({ categoria, puebloId, onLugarAgregado }: Props) {
  const [show, setShow] = useState(false);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState("");
  const [imagenBase64, setImagenBase64] = useState("");
  const [loading, setLoading] = useState(false);

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
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL("image/jpeg", 0.7);
        const sizeInBytes = Math.ceil((compressed.length * 3) / 4);
        if (sizeInBytes > 1048576) {
          alert("La imagen sigue siendo muy grande, elige otra más pequeña.");
          return;
        }
        setImagenBase64(compressed);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !descripcion || !tipo || !imagenBase64) {
      alert("Completa todos los campos");
      return;
    }

    setLoading(true);
    try {
      const ref = doc(db, "pueblosMagicos", puebloId);
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error("Pueblo no encontrado");

      const data = snap.data();
      const nuevoLugar = { nombre, descripcion, tipo, imagen: imagenBase64 };
      const listaActual = data[categoria] || [];
      await updateDoc(ref, { [categoria]: [...listaActual, nuevoLugar] });

      alert("Lugar agregado con éxito ✅");
      setShow(false);
      setNombre("");
      setDescripcion("");
      setTipo("");
      setImagenBase64("");
      onLugarAgregado?.();
    } catch (err) {
      console.error(err);
      alert("Error agregando lugar");
    }
    setLoading(false);
  };

  return (
    <>
      <button onClick={() => setShow(true)} style={{ background: "#4cafef", padding: "8px 12px", color: "#fff", border: "none", borderRadius: "5px" }}>
        ➕ Añadir lugar
      </button>

      {show && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ background: "#fff", padding: "20px", borderRadius: "8px", maxWidth: "400px", width: "100%" }}>
            <h3>Agregar {categoria}</h3>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <input type="text" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
              <textarea placeholder="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
              <input type="text" placeholder="Tipo (ej. comida tradicional, hotel boutique...)" value={tipo} onChange={(e) => setTipo(e.target.value)} />
              <input type="file" accept="image/*" onChange={handleImageChange} />
              {imagenBase64 && <img src={imagenBase64} alt="vista previa" style={{ maxWidth: "100%" }} />}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
                <button type="button" onClick={() => setShow(false)}>Cancelar</button>
                <button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
