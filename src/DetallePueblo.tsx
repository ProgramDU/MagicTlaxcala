// src/DetallePueblo.tsx
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useEffect, useState } from "react";
import type { PuebloMagico } from "./types";
import "./detalle.css";

export default function DetallePueblo() {
  const { id } = useParams();
  const [pueblo, setPueblo] = useState<PuebloMagico | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchPueblo = async () => {
      const docRef = doc(db, "pueblosMagicos", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPueblo({ id: docSnap.id, ...docSnap.data() } as PuebloMagico);
      }
    };
    fetchPueblo();
  }, [id]);

  if (!pueblo) return <p className="loading">Cargando información...</p>;

  return (
    <div className="detalle-container">
      <Link to="/" className="volver">← Volver</Link>
      <h1>{pueblo.nombre}</h1>
      {pueblo.imagen && <img src={pueblo.imagen} alt={pueblo.nombre} />}
      <p>{pueblo.descripcion}</p>

      <div className="info-extra">
        {pueblo.codigoPostal && <p><strong>Código Postal:</strong> {pueblo.codigoPostal}</p>}
        {pueblo.fechaFundacion && <p><strong>Fundación:</strong> {pueblo.fechaFundacion}</p>}
        {pueblo.patrono && <p><strong>Patrono:</strong> {pueblo.patrono}</p>}
        {pueblo.santoPatron && <p><strong>Santo Patrón:</strong> {pueblo.santoPatron}</p>}
        {pueblo.fechaFeria && <p><strong>Fecha de Feria:</strong> {pueblo.fechaFeria}</p>}
      </div>
    </div>
  );
}
