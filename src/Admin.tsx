import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useIsAdmin } from "./hooks/useIsAdmin";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const isAdmin = useIsAdmin(); // null | boolean
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

          // Calidad 0.7 (~70%), puedes ajustar
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);

          // Aproximar tamaño binario desde base64 (3/4)
          const byteLength = Math.ceil((compressedBase64.length * 3) / 4);
          if (byteLength > 1_048_487) { // ~1 MB (el límite exacto de Firestore doc es 1,048,576 bytes)
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
        patrono,
        santoPatron,
        fechaFeria,
        imagen: imagenBase64,
        restaurantes: [],
        hoteles: [],
        actividades: []
      });

      alert("Pueblo mágico guardado con éxito ✅");
      setNombre("");
      setCodigoPostal("");
      setFechaFundacion("");
      setPatrono("");
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

  // Cargando estado admin (mientras se resuelve el hook)
  if (isAdmin === null) {
    return (
      <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
        Cargando…
      </div>
    );
  }

  // No admin: bloquea UI y ofrece ir a login
  if (isAdmin === false) {
    return (
      <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
        <h2>Acceso restringido</h2>
        <p>Esta sección es solo para administradores.</p>
        <button
          onClick={() => navigate("/login")}
          style={{
            marginTop: 12,
            padding: "10px 14px",
            borderRadius: 10,
            border: "none",
            background: "#1f2937",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 700
          }}
        >
          Ir a iniciar sesión
        </button>
      </div>
    );
  }

  // Admin: muestra el formulario
  return (
    <div className="admin-container" style={{ padding: "20px", maxWidth: "720px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: 12 }}>Panel de Administración</h2>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gap: 8 }}>
          <label>Nombre *</label>
          <input
            type="text"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            style={{ padding: 10, borderRadius: 8, border: "1px solid #d1d5db" }}
          />
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label>Código Postal *</label>
          <input
            type="text"
            placeholder="Código Postal"
            value={codigoPostal}
            onChange={(e) => setCodigoPostal(e.target.value)}
            required
            style={{ padding: 10, borderRadius: 8, border: "1px solid #d1d5db" }}
          />
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label>Fecha de Fundación</label>
          <input
            type="date"
            value={fechaFundacion}
            onChange={(e) => setFechaFundacion(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #d1d5db" }}
          />
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label>Patrono</label>
          <input
            type="text"
            placeholder="Patrono"
            value={patrono}
            onChange={(e) => setPatrono(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #d1d5db" }}
          />
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label>Santo Patrón</label>
          <input
            type="text"
            placeholder="Santo Patrón"
            value={santoPatron}
            onChange={(e) => setSantoPatron(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #d1d5db" }}
          />
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label>Fecha de Feria</label>
          <input
            type="date"
            value={fechaFeria}
            onChange={(e) => setFechaFeria(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #d1d5db" }}
          />
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label>Imagen *</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {imagenBase64 && (
            <img
              src={imagenBase64}
              alt="Vista previa"
              style={{ maxWidth: "100%", borderRadius: 10, border: "1px solid #e5e7eb" }}
            />
          )}
          <small style={{ color: "#6b7280" }}>
            Se comprime automáticamente (máx. ~1MB en Firestore).
          </small>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "none",
            background: loading ? "#9CA3AF" : "linear-gradient(45deg,#2563eb,#7c3aed)",
            color: "#fff",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 800
          }}
        >
          {loading ? "Guardando..." : "Guardar Pueblo Mágico"}
        </button>
      </form>
    </div>
  );
}
