import React, { useEffect, useMemo, useState } from "react";
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
import { fileToCompressedDataURL, dataUrlBytes, MAX_DATAURL_BYTES } from "./utils/images";

type GastronomiaItem = {
  id?: string;
  platillo: string;              // nombre del platillo
  origen?: string;               // p. ej. "Huamantla", "Tlaxco", "Ixtenco"
  tipo?: "entrada" | "plato_fuerte" | "postre" | "snack";
  presentacion?: string;         // p. ej. "plato hondo", "tortilla", "cazuela"
  sabor?: string;                // p. ej. "dulce", "salado", "picante", "agridulce"
  significadoTradicional?: string;
  imagenDataUrl?: string;        // base64 comprimida (opcional)
  _createdAt?: any;
  _updatedAt?: any;
};

type Props = { puebloId: string };

const S = {
  grid: "grid gap-5 sm:grid-cols-2 lg:grid-cols-3",
  card: "bg-white rounded-xl shadow hover:shadow-lg transition-shadow overflow-hidden cursor-pointer",
  img: "h-40 w-full object-cover bg-slate-200",
  body: "p-4",
  titleRow: "flex items-center justify-between",
  title: "font-bold text-slate-900",
  caret: "text-xl leading-none select-none",
  detail: "mt-3 space-y-1 text-sm text-slate-700",
  adminBar: "flex gap-2 flex-wrap",
  actionBtnBase:
    "px-3 py-2 rounded-lg text-white disabled:opacity-60 disabled:cursor-not-allowed",
  btnAdd: "bg-emerald-600 hover:bg-emerald-700",
  btnEdit: "bg-indigo-600 hover:bg-indigo-700",
  btnDel: "bg-rose-600 hover:bg-rose-700",
  btnCancel: "bg-slate-500 hover:bg-slate-600",
  panel: "bg-white border border-slate-200 rounded-xl p-4",
  label: "text-sm font-semibold",
  input: "border rounded-lg px-3 py-2 w-full",
  textarea: "border rounded-lg px-3 py-2 w-full min-h-24",
  select: "border rounded-lg px-3 py-2 w-full",
};

export default function Gastronomia({ puebloId }: Props) {
  const isAdmin = useIsAdmin(); // null | boolean

  const [items, setItems] = useState<GastronomiaItem[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  // modos: ver | agregar | editar-select | editando | eliminar-select
  const [mode, setMode] = useState<
    "ver" | "agregar" | "editar-select" | "editando" | "eliminar-select"
  >("ver");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // estado de formulario
  const [platillo, setPlatillo] = useState("");
  const [origen, setOrigen] = useState("");
  const [tipo, setTipo] = useState<"entrada" | "plato_fuerte" | "postre" | "snack" | "">("");
  const [presentacion, setPresentacion] = useState("");
  const [sabor, setSabor] = useState("");
  const [significadoTradicional, setSignificadoTradicional] = useState("");
  const [imagenDataUrl, setImagenDataUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const colRef = useMemo<CollectionReference>(
    () => collection(db, "pueblosMagicos", puebloId, "gastronomia") as CollectionReference,
    [puebloId]
  );

  useEffect(() => {
    const q = query(colRef, orderBy("_createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as GastronomiaItem) }));
        setItems(rows);
      },
      (e) => {
        console.error(e);
        setErr("No se pudo cargar la gastronomía.");
      }
    );
    return () => unsub();
  }, [colRef]);

  const resetForm = () => {
    setPlatillo("");
    setOrigen("");
    setTipo("");
    setPresentacion("");
    setSabor("");
    setSignificadoTradicional("");
    setImagenDataUrl("");
    setPreviewUrl(null);
    setSelectedId(null);
    setSaving(false);
    setErr(null);
    setMode("ver");
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErr(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErr("El archivo debe ser una imagen.");
      return;
    }
    try {
      const b64 = await fileToCompressedDataURL(file); // ya comprime ~0.7
      if (dataUrlBytes(b64) > MAX_DATAURL_BYTES) {
        setErr("La imagen comprimida supera ~1MB. Usa una más pequeña.");
        return;
      }
      setImagenDataUrl(b64);
      setPreviewUrl(URL.createObjectURL(file));
    } catch (e: any) {
      console.error(e);
      setErr("No se pudo procesar la imagen.");
    }
  };

  // --- acciones admin ---
  const startAdd = () => {
    if (isAdmin !== true) return;
    setMode("agregar");
  };

  const startEditSelect = () => {
    if (isAdmin !== true) return;
    setMode("editar-select");
    setSelectedId(null);
  };

  const startDeleteSelect = () => {
    if (isAdmin !== true) return;
    setMode("eliminar-select");
    setSelectedId(null);
  };

  const startEditById = (id: string) => {
    if (isAdmin !== true) return;
    const it = items.find((x) => x.id === id);
    if (!it) return;
    setSelectedId(id);
    setPlatillo(it.platillo || "");
    setOrigen(it.origen || "");
    setTipo((it.tipo as any) || "");
    setPresentacion(it.presentacion || "");
    setSabor(it.sabor || "");
    setSignificadoTradicional(it.significadoTradicional || "");
    setImagenDataUrl(it.imagenDataUrl || "");
    setPreviewUrl(null);
    setMode("editando");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdmin !== true) return setErr("Solo administradores pueden agregar/editar.");
    if (!platillo.trim()) return setErr("El nombre del platillo es obligatorio.");
    setSaving(true);
    try {
      if (mode === "agregar") {
        await addDoc(colRef, {
          platillo: platillo.trim(),
          origen: origen.trim() || undefined,
          tipo: (tipo || undefined) as GastronomiaItem["tipo"],
          presentacion: presentacion.trim() || undefined,
          sabor: sabor.trim() || undefined,
          significadoTradicional: significadoTradicional.trim() || undefined,
          imagenDataUrl: imagenDataUrl || undefined,
          _createdAt: serverTimestamp(),
          _updatedAt: serverTimestamp(),
        });
      } else if (mode === "editando" && selectedId) {
        await updateDoc(doc(colRef, selectedId), {
          platillo: platillo.trim(),
          origen: origen.trim() || undefined,
          tipo: (tipo || undefined) as GastronomiaItem["tipo"],
          presentacion: presentacion.trim() || undefined,
          sabor: sabor.trim() || undefined,
          significadoTradicional: significadoTradicional.trim() || undefined,
          imagenDataUrl: imagenDataUrl || undefined,
          _updatedAt: serverTimestamp(),
        } as any);
      }
      resetForm();
    } catch (e: any) {
      console.error(e);
      setSaving(false);
      setErr(e?.message || "Error al guardar.");
    }
  };

  const deleteById = async (id: string) => {
    if (isAdmin !== true) return;
    const it = items.find((x) => x.id === id);
    if (!it) return;
    const ok = window.confirm(`¿Eliminar "${it.platillo}"? Esta acción no se puede deshacer.`);
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

  return (
    <div className="grid gap-4">
      {/* Barra admin (solo admins) */}
      {isAdmin ? (
        <div className={S.adminBar}>
          <button onClick={startDeleteSelect} className={`${S.actionBtnBase} ${S.btnDel}`}>🗑 Eliminar (seleccionar card)</button>
          <button onClick={startEditSelect}   className={`${S.actionBtnBase} ${S.btnEdit}`}>✏️ Editar (seleccionar card)</button>
          <button onClick={startAdd}          className={`${S.actionBtnBase} ${S.btnAdd}`}>➕ Agregar</button>
          {mode !== "ver" && (
            <button onClick={resetForm} className={`${S.actionBtnBase} ${S.btnCancel}`}>Cancelar</button>
          )}
        </div>
      ) : null}

      {/* Form agregar/editar */}
      {(mode === "agregar" || mode === "editando") && (
        <form onSubmit={handleSave} className={S.panel}>
          {err && <div className="text-sm text-rose-600 mb-2">{err}</div>}

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={S.label}>Nombre del platillo *</label>
              <input className={S.input} value={platillo} onChange={(e)=>setPlatillo(e.target.value)} placeholder="Ej. Tlatlapas, Barbacoa..." />
            </div>
            <div>
              <label className={S.label}>Origen</label>
              <input className={S.input} value={origen} onChange={(e)=>setOrigen(e.target.value)} placeholder="Huamantla, Tlaxco, Ixtenco…" />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mt-2">
            <div>
              <label className={S.label}>Tipo</label>
              <select className={S.select} value={tipo} onChange={(e)=>setTipo(e.target.value as any)}>
                <option value="">— Selecciona —</option>
                <option value="entrada">Entrada</option>
                <option value="plato_fuerte">Plato fuerte</option>
                <option value="postre">Postre</option>
                <option value="snack">Snack</option>
              </select>
            </div>
            <div>
              <label className={S.label}>Presentación</label>
              <input className={S.input} value={presentacion} onChange={(e)=>setPresentacion(e.target.value)} placeholder="Cazuela, tortilla, plato hondo…" />
            </div>
            <div>
              <label className={S.label}>Sabor</label>
              <input className={S.input} value={sabor} onChange={(e)=>setSabor(e.target.value)} placeholder="Dulce, salado, picante…" />
            </div>
          </div>

          <div className="mt-2">
            <label className={S.label}>Significado tradicional</label>
            <textarea className={S.textarea} value={significadoTradicional} onChange={(e)=>setSignificadoTradicional(e.target.value)} placeholder="Contexto cultural, fechas en que se consume, simbolismo…" />
          </div>

          <div className="mt-2">
            <label className={S.label}>Imagen (opcional)</label>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {previewUrl ? (
              <img src={previewUrl} alt="preview" className="mt-2 w-full max-w-md rounded-lg border" />
            ) : imagenDataUrl ? (
              <img src={imagenDataUrl} alt="preview" className="mt-2 w-full max-w-md rounded-lg border" />
            ) : null}
            <small className="text-slate-500 block mt-1">Se comprime automáticamente (≈1MB máx).</small>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <button
              type="submit"
              disabled={saving}
              className={`${S.actionBtnBase} ${S.btnAdd}`}
            >
              {saving ? "Guardando…" : mode === "agregar" ? "Guardar platillo" : "Actualizar platillo"}
            </button>
            <button type="button" onClick={resetForm} className={`${S.actionBtnBase} ${S.btnCancel}`}>Cancelar</button>
          </div>
        </form>
      )}

      {/* Grid de cards */}
      {items.length === 0 ? (
        <div className="text-slate-500">No hay platillos registrados.</div>
      ) : (
        <div className={S.grid}>
          {items.map((it) => {
            const isOpen = openId === it.id;
            // En modos de selección, dar feedback visual
            const selectRing =
              mode === "editar-select" || mode === "eliminar-select"
                ? "ring-2 ring-offset-2 ring-amber-400"
                : "";
            return (
              <div
                key={it.id}
                className={`${S.card} ${selectRing}`}
                onClick={() => {
                  if (mode === "editar-select" && isAdmin) return startEditById(it.id!);
                  if (mode === "eliminar-select" && isAdmin) return deleteById(it.id!);
                  setOpenId((prev) => (prev === it.id ? null : it.id!));
                }}
                title={
                  mode === "editar-select"
                    ? "Haz click en la card para editar"
                    : mode === "eliminar-select"
                    ? "Haz click en la card para eliminar"
                    : "Ver detalles"
                }
              >
                {/* Imagen */}
                {it.imagenDataUrl ? (
                  <img src={it.imagenDataUrl} alt={it.platillo} className={S.img} />
                ) : (
                  <div className={`${S.img} flex items-center justify-center text-slate-400 text-sm`}>
                    Sin imagen
                  </div>
                )}

                {/* Contenido */}
                <div className={S.body}>
                  <div className={S.titleRow}>
                    <h3 className={S.title}>{it.platillo}</h3>
                    <span className={S.caret}>{isOpen ? "−" : "+"}</span>
                  </div>

                  {isOpen && (
                    <div className={S.detail}>
                      {it.origen && <p><b>Origen:</b> {it.origen}</p>}
                      {it.tipo && (
                        <p>
                          <b>Tipo:</b>{" "}
                          {it.tipo === "plato_fuerte" ? "Plato fuerte" : it.tipo.charAt(0).toUpperCase() + it.tipo.slice(1)}
                        </p>
                      )}
                      {it.presentacion && <p><b>Presentación:</b> {it.presentacion}</p>}
                      {it.sabor && <p><b>Sabor:</b> {it.sabor}</p>}
                      {it.significadoTradicional && (
                        <p><b>Significado tradicional:</b> {it.significadoTradicional}</p>
                      )}
                    </div>
                  )}

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
