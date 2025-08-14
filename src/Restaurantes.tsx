import { useState, useEffect } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export default function Restaurantes() {
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  const [restaurantes, setRestaurantes] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState("");
  const [tipoComida, setTipoComida] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagenBase64, setImagenBase64] = useState("");

  const fetchData = async () => {
    const snapshot = await getDocs(collection(db, "restaurantes"));
    setRestaurantes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
    if (!nombre || !tipoComida || !descripcion || !imagenBase64) {
      alert("Completa todos los campos");
      return;
    }
    await addDoc(collection(db, "restaurantes"), {
      nombre, tipoComida, descripcion, imagen: imagenBase64
    });
    alert("Restaurante agregado ✅");
    setNombre(""); setTipoComida(""); setDescripcion(""); setImagenBase64("");
    setShowForm(false);
    fetchData();
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Restaurantes</h2>
      {isAdmin && <button onClick={() => setShowForm(!showForm)}>{showForm ? "Cancelar" : "Añadir lugar"}</button>}
      {showForm && (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" />
          <input value={tipoComida} onChange={(e) => setTipoComida(e.target.value)} placeholder="Tipo de comida" />
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción" />
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {imagenBase64 && <img src={imagenBase64} alt="Vista previa" style={{ maxWidth: "200px" }} />}
          <button type="submit">Guardar</button>
        </form>
      )}
      <div style={{ marginTop: "20px" }}>
        {restaurantes.map((r) => (
          <div key={r.id} style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px" }}>
            <h3>{r.nombre}</h3>
            <p><b>Tipo:</b> {r.tipoComida}</p>
            <p>{r.descripcion}</p>
            {r.imagen && <img src={r.imagen} alt={r.nombre} style={{ maxWidth: "200px" }} />}
          </div>
        ))}
      </div>
    </div>
  );
}
