import { useState, useEffect } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export default function Hoteles() {
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  const [hoteles, setHoteles] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagenBase64, setImagenBase64] = useState("");

  const fetchData = async () => {
    const snapshot = await getDocs(collection(db, "hoteles"));
    setHoteles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => { fetchData(); }, []);

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
        if (Math.ceil((compressed.length * 3) / 4) > 1048576) {
          alert("Imagen demasiado grande.");
          return;
        }
        setImagenBase64(compressed);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !categoria || !descripcion || !imagenBase64) {
      alert("Completa todos los campos");
      return;
    }
    await addDoc(collection(db, "hoteles"), {
      nombre, categoria, descripcion, imagen: imagenBase64
    });
    alert("Hotel agregado ✅");
    setNombre(""); setCategoria(""); setDescripcion(""); setImagenBase64("");
    setShowForm(false);
    fetchData();
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Hoteles</h2>
      {isAdmin && <button onClick={() => setShowForm(!showForm)}>{showForm ? "Cancelar" : "Añadir lugar"}</button>}
      {showForm && (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" />
          <input value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Categoría" />
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción" />
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {imagenBase64 && <img src={imagenBase64} alt="Vista previa" style={{ maxWidth: "200px" }} />}
          <button type="submit">Guardar</button>
        </form>
      )}
      <div style={{ marginTop: "20px" }}>
        {hoteles.map((h) => (
          <div key={h.id} style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px" }}>
            <h3>{h.nombre}</h3>
            <p><b>Categoría:</b> {h.categoria}</p>
            <p>{h.descripcion}</p>
            {h.imagen && <img src={h.imagen} alt={h.nombre} style={{ maxWidth: "200px" }} />}
          </div>
        ))}
      </div>
    </div>
  );
}
