import { useEffect, useState } from "react";
import { collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useIsAdmin } from "./hooks/useIsAdmin";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./admin.css";

type PuebloForm = {
  nombre: string;
  descripcion: string;
  codigoPostal: string;
  fechaFundacion: string;
  santoPatron: string;
  fechaFeria: string;
  imagenBase64: string;
};

const initialForm: PuebloForm = {
  nombre: "",
  descripcion: "",
  codigoPostal: "",
  fechaFundacion: "",
  santoPatron: "",
  fechaFeria: "",
  imagenBase64: "",
};

export default function Admin() {
  const { user, isAdmin } = useIsAdmin(); // <- { user, isAdmin, auth }
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const editingId = sp.get("id"); // si existe, estamos editando

  const [form, setForm] = useState<PuebloForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [loadingDoc, setLoadingDoc] = useState<boolean>(!!editingId);

  // Prefill si estamos editando
  useEffect(() => {
    if (!editingId) return;
    (async () => {
      try {
        setLoadingDoc(true);
        const ref = doc(db, "pueblosMagicos", editingId);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          alert("El pueblo no existe.");
          navigate("/");
          return;
        }
        const d = snap.data() as any;
        setForm({
          nombre: d.nombre || "",
          descripcion: d.descripcion || "",
          codigoPostal: d.codigoPostal || "",
          fechaFundacion: d.fechaFundacion || "",
          santoPatron: d.santoPatron || "",
          fechaFeria: d.fechaFeria || "",
          imagenBase64: d.imagen || "",
        });
      } catch (e) {
        console.error(e);
        alert("No se pudo cargar el pueblo.");
      } finally {
        setLoadingDoc(false);
      }
    })();
  }, [editingId, navigate]);

  const onChange =
    (k: keyof PuebloForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((p) => ({ ...p, [k]: e.target.value }));
    };

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
          setForm((p) => ({ ...p, imagenBase64: compressedBase64 }));
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

    if (!form.nombre || !form.codigoPostal || !form.imagenBase64) {
      alert("Por favor completa los campos requeridos (Nombre, Código Postal e Imagen).");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        codigoPostal: form.codigoPostal,
        fechaFundacion: form.fechaFundacion,
        santoPatron: form.santoPatron,
        fechaFeria: form.fechaFeria,
        imagen: form.imagenBase64,
        ...(editingId ? {} : { restaurantes: [], hoteles: [], actividades: [] }),
      };

      if (editingId) {
        await updateDoc(doc(db, "pueblosMagicos", editingId), payload);
        alert("Pueblo actualizado ✅");
      } else {
        await addDoc(collection(db, "pueblosMagicos"), payload);
        alert("Pueblo mágico guardado con éxito ✅");
        setForm(initialForm);
      }

      navigate("/");
    } catch (error) {
      console.error("Error guardando en Firestore:", error);
      alert("Error: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Estado intermedio mientras se resuelve el rol / doc
  if (isAdmin === null || loadingDoc) {
    return (
      <div className="admin-page">
        <div className="admin-hero">
          <div className="admin-hero-inner">
            <h1>{loadingDoc ? "Cargando pueblo…" : "Cargando…"}</h1>
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
          <h1>{editingId ? "✏️ Editar pueblo mágico" : "⚙️ Panel de Administración"}</h1>
          <p>{editingId ? "Actualiza la información del pueblo." : "Añade nuevos pueblos mágicos y gestiona su información."}</p>
        </div>
      </section>

      {/* Contenedor principal */}
      <main className="admin-main">
        <section className="admin-card">
          <h2 className="admin-card__title">
            {editingId ? "Editar" : "Agregar"} pueblo mágico
          </h2>
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="field">
              <label className="label">Nombre *</label>
              <input
                className="input"
                type="text"
                placeholder="Nombre"
                value={form.nombre}
                onChange={onChange("nombre")}
                required
              />
            </div>

            <div className="field">
              <label className="label">Descripción</label>
              <textarea
                className="input"
                placeholder="Describe el pueblo, historia, atractivos…"
                value={form.descripcion}
                onChange={onChange("descripcion")}
                rows={4}
              />
            </div>

            <div className="field">
              <label className="label">Código Postal *</label>
              <input
                className="input"
                type="text"
                placeholder="Código Postal"
                value={form.codigoPostal}
                onChange={onChange("codigoPostal")}
                required
              />
            </div>

            <div className="field">
              <label className="label">Fecha de Fundación</label>
              <input
                className="input"
                type="date"
                value={form.fechaFundacion}
                onChange={onChange("fechaFundacion")}
              />
            </div>

            <div className="field">
              <label className="label">Santo Patrón</label>
              <input
                className="input"
                type="text"
                placeholder="Santo Patrón"
                value={form.santoPatron}
                onChange={onChange("santoPatron")}
              />
            </div>

            <div className="field">
              <label className="label">Fecha de Feria</label>
              <input
                className="input"
                type="date"
                value={form.fechaFeria}
                onChange={onChange("fechaFeria")}
              />
            </div>

            <div className="field">
              <label className="label">Imagen *</label>
              <input className="input" type="file" accept="image/*" onChange={handleImageChange} />
              {form.imagenBase64 && <img className="preview" src={form.imagenBase64} alt="Vista previa" />}
              <small className="muted">Se comprime automáticamente (máx. ~1MB).</small>
            </div>

            <div className="actions">
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Guardando..." : editingId ? "Guardar cambios" : "Guardar Pueblo Mágico"}
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => navigate("/")} disabled={loading}>
                Volver al inicio
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
