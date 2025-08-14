import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

type Pueblo = {
  nombre: string;
  descripcion?: string;
  codigoPostal?: string;
  fechaFundacion?: string;
  patrono?: string;
  santoPatron?: string;
  fechaFeria?: string;
  imagen: string;
};

export default function PuebloDetalle() {
  const { id } = useParams<{ id: string }>();
  const [pueblo, setPueblo] = useState<Pueblo | null>(null);

  useEffect(() => {
    const fetchPueblo = async () => {
      if (!id) return;
      const docRef = doc(db, "pueblosMagicos", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPueblo(docSnap.data() as Pueblo);
      }
    };
    fetchPueblo();
  }, [id]);

  if (!pueblo) return <p>Cargando...</p>;

  return (
    <div className="main-content">
      <div className="pueblo-detalle">
        <h1>{pueblo.nombre}</h1>
        <img src={pueblo.imagen} alt={pueblo.nombre} style={{ maxWidth: "500px" }} />
        <p>{pueblo.descripcion}</p>
        <ul>
          <li><strong>Código Postal:</strong> {pueblo.codigoPostal}</li>
          <li><strong>Fecha de Fundación:</strong> {pueblo.fechaFundacion}</li>
          <li><strong>Patrono:</strong> {pueblo.patrono}</li>
          <li><strong>Santo Patrón:</strong> {pueblo.santoPatron}</li>
          <li><strong>Fecha de Feria:</strong> {pueblo.fechaFeria}</li>
        </ul>
      </div>
    </div>
  );
}
