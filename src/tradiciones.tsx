import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  CollectionReference,
} from "firebase/firestore";
import { db } from "./firebase";
import { useIsAdmin } from "./hooks/useIsAdmin";

type Tradicion = {
  id?: string;
  titulo: string;
  descripcion: string;
  fecha?: string;          // ej. "Agosto" o "2025-08-14"
  antecedentes?: string;   // texto corto
  imagen?: string;         // base64 (comprimida)
  _createdAt?: any;
  _updatedAt?: any;
};

type Props = {
  puebloId: string;
};

export default function Tradiciones({ puebloId }: Props) {
  const isAdmin = useIsAdmin(); // null | boolean

  const [items, setItems] = useState<Tradicion[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  // modos: ver | agregar | editar-select | eliminar-select | editando
  const [mode, setMode] = useState<
    "ver" | "agregar" | "editar-select" | "editando" | "eliminar-select"
  >("ver");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // form
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState("");
  const [antecedentes, setAntecedentes] = useState("");
  const [imagenBase64, setImagenBase64] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const colRef = useMemo<CollectionReference>(
    () => collection(db, "pueblosMagicos", puebloId, "tradiciones") as CollectionReference,
    [puebloId]
  );

  useEffect(() => {
    const q = query(colRef, orderBy("_createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Tradicion) }));
      setItems(data);
    });
    return () => unsub();
  }, [colRef]);

  const resetForm = () => {
    setTitulo("");
    setDescripcion("");
    setFecha("");
    setAntecedentes("");
    setImagenBase64("");
    setSelectedId(null);
    setMode("ver");
    setErr(null);
    setSaving(false);
  };

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
          const MAX_WIDTH = 900;
          const scale = Math.min(1, MAX_WIDTH / img.width);
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

          const b64 = canvas.toDataURL("image/jpeg", 0.7);
          const approxBytes = Math.ceil((b64.length * 3) / 4);
          if (approxBytes > 1_048_000) {
            setErr("La imagen comprimida supera ~1MB. Usa una más pequeña.");
            return;
          }
          setImagenBase64(b64);
        } catch (e) {
          console.error(e);
          setErr("No se pudo procesar la imagen.");
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // --- acciones admin ---
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return setErr("Solo administradores pueden agregar.");
    if (!titulo.trim() || !descripcion.trim()) {
      setErr("Título y descripción son obligatorios.");
      return;
    }
    setSaving(true);
    try {
      await addDoc(colRef, {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        fecha: fecha.trim() || undefined,
        antecedentes: antecedentes.trim() || undefined,
        imagen: imagenBase64 || undefined,
        _createdAt: serverTimestamp(),
        _updatedAt: serverTimestamp(),
      });
      resetForm();
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "Error al guardar.");
      setSaving(false);
    }
  };

  const startEditById = (id: string) => {
    if (!isAdmin) return;
    const it = items.find((x) => x.id === id);
    if (!it) return;
    setSelectedId(id);
    setTitulo(it.titulo || "");
    setDescripcion(it.descripcion || "");
    setFecha(it.fecha || "");
    setAntecedentes(it.antecedentes || "");
    setImagenBase64(it.imagen || "");
    setMode("editando");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return setErr("Solo administradores pueden editar.");
    if (!selectedId) return;
    if (!titulo.trim() || !descripcion.trim()) {
      setErr("Título y descripción son obligatorios.");
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(colRef, selectedId), {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        fecha: fecha.trim() || undefined,
        antecedentes: antecedentes.trim() || undefined,
        imagen: imagenBase64 || undefined,
        _updatedAt: serverTimestamp(),
      });
      resetForm();
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "Error al actualizar.");
      setSaving(false);
    }
  };

  const deleteById = async (id: string) => {
    if (!isAdmin) return;
    const it = items.find((x) => x.id === id);
    if (!it) return;
    const ok = window.confirm(`¿Eliminar "${it.titulo}"? Esta acción no se puede deshacer.`);
    if (!ok) return;
    try {
      await deleteDoc(doc(colRef, id));
      if (openId === id) setOpenId(null);
      if (selectedId === id) setSelectedId(null);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "Error al eliminar.");
    }
  };

  // --- UI ---
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
      {/* Barra admin */}
      {isAdmin ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => setMode(mode === "agregar" ? "ver" : "agregar")}
            className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {mode === "agregar" ? "Cancelar" : "➕ Agregar"}
          </button>

          <button
            onClick={() => setMode(mode === "editar-select" ? "ver" : "editar-select")}
            className={`px-3 py-2 rounded-lg text-white ${
              mode === "editar-select" ? "bg-indigo-700" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            ✏️ Editar (seleccionar card)
          </button>

          <button
            onClick={() => setMode(mode === "eliminar-select" ? "ver" : "eliminar-select")}
            className={`px-3 py-2 rounded-lg text-white ${
              mode === "eliminar-select" ? "bg-rose-700" : "bg-rose-600 hover:bg-rose-700"
            }`}
          >
            🗑 Eliminar (seleccionar card)
          </button>
        </div>
      ) : null}

      {/* Form agregar / editar */}
      {(mode === "agregar" || mode === "editando") && (
        <form onSubmit={mode === "agregar" ? handleAdd : handleUpdate} className="grid gap-3 bg-white p-4 rounded-xl shadow">
          {err && <div className="text-sm text-rose-600">{err}</div>}

          <div className="grid gap-1">
            <label className="text-sm font-semibold">Título *</label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="border rounded-lg px-3 py-2"
              placeholder="Ej. La Noche que Nadie Duerme"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-semibold">Descripción *</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="border rounded-lg px-3 py-2 min-h-24"
              placeholder="Descripción de la tradición…"
            />
          </div>

          <div className="grid gap-1 sm:grid-cols-2 sm:gap-3">
            <div className="grid gap-1">
              <label className="text-sm font-semibold">Fecha (texto o fecha)</label>
              <input
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="border rounded-lg px-3 py-2"
                placeholder='Ej. "Agosto" o "2025-08-14"'
              />
            </div>

            <div className="grid gap-1">
              <label className="text-sm font-semibold">Antecedentes</label>
              <input
                value={antecedentes}
                onChange={(e) => setAntecedentes(e.target.value)}
                className="border rounded-lg px-3 py-2"
                placeholder="Breve contexto histórico"
              />
            </div>
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-semibold">Imagen (opcional)</label>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {imagenBase64 && (
              <img src={imagenBase64} alt="Vista previa" className="mt-2 w-full max-w-md rounded-lg border" />
            )}
            <small className="text-slate-500">Se comprime automáticamente (≈1MB máx).</small>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className={`px-4 py-2 rounded-lg text-white ${
                saving ? "bg-slate-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {saving ? "Guardando…" : mode === "agregar" ? "Guardar tradición" : "Actualizar tradición"}
            </button>
            <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg border hover:bg-slate-50">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Grid de cards */}
      {items.length === 0 ? (
        <div className="text-slate-500">No hay tradiciones registradas.</div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => {
            const isOpen = openId === t.id;
            const highlight =
              mode === "editar-select" || mode === "eliminar-select" ? "ring-2 ring-offset-2 ring-amber-400" : "";
            return (
              <div
                key={t.id}
                className={`bg-white rounded-xl shadow hover:shadow-lg transition-shadow overflow-hidden cursor-pointer ${highlight}`}
                onClick={() => {
                  if (mode === "editar-select" && isAdmin) return startEditById(t.id!);
                  if (mode === "eliminar-select" && isAdmin) return deleteById(t.id!);
                  setOpenId((prev) => (prev === t.id ? null : t.id!));
                }}
                title={
                  mode === "editar-select"
                    ? "Haz click para editar esta tradición"
                    : mode === "eliminar-select"
                    ? "Haz click para eliminar esta tradición"
                    : "Ver detalles"
                }
              >
                {/* Imagen */}
                {t.imagen ? (
                  <img src={t.imagen} alt={t.titulo} className="h-40 w-full object-cover" />
                ) : (
                  <div className="h-40 w-full bg-slate-200 flex items-center justify-center text-slate-400 text-sm">
                    Sin imagen
                  </div>
                )}

                {/* Contenido */}
                <div className="p-4">
                  {/* Título (acordeón) */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">{t.titulo}</h3>
                    <span className="text-xl leading-none select-none">{isOpen ? "−" : "+"}</span>
                  </div>

                  {/* Panel desplegable */}
                  {isOpen && (
                    <div className="mt-3 space-y-2 text-sm text-slate-700">
                      {t.fecha && (
                        <p>
                          <b>Fecha:</b> {t.fecha}
                        </p>
                      )}
                      {t.antecedentes && (
                        <p>
                          <b>Antecedentes:</b> {t.antecedentes}
                        </p>
                      )}
                      <p>{t.descripcion}</p>
                    </div>
                  )}

                  {/* Pistas de modo admin (opcional) */}
                  {isAdmin && (mode === "editar-select" || mode === "eliminar-select") && (
                    <p className="mt-3 text-xs text-amber-700">
                      {mode === "editar-select"
                        ? "Haz click en la card para editar."
                        : "Haz click en la card para eliminar."}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
