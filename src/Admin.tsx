import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useIsAdmin } from "./hooks/useIsAdmin";
import { useNavigate } from "react-router-dom";
import "./admin.css"; // Asegúrate de tener estilos básicos para el formulario

export default function Admin() {
  const { user, isAdmin } = useIsAdmin(); // <- objeto { user, isAdmin, auth }
  const navigate = useNavigate();

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
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const MAX_WIDTH = 800;
          const scale = Math.min(1, MAX_WIDTH / img.width);
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
          const byteLength = Math.ceil((compressedBase64.length * 3) / 4);
          if (byteLength > 1_048_487) {
            alert("La imagen sigue siendo muy grande. Intenta con otra más pequeña.");
            return;
          }
          setImagenBase64(compressedBase64);
        } catch (err) {
          console.error("Error al comprimir la imagen:", err);
          alert("No se pudo procesar la imagen. Intenta con otra.");
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre || !codigoPostal || !imagenBase64) {
      alert("Por favor completa los campos requeridos (Nombre, Código Postal e Imagen).");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "pueblosMagicos"), {
        nombre,
        codigoPostal,
        fechaFundacion,
      
        santoPatron,
        fechaFeria,
        imagen: imagenBase64,
        restaurantes: [],
        hoteles: [],
        actividades: [],
      });

      alert("Pueblo mágico guardado con éxito ✅");
      setNombre("");
      setCodigoPostal("");
      setFechaFundacion("");
    
      setSantoPatron("");
      setFechaFeria("");
      setImagenBase64("");
    } catch (error) {
      console.error("Error guardando en Firestore:", error);
      alert("Error: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Estado intermedio mientras se resuelve el rol
  if (isAdmin === null) {
    return (
      <div className="admin-page">
        <div className="admin-hero">
          <div className="admin-hero-inner">
            <h1>Cargando…</h1>
            <p>Verificando permisos de administrador.</p>
          </div>
        </div>
      </div>
    );
  }

  // Bloqueo si no es admin
  if (isAdmin === false) {
    return (
      <div className="admin-page">
        <div className="admin-hero admin-hero--warning">
          <div className="admin-hero-inner">
            <h1>Acceso restringido</h1>
            <p>Esta sección es solo para administradores.</p>
            <button className="btn btn-dark" onClick={() => navigate("/login")}>
              Ir a iniciar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Admin: formulario
  return (
    <div className="admin-page">
      {/* Cabecera con “branding” y descripción ligeros */}
      <section className="admin-hero">
        <div className="admin-hero-inner">
          <h1>⚙️ Panel de Administración</h1>
          <p>Añade nuevos pueblos mágicos y gestiona su información.</p>
        </div>
      </section>

      {/* Contenedor principal */}
      <main className="admin-main">
        <section className="admin-card">
          <h2 className="admin-card__title">Agregar pueblo mágico</h2>
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="field">
              <label className="label">Nombre *</label>
              <input
                className="input"
                type="text"
                placeholder="Nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label className="label">Código Postal *</label>
              <input
                className="input"
                type="text"
                placeholder="Código Postal"
                value={codigoPostal}
                onChange={(e) => setCodigoPostal(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label className="label">Fecha de Fundación</label>
              <input
                className="input"
                type="date"
                value={fechaFundacion}
                onChange={(e) => setFechaFundacion(e.target.value)}
              />
            </div>

            

            <div className="field">
              <label className="label">Santo Patrón</label>
              <input
                className="input"
                type="text"
                placeholder="Santo Patrón"
                value={santoPatron}
                onChange={(e) => setSantoPatron(e.target.value)}
              />
            </div>

            <div className="field">
              <label className="label">Fecha de Feria</label>
              <input
                className="input"
                type="date"
                value={fechaFeria}
                onChange={(e) => setFechaFeria(e.target.value)}
              />
            </div>

            <div className="field">
              <label className="label">Imagen *</label>
              <input className="input" type="file" accept="image/*" onChange={handleImageChange} />
              {imagenBase64 && (
                <img className="preview" src={imagenBase64} alt="Vista previa" />
              )}
              <small className="muted">Se comprime automáticamente</small>
            </div>

            <div className="actions">
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar Pueblo Mágico"}
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => navigate("/")}
                disabled={loading}
              >
                Volver al inicio
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
