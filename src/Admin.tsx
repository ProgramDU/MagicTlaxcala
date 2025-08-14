import { useEffect, useState } from "react";
import { addDoc, collection, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useLocation } from "react-router-dom";

export default function Admin() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const editingId = searchParams.get("id");

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [fechaFundacion, setFechaFundacion] = useState("");
  const [patrono, setPatrono] = useState("");
  const [santoPatron, setSantoPatron] = useState("");
  const [fechaFeria, setFechaFeria] = useState("");
  const [imagenBase64, setImagenBase64] = useState("");
  const [loading, setLoading] = useState(false);

  const [restaurantes, setRestaurantes] = useState<string[]>([]);
  const [hoteles, setHoteles] = useState<string[]>([]);
  const [actividades, setActividades] = useState<string[]>([]);

  const [tempRest, setTempRest] = useState("");
  const [tempHotel, setTempHotel] = useState("");
  const [tempAct, setTempAct] = useState("");

  // Cargar datos si estamos editando
  useEffect(() => {
    if (editingId) {
      const fetchData = async () => {
        const refDoc = doc(db, "pueblosMagicos", editingId);
        const snap = await getDoc(refDoc);
        if (snap.exists()) {
          const data = snap.data();
          setNombre(data.nombre || "");
          setDescripcion(data.descripcion || "");
          setCodigoPostal(data.codigoPostal || "");
          setFechaFundacion(data.fechaFundacion || "");
          setPatrono(data.patrono || "");
          setSantoPatron(data.santoPatron || "");
          setFechaFeria(data.fechaFeria || "");
          setImagenBase64(data.imagen || "");
          setRestaurantes(data.restaurantes || []);
          setHoteles(data.hoteles || []);
          setActividades(data.actividades || []);
        }
      };
      fetchData();
    }
  }, [editingId]);

  // Procesa y comprime la imagen
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

          if (byteLength > 1048576) {
            alert("⚠️ La imagen sigue siendo mayor a 1MB. Intenta con otra más pequeña.");
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

    if (!nombre || !imagenBase64) {
      alert("Por favor completa el nombre y selecciona una imagen.");
      return;
    }

    const puebloData = {
      nombre,
      descripcion,
      codigoPostal,
      fechaFundacion,
      patrono,
      santoPatron,
      fechaFeria,
      imagen: imagenBase64,
      restaurantes,
      hoteles,
      actividades,
    };

    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "pueblosMagicos", editingId), puebloData);
        alert("✅ Pueblo mágico actualizado");
      } else {
        await addDoc(collection(db, "pueblosMagicos"), puebloData);
        alert("✅ Pueblo mágico agregado");
      }

      setNombre("");
      setDescripcion("");
      setCodigoPostal("");
      setFechaFundacion("");
      setPatrono("");
      setSantoPatron("");
      setFechaFeria("");
      setImagenBase64("");
      setRestaurantes([]);
      setHoteles([]);
      setActividades([]);
    } catch (error) {
      console.error("Error guardando en Firestore:", error);
      alert("❌ Error guardando: " + (error as Error).message);
    }
    setLoading(false);
  };

  const addItem = (type: "rest" | "hotel" | "act") => {
    if (type === "rest" && tempRest.trim()) {
      setRestaurantes([...restaurantes, tempRest.trim()]);
      setTempRest("");
    }
    if (type === "hotel" && tempHotel.trim()) {
      setHoteles([...hoteles, tempHotel.trim()]);
      setTempHotel("");
    }
    if (type === "act" && tempAct.trim()) {
      setActividades([...actividades, tempAct.trim()]);
      setTempAct("");
    }
  };

  const removeItem = (type: "rest" | "hotel" | "act", index: number) => {
    if (type === "rest") setRestaurantes(restaurantes.filter((_, i) => i !== index));
    if (type === "hotel") setHoteles(hoteles.filter((_, i) => i !== index));
    if (type === "act") setActividades(actividades.filter((_, i) => i !== index));
  };

  return (
    <div className="admin-container" style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h2>{editingId ? "✏️ Editar Pueblo Mágico" : "➕ Agregar Pueblo Mágico"}</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input type="text" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <textarea placeholder="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        <input type="text" placeholder="Código Postal" value={codigoPostal} onChange={(e) => setCodigoPostal(e.target.value)} />
        <input type="date" value={fechaFundacion} onChange={(e) => setFechaFundacion(e.target.value)} />
        <input type="text" placeholder="Patrono" value={patrono} onChange={(e) => setPatrono(e.target.value)} />
        <input type="text" placeholder="Santo Patrón" value={santoPatron} onChange={(e) => setSantoPatron(e.target.value)} />
        <input type="date" value={fechaFeria} onChange={(e) => setFechaFeria(e.target.value)} />

        <label>Imagen (máx 1MB)</label>
        <input type="file" accept="image/*" onChange={handleImageChange} />
        {imagenBase64 && <img src={imagenBase64} alt="Vista previa" style={{ maxWidth: "100%", marginTop: "10px" }} />}

        <h4>🍽 Restaurantes</h4>
        <div style={{ display: "flex", gap: "5px" }}>
          <input value={tempRest} onChange={(e) => setTempRest(e.target.value)} placeholder="Nombre del restaurante" />
          <button type="button" onClick={() => addItem("rest")}>Agregar</button>
        </div>
        <ul>
          {restaurantes.map((r, i) => (
            <li key={i}>{r} <button type="button" onClick={() => removeItem("rest", i)}>❌</button></li>
          ))}
        </ul>

        <h4>🏨 Hoteles</h4>
        <div style={{ display: "flex", gap: "5px" }}>
          <input value={tempHotel} onChange={(e) => setTempHotel(e.target.value)} placeholder="Nombre del hotel" />
          <button type="button" onClick={() => addItem("hotel")}>Agregar</button>
        </div>
        <ul>
          {hoteles.map((h, i) => (
            <li key={i}>{h} <button type="button" onClick={() => removeItem("hotel", i)}>❌</button></li>
          ))}
        </ul>

        <h4>🎯 Cosas que hacer</h4>
        <div style={{ display: "flex", gap: "5px" }}>
          <input value={tempAct} onChange={(e) => setTempAct(e.target.value)} placeholder="Actividad" />
          <button type="button" onClick={() => addItem("act")}>Agregar</button>
        </div>
        <ul>
          {actividades.map((a, i) => (
            <li key={i}>{a} <button type="button" onClick={() => removeItem("act", i)}>❌</button></li>
          ))}
        </ul>

        <button type="submit" disabled={loading}>
          {loading ? "Guardando..." : (editingId ? "Guardar Cambios" : "Agregar Pueblo")}
        </button>
      </form>
    </div>
  );
}
