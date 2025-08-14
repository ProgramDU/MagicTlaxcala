import { useState } from "react";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "./firebase";

export default function AgregarLugarModal({ puebloId, categoria, onClose }: any) {
  const [nombre, setNombre] = useState("");
  const [concepto, setConcepto] = useState("");
  const [tipoComida, setTipoComida] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagenBase64, setImagenBase64] = useState("");

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
          setImagenBase64(compressedBase64);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nuevoLugar = { nombre, concepto, tipoComida, descripcion, imagen: imagenBase64 };
    await updateDoc(doc(db, "pueblosMagicos", puebloId), {
      [categoria]: arrayUnion(nuevoLugar)
    });
    onClose();
  };

  return (
    <div style={{ background: "#fff", padding: 20, borderRadius: 8 }}>
      <h3>Añadir {categoria}</h3>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <input type="text" placeholder="Concepto" value={concepto} onChange={(e) => setConcepto(e.target.value)} />
        {categoria === "restaurantes" && (
          <input type="text" placeholder="Tipo de comida" value={tipoComida} onChange={(e) => setTipoComida(e.target.value)} />
        )}
        <textarea placeholder="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        <input type="file" accept="image/*" onChange={handleImageChange} />
        {imagenBase64 && <img src={imagenBase64} alt="Vista previa" style={{ width: "100%", marginTop: "10px" }} />}
        <button type="submit">Guardar</button>
        <button type="button" onClick={onClose}>Cancelar</button>
      </form>
    </div>
  );
}
