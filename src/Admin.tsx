// src/Admin.tsx
import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "./firebase";
import type { PuebloMagico } from "./types";

export default function Admin() {
  const [form, setForm] = useState<PuebloMagico>({
    nombre: "",
    codigoPostal: "",
    fechaFundacion: "",
    patrono: "",
    santoPatron: "",
    fechaFeria: "",
    imagen: "",
    descripcion: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones mínimas
    if (!form.nombre) return alert("El nombre es obligatorio.");
    if (!form.codigoPostal) return alert("El código postal es obligatorio.");

    await addDoc(collection(db, "pueblosMagicos"), {
      ...form,
    });

    alert("Pueblo mágico agregado");
    setForm({
      nombre: "",
      codigoPostal: "",
      fechaFundacion: "",
      patrono: "",
      santoPatron: "",
      fechaFeria: "",
      imagen: "",
      descripcion: ""
    });
  };

  return (
    <div className="main-content">
      <div className="header">
        <h1>Agregar Pueblo Mágico</h1>
        <p>Registra nombre, CP, fechas y más</p>
      </div>

      <form onSubmit={handleSubmit}>
        <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} required />
        <input name="codigoPostal" placeholder="Código Postal" value={form.codigoPostal} onChange={handleChange} required />
        <input name="fechaFundacion" type="date" placeholder="Fecha de Fundación" value={form.fechaFundacion} onChange={handleChange} />
        <input name="patrono" placeholder="Patrono" value={form.patrono} onChange={handleChange} />
        <input name="santoPatron" placeholder="Santo Patrón" value={form.santoPatron} onChange={handleChange} />
        <input name="fechaFeria" type="date" placeholder="Fecha de Feria" value={form.fechaFeria} onChange={handleChange} />
        <input name="imagen" placeholder="URL de imagen (opcional)" value={form.imagen} onChange={handleChange} />
        <textarea name="descripcion" placeholder="Descripción (opcional)" value={form.descripcion} onChange={handleChange} rows={3} />
        <button type="submit">Guardar</button>
      </form>
    </div>
  );
}
