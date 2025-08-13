// src/Admin.tsx
import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "./firebase";
import type { PuebloMagico } from "./types";
import "./admin.css"; // ⬅️ Importamos estilos

export default function Admin() {
  const [form, setForm] = useState<PuebloMagico>({
    nombre: "",
    descripcion: "",
    codigoPostal: "",
    fechaFundacion: "",
    patrono: "",
    santoPatron: "",
    fechaFeria: "",
    imagen: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, "pueblosMagicos"), form);
    alert("✅ Pueblo mágico agregado correctamente");
    setForm({
      nombre: "",
      descripcion: "",
      codigoPostal: "",
      fechaFundacion: "",
      patrono: "",
      santoPatron: "",
      fechaFeria: "",
      imagen: ""
    });
  };

  return (
    <div className="admin-container">
      <h1>Agregar Pueblo Mágico</h1>
      <form className="admin-form" onSubmit={handleSubmit}>
        <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} required />
        <textarea name="descripcion" placeholder="Descripción" value={form.descripcion} onChange={handleChange} required />
        <input name="codigoPostal" placeholder="Código Postal" value={form.codigoPostal} onChange={handleChange} required />
        <label>Fecha de Fundación:</label>
        <input type="date" name="fechaFundacion" value={form.fechaFundacion} onChange={handleChange} required />
        <input name="patrono" placeholder="Patrono" value={form.patrono} onChange={handleChange} required />
        <input name="santoPatron" placeholder="Santo Patrón" value={form.santoPatron} onChange={handleChange} required />
        <label>Fecha de Feria:</label>
        <input type="date" name="fechaFeria" value={form.fechaFeria} onChange={handleChange} required />
        <input name="imagen" placeholder="URL de Imagen" value={form.imagen} onChange={handleChange} />
        <button type="submit">Guardar</button>
      </form>
    </div>
  );
}
