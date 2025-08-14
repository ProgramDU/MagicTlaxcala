import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebase";

export default function Admin() {
  const [nombre, setNombre] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [fechaFundacion, setFechaFundacion] = useState("");
  const [patrono, setPatrono] = useState("");
  const [santoPatron, setSantoPatron] = useState("");
  const [fechaFeria, setFechaFeria] = useState("");
  const [imagenBase64, setImagenBase64] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
          const byteLength = Math.ceil((compressedBase64.length * 3) / 4);
          if (byteLength > 1048487) {
            alert("La imagen sigue siendo muy grande. Intenta con otra más pequeña.");
            return;
          }
          setImagenBase64(compressedBase64);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !codigoPostal || !imagenBase64) {
      alert("Por favor completa todos los campos y selecciona una imagen.");
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "pueblosMagicos"), {
        nombre,
        codigoPostal,
        fechaFundacion,
        patrono,
        santoPatron,
        fechaFeria,
        imagen: imagenBase64,
        restaurantes: [], // ← inicializamos listas vacías
        hoteles: [],
        actividades: []
      });
      alert("Pueblo mágico guardado con éxito ✅");
      setNombre("");
      setCodigoPostal("");
      setFechaFundacion("");
      setPatrono("");
      setSantoPatron("");
      setFechaFeria("");
      setImagenBase64("");
    } catch (error) {
      console.error("Error guardando en Firestore:", error);
      alert("Error: " + (error as Error).message);
    }
    setLoading(false);
  };

  return (
    <div className="admin-container" style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h2>Panel de Administración</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input type="text" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <input type="text" placeholder="Código Postal" value={codigoPostal} onChange={(e) => setCodigoPostal(e.target.value)} />
        <input type="date" value={fechaFundacion} onChange={(e) => setFechaFundacion(e.target.value)} />
        <input type="text" placeholder="Patrono" value={patrono} onChange={(e) => setPatrono(e.target.value)} />
        <input type="text" placeholder="Santo Patrón" value={santoPatron} onChange={(e) => setSantoPatron(e.target.value)} />
        <input type="date" value={fechaFeria} onChange={(e) => setFechaFeria(e.target.value)} />
        <label>Imagen:</label>
        <input type="file" accept="image/*" onChange={handleImageChange} />
        {imagenBase64 && <img src={imagenBase64} alt="Vista previa" style={{ maxWidth: "100%", marginTop: "10px" }} />}
        <button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar Pueblo Mágico"}
        </button>
      </form>
    </div>
  );
}
