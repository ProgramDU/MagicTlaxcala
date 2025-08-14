import { useState } from "react";
import { doc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { useIsAdmin } from "./hooks/useIsAdmin";

type Categoria =
  | "restaurantes"
  | "hoteles"
  | "actividades"
  | "tradiciones"
  | "gastronomia"
  | "leyendas";

type LugarBase = {
  nombre: string;
  concepto?: string;
  descripcion?: string;
  imagen?: string; // base64
};

type Restaurante = LugarBase & { tipoComida?: string };

type Props = {
  puebloId: string;
  categoria: Categoria;
  onClose: () => void;
};

export default function AgregarLugarModal({ puebloId, categoria, onClose }: Props) {
  const isAdmin = useIsAdmin(); // null | boolean

  const [nombre, setNombre] = useState("");
  const [concepto, setConcepto] = useState("");
  const [tipoComida, setTipoComida] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagenBase64, setImagenBase64] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErr(null);
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

          // Calidad 0.7; puedes ajustar 0.6–0.8
          const b64 = canvas.toDataURL("image/jpeg", 0.7);

          // Estimar bytes desde base64 (~3/4)
          const approxBytes = Math.ceil((b64.length * 3) / 4);
          if (approxBytes > 1_048_000) {
            setErr("La imagen comprimida supera ~1MB. Prueba con una más pequeña.");
            return;
          }
          setImagenBase64(b64);
        } catch (e) {
          console.error(e);
          setErr("No se pudo procesar la imagen. Intenta con otra.");
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (isAdmin === false) {
      setErr("Solo administradores pueden agregar contenido.");
      return;
    }
    if (!nombre.trim()) {
      setErr("El nombre es obligatorio.");
      return;
    }
    // Si esperas imagen obligatoria para estas categorías, deja esta validación:
    // if (!imagenBase64) { setErr("La imagen es obligatoria."); return; }

    setLoading(true);
    try {
      // Construir el objeto a guardar
      let nuevoLugar: Restaurante | LugarBase = {
        nombre: nombre.trim(),
        concepto: concepto.trim() || undefined,
        descripcion: descripcion.trim() || undefined,
        imagen: imagenBase64 || undefined,
      };

      if (categoria === "restaurantes" && tipoComida.trim()) {
        (nuevoLugar as Restaurante).tipoComida = tipoComida.trim();
      }

      // Agrega metadatos útiles
      const payload = {
        ...nuevoLugar,
        _createdAt: serverTimestamp(),
        _updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, "pueblosMagicos", puebloId), {
        [categoria]: arrayUnion(payload),
      });

      onClose();
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "Error desconocido al guardar.");
    } finally {
      setLoading(false);
    }
  };

  // Mientras se resuelve el hook o si no es admin, deshabilitamos enviar.
  const canSubmit = isAdmin === true && !loading;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="bg-white rounded-xl shadow-xl p-5 w-full max-w-lg"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold">
          Añadir {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-500 hover:text-slate-800"
          aria-label="Cerrar"
          disabled={loading}
        >
          ✖
        </button>
      </div>

      {isAdmin === false && (
        <div className="mb-3 text-sm text-rose-600 font-semibold">
          Solo administradores pueden agregar contenido.
        </div>
      )}
      {err && (
        <div className="mb-3 text-sm text-rose-600">
          {err}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-3">
        <div className="grid gap-1">
          <label className="text-sm font-semibold">Nombre *</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="border rounded-lg px-3 py-2"
            placeholder="Ej. Restaurante El Sabroso"
          />
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-semibold">Concepto</label>
          <input
            type="text"
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            className="border rounded-lg px-3 py-2"
            placeholder="Ej. Cocina tradicional / artesanal"
          />
        </div>

        {categoria === "restaurantes" && (
          <div className="grid gap-1">
            <label className="text-sm font-semibold">Tipo de comida</label>
            <input
              type="text"
              value={tipoComida}
              onChange={(e) => setTipoComida(e.target.value)}
              className="border rounded-lg px-3 py-2"
              placeholder="Ej. Tlaxcalteca, antojitos, carnes..."
            />
          </div>
        )}

        <div className="grid gap-1">
          <label className="text-sm font-semibold">Descripción</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="border rounded-lg px-3 py-2 min-h-24"
            placeholder="Breve descripción del lugar."
          />
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-semibold">Imagen (se comprime automáticamente)</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {imagenBase64 && (
            <img
              src={imagenBase64}
              alt="Vista previa"
              className="mt-2 w-full rounded-lg border"
            />
          )}
          <small className="text-slate-500">
            Límite aproximado: ~1 MB (por límite de documento de Firestore).
          </small>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className={`px-4 py-2 rounded-lg text-white ${
              canSubmit ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-400 cursor-not-allowed"
            }`}
          >
            {loading ? "Guardando…" : "Guardar"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg border hover:bg-slate-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
