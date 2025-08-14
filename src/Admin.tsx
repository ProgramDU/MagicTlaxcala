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
  const [imagen, setImagen] = useState("");
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
        const ref = doc(db, "pueblosMagicos", editingId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setNombre(data.nombre || "");
          setDescripcion(data.descripcion || "");
          setCodigoPostal(data.codigoPostal || "");
          setFechaFundacion(data.fechaFundacion || "");
          setPatrono(data.patrono || "");
          setSantoPatron(data.santoPatron || "");
          setFechaFeria(data.fechaFeria || "");
          setImagen(data.imagen || "");
          setRestaurantes(data.restaurantes || []);
          setHoteles(data.hoteles || []);
          setActividades(data.actividades || []);
        }
      };
      fetchData();
    }
  }, [editingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const puebloData = {
      nombre,
      descripcion,
      codigoPostal,
      fechaFundacion,
      patrono,
      santoPatron,
      fechaFeria,
      imagen,
      restaurantes,
      hoteles,
      actividades,
    };

    if (editingId) {
      await updateDoc(doc(db, "pueblosMagicos", editingId), puebloData);
      alert("Pueblo mágico actualizado ✅");
    } else {
      await addDoc(collection(db, "pueblosMagicos"), puebloData);
      alert("Pueblo mágico agregado ✅");
    }

    // Limpiar formulario
    setNombre("");
    setDescripcion("");
    setCodigoPostal("");
    setFechaFundacion("");
    setPatrono("");
    setSantoPatron("");
    setFechaFeria("");
    setImagen("");
    setRestaurantes([]);
    setHoteles([]);
    setActividades([]);
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
    <div className="admin-container">
      <h2>{editingId ? "✏️ Editar Pueblo Mágico" : "➕ Agregar Pueblo Mágico"}</h2>
      <form onSubmit={handleSubmit} className="admin-form">
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" required />
        <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción" />
        <input value={codigoPostal} onChange={(e) => setCodigoPostal(e.target.value)} placeholder="Código Postal" />
        <input value={fechaFundacion} onChange={(e) => setFechaFundacion(e.target.value)} placeholder="Fecha de Fundación" />
        <input value={patrono} onChange={(e) => setPatrono(e.target.value)} placeholder="Patrono" />
        <input value={santoPatron} onChange={(e) => setSantoPatron(e.target.value)} placeholder="Santo Patrón" />
        <input value={fechaFeria} onChange={(e) => setFechaFeria(e.target.value)} placeholder="Fecha de Feria" />
        <input value={imagen} onChange={(e) => setImagen(e.target.value)} placeholder="URL de la imagen" />

        {/* Restaurantes */}
        <div>
          <h4>🍽 Restaurantes</h4>
          <div style={{ display: "flex", gap: "5px" }}>
            <input value={tempRest} onChange={(e) => setTempRest(e.target.value)} placeholder="Nombre del restaurante" />
            <button type="button" onClick={() => addItem("rest")}>Agregar</button>
          </div>
          <ul>
            {restaurantes.map((r, i) => (
              <li key={i}>
                {r} <button type="button" onClick={() => removeItem("rest", i)}>❌</button>
              </li>
            ))}
          </ul>
        </div>

        {/* Hoteles */}
        <div>
          <h4>🏨 Hoteles</h4>
          <div style={{ display: "flex", gap: "5px" }}>
            <input value={tempHotel} onChange={(e) => setTempHotel(e.target.value)} placeholder="Nombre del hotel" />
            <button type="button" onClick={() => addItem("hotel")}>Agregar</button>
          </div>
          <ul>
            {hoteles.map((h, i) => (
              <li key={i}>
                {h} <button type="button" onClick={() => removeItem("hotel", i)}>❌</button>
              </li>
            ))}
          </ul>
        </div>

        {/* Actividades */}
        <div>
          <h4>🎯 Cosas que hacer</h4>
          <div style={{ display: "flex", gap: "5px" }}>
            <input value={tempAct} onChange={(e) => setTempAct(e.target.value)} placeholder="Actividad" />
            <button type="button" onClick={() => addItem("act")}>Agregar</button>
          </div>
          <ul>
            {actividades.map((a, i) => (
              <li key={i}>
                {a} <button type="button" onClick={() => removeItem("act", i)}>❌</button>
              </li>
            ))}
          </ul>
        </div>

        <button type="submit">{editingId ? "Guardar Cambios" : "Agregar Pueblo"}</button>
      </form>
    </div>
  );
}
