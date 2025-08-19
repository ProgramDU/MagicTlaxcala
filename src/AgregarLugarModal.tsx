// src/AgregarLugarModal.tsx
import React, { useState } from "react";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "./firebase";
import { useIsAdmin } from "./hooks/useIsAdmin";

type Categoria = "restaurantes" | "hoteles" | "actividades";

type Props = {
  puebloId: string;
  categoria: Categoria;
  onClose: () => void;
  onSaved?: () => void;
};

type Lugar = {
  nombre: string;
  concepto: string;
  descripcion: string;
  tipoComida?: string;
  imagen?: string; // DataURL comprimido
};

const MAX_WIDTH = 800;
const MAX_BYTES = 1_048_576; // ~1 MB

async function fileToCompressedDataURL(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = dataUrl;
  });

  const scale = Math.min(1, MAX_WIDTH / img.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

  const out = canvas.toDataURL("image/jpeg", 0.75);
  const approxBytes = Math.ceil((out.length * 3) / 4);
  if (approxBytes > MAX_BYTES) throw new Error("Imagen demasiado grande tras compresión.");
  return out;
}

export default function AgregarLugarModal({ puebloId, categoria, onClose, onSaved }: Props) {
  // <-- AQUÍ: extraemos solo isAdmin del hook
  const { isAdmin } = useIsAdmin();

  const [nombre, setNombre] = useState("");
  const [concepto, setConcepto] = useState("");
  const [tipoComida, setTipoComida] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagenBase64, setImagenBase64] = useState<string>("");
  const [preview, setPreview] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPreview(URL.createObjectURL(file));
      const compressed = await fileToCompressedDataURL(file);
      setImagenBase64(compressed);
    } catch (err) {
      console.error(err);
      alert("No se pudo procesar la imagen (debe pesar < ~1MB).");
      setPreview("");
      setImagenBase64("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert("Solo un administrador puede agregar elementos.");
      return;
    }
    if (!nombre.trim() || !concepto.trim() || !descripcion.trim()) {
      alert("Completa nombre, concepto y descripción.");
      return;
    }

    const nuevo: Lugar = {
      nombre: nombre.trim(),
      concepto: concepto.trim(),
      descripcion: descripcion.trim(),
      ...(categoria === "restaurantes" && tipoComida.trim() ? { tipoComida: tipoComida.trim() } : {}),
      ...(imagenBase64 ? { imagen: imagenBase64 } : {}),
    };

    try {
      setSaving(true);
      await updateDoc(doc(db, "pueblosMagicos", puebloId), {
        [categoria]: arrayUnion(nuevo),
      });
      onSaved?.();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error al guardar en Firestore.");
    } finally {
      setSaving(false);
    }
  };

  // UI muy simple del modal
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.35)",
        display: "grid",
        placeItems: "center",
        zIndex: 50,
        padding: 12,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          width: "min(640px, 100%)",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          boxShadow: "0 12px 28px rgba(0,0,0,.18)",
          padding: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0, marginBottom: 10 }}>
          Añadir {categoria === "restaurantes" ? "restaurante" : categoria === "hoteles" ? "hotel" : "actividad"}
        </h3>

        {!isAdmin && (
          <div
            style={{
              background: "#fff3cd",
              border: "1px solid #ffeeba",
              color: "#856404",
              padding: "10px 12px",
              borderRadius: 8,
              marginBottom: 10,
            }}
          >
            Solo un administrador puede agregar elementos.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
          <div>
            <label style={labelCss}>Nombre *</label>
            <input
              style={inputCss}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Restaurante Doña Lupita"
            />
          </div>

          <div>
            <label style={labelCss}>Concepto *</label>
            <input
              style={inputCss}
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              placeholder="Ej. Cocina tradicional / Eco hotel / Tour guiado"
            />
          </div>

          {categoria === "restaurantes" && (
            <div>
              <label style={labelCss}>Tipo de comida (opcional)</label>
              <input
                style={inputCss}
                value={tipoComida}
                onChange={(e) => setTipoComida(e.target.value)}
                placeholder="Ej. Mixteca, antojitos, gourmet…"
              />
            </div>
          )}

          <div>
            <label style={labelCss}>Descripción *</label>
            <textarea
              style={{ ...inputCss, minHeight: 100 }}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Cuéntanos sobre este lugar…"
            />
          </div>

          <div>
            <label style={labelCss}>Imagen (opcional)</label>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {preview && (
              <img
                src={preview}
                alt="Vista previa"
                style={{
                  width: "100%",
                  maxHeight: 220,
                  objectFit: "cover",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  marginTop: 8,
                }}
              />
            )}
            <small style={{ color: "#6b7280" }}>
              Se comprime automáticamente (máx. ~1MB) antes de guardarse.
            </small>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
            <button
              type="submit"
              disabled={!isAdmin || saving}
              style={{
                ...btnCss,
                background: !isAdmin || saving ? "#9CA3AF" : "linear-gradient(90deg,#10b981,#84cc16)",
                cursor: !isAdmin || saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <button type="button" onClick={onClose} style={{ ...btnCss, background: "#6b7280" }}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelCss: React.CSSProperties = { fontWeight: 700, marginBottom: 6, display: "block" };
const inputCss: React.CSSProperties = {
  width: "100%",
  padding: 10,
  border: "1px solid #d1d5db",
  borderRadius: 8,
};
const btnCss: React.CSSProperties = {
  padding: "10px 16px",
  border: "none",
  borderRadius: 8,
  color: "#fff",
  fontWeight: 700,
};
