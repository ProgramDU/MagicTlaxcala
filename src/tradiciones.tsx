import React, { useEffect, useMemo, useState } from "react";
import { db } from "./firebase";
import {
  collection, onSnapshot, query, orderBy,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from "firebase/firestore";
import { dataUrlBytes, fileToCompressedDataURL, MAX_DATAURL_BYTES } from "./utils/images";

type Tradicion = {
  id?: string;
  titulo: string;
  imagenDataUrl: string; // DataURL en Firestore
  descripcion?: string;
  fecha?: string;
  antecedentes?: string;
  createdAt?: any;
};

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 14,
  } as React.CSSProperties,
  card: (sel: boolean) =>
    ({
      border: sel ? "2px solid #ff0080" : "1px solid #eaeaea",
      borderRadius: 12,
      overflow: "hidden",
      background: "#fff",
      boxShadow: sel ? "0 12px 28px rgba(255,0,128,0.22)" : "0 4px 12px rgba(0,0,0,0.08)",
      transition: "transform .12s ease, box-shadow .12s ease, border .12s ease",
      cursor: "pointer",
    } as React.CSSProperties),
  img: {
    width: "100%", height: 150, objectFit: "cover", display: "block",
  } as React.CSSProperties,
  body: { padding: 12 } as React.CSSProperties,
  row: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 } as React.CSSProperties,
  title: { margin: 0, color: "#d84315", fontWeight: 800, lineHeight: 1.2, fontSize: 16, flex: 1 } as React.CSSProperties,
  caret: { fontSize: 18, transform: "translateY(-1px)" } as React.CSSProperties,
  meta: { color: "#444", margin: "8px 0 0 0", fontSize: 13 } as React.CSSProperties,
  detail: { color: "#333", marginTop: 8, fontSize: 13, lineHeight: 1.35 } as React.CSSProperties,
  input: { width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8, marginBottom: 10 } as React.CSSProperties,
  label: { fontWeight: 700, marginBottom: 6, display: "block" } as React.CSSProperties,
  action: { padding: "10px 16px", border: "none", borderRadius: 8, cursor: "pointer", color: "#fff", fontWeight: 700 } as React.CSSProperties,
};

type Props = { puebloId: string };

export default function Tradiciones({ puebloId }: Props) {
  const [items, setItems] = useState<Tradicion[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [mode, setMode] = useState<"none" | "agregar" | "editar" | "eliminar">("none");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // alta
  const [titulo, setTitulo] = useState("");
  const [fecha, setFecha] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [antecedentes, setAntecedentes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formOk, setFormOk] = useState<string | null>(null);

  // edición
  const [eTitulo, setETitulo] = useState("");
  const [eFecha, setEFecha] = useState("");
  const [eDescripcion, setEDescripcion] = useState("");
  const [eAntecedentes, setEAntecedentes] = useState("");
  const [eFile, setEFile] = useState<File | null>(null);
  const [ePreview, setEPreview] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setErr(null);
    const ref = collection(db, "pueblosMagicos", puebloId, "tradiciones");
    const qy = query(ref, orderBy("titulo"));
    const unsub = onSnapshot(
      qy,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Tradicion[];
        setItems(rows);
        setLoading(false);
      },
      (e) => {
        console.error(e);
        setErr("No se pudieron cargar las tradiciones.");
        setLoading(false);
      }
    );
    return () => unsub();
  }, [puebloId]);

  function enter(m: "agregar" | "editar" | "eliminar") {
    setMode(m);
    setSelectedId(null);
    setFormError(null); setFormOk(null); setSaving(false);
    setTitulo(""); setFecha(""); setDescripcion(""); setAntecedentes(""); setFile(null); setPreview(null);
    setEditSaving(false); setEditError(null); setETitulo(""); setEFecha(""); setEDescripcion(""); setEAntecedentes(""); setEFile(null); setEPreview(null);
  }
  function cancel() { setMode("none"); setSelectedId(null); }
  function onCardClick(t: Tradicion) {
    if (mode === "editar" || mode === "eliminar") {
      setSelectedId((prev) => (prev === t.id ? null : t.id || null));
      if (mode === "editar") {
        setETitulo(t.titulo || "");
        setEFecha(t.fecha || "");
        setEDescripcion(t.descripcion || "");
        setEAntecedentes(t.antecedentes || "");
      }
    }
  }
  function toggleExpand(id?: string) {
    setExpandedId((prev) => (prev === id ? null : id || null));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null); setFormOk(null);
    if (!titulo.trim()) return setFormError("El título es obligatorio.");
    if (!file) return setFormError("Selecciona una imagen válida.");
    if (!file.type.startsWith("image/")) return setFormError("Archivo no es imagen.");

    try {
      setSaving(true);
      const dataUrl = await fileToCompressedDataURL(file);
      const bytes = dataUrlBytes(dataUrl);
      if (bytes > MAX_DATAURL_BYTES) {
        throw new Error(`La imagen comprimida pesa ${(bytes/1024).toFixed(0)} KB; debe ser ≤ ${(MAX_DATAURL_BYTES/1024).toFixed(0)} KB.`);
      }
      await addDoc(collection(db, "pueblosMagicos", puebloId, "tradiciones"), {
        titulo, fecha, descripcion, antecedentes,
        imagenDataUrl: dataUrl,
        createdAt: serverTimestamp(),
      });
      setFormOk("¡Tradición agregada!");
      setTitulo(""); setFecha(""); setDescripcion(""); setAntecedentes(""); setFile(null); setPreview(null);
    } catch (e: any) {
      console.error(e);
      setFormError(e?.message || "No se pudo guardar.");
    } finally { setSaving(false); }
  }

  async function confirmDelete() {
    if (!selectedId) return;
    const it = items.find(x => x.id === selectedId);
    if (!it) return;
    if (!window.confirm(`¿Eliminar "${it.titulo}"?`)) return;
    await deleteDoc(doc(db, "pueblosMagicos", puebloId, "tradiciones", selectedId));
    setSelectedId(null); setMode("none");
  }

  async function saveEdit() {
    if (!selectedId) return;
    try {
      setEditSaving(true);
      const updates: Partial<Tradicion> = {
        titulo: eTitulo, fecha: eFecha, descripcion: eDescripcion, antecedentes: eAntecedentes,
      };
      if (eFile) {
        if (!eFile.type.startsWith("image/")) throw new Error("La nueva imagen no es válida.");
        const dataUrl = await fileToCompressedDataURL(eFile);
        const bytes = dataUrlBytes(dataUrl);
        if (bytes > MAX_DATAURL_BYTES) throw new Error("Imagen demasiado grande tras compresión.");
        updates.imagenDataUrl = dataUrl;
      }
      await updateDoc(doc(db, "pueblosMagicos", puebloId, "tradiciones", selectedId), updates as any);
      setMode("none"); setSelectedId(null);
    } catch (e: any) {
      console.error(e); setEditError(e?.message || "No se pudo guardar.");
    } finally { setEditSaving(false); }
  }

  const banner = useMemo(() => {
    if (mode === "editar") return "Selecciona una card para editarla.";
    if (mode === "eliminar") return "Selecciona una card para eliminarla.";
    return null;
  }, [mode]);

  return (
    <div>
      {loading && <p>Cargando tradiciones...</p>}
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      {!loading && !err && (
        <>
          {banner && <div style={{ background:"#fff3cd", padding:10, borderRadius:8, marginBottom:10, border:"1px solid #ffeeba" }}>{banner}</div>}

          <div style={styles.grid}>
            {items.map((t) => {
              const selected = t.id === selectedId;
              const expanded = t.id === expandedId;
              return (
                <div key={t.id} style={styles.card(selected)} onClick={() => onCardClick(t)}>
                  <img src={t.imagenDataUrl} alt={t.titulo} style={styles.img} />
                  <div style={styles.body}>
                    <div style={styles.row}>
                      <h3
                        style={styles.title}
                        onClick={(e) => { e.stopPropagation(); toggleExpand(t.id); }}
                        title="Mostrar/ocultar detalles"
                      >
                        {t.titulo}
                      </h3>
                      <span style={styles.caret}>{expanded ? "▾" : "▸"}</span>
                    </div>
                    {t.fecha && <p style={styles.meta}><strong>Fecha:</strong> {t.fecha}</p>}
                    {expanded && (
                      <div style={styles.detail}>
                        {t.descripcion && <p><strong>Descripción:</strong> {t.descripcion}</p>}
                        {t.antecedentes && <p><strong>Antecedentes:</strong> {t.antecedentes}</p>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Acciones */}
          <div style={{ display:"flex", gap:12, marginTop:18, flexWrap:"wrap" }}>
            <button onClick={() => enter("eliminar")} style={{ ...styles.action, background:"linear-gradient(45deg,#ff512f,#dd2476)" }}>🗑 Eliminar</button>
            <button onClick={() => enter("editar")}   style={{ ...styles.action, background:"linear-gradient(90deg,#2193b0,#6dd5ed)" }}>✏️ Editar</button>
            <button onClick={() => enter("agregar")}  style={{ ...styles.action, background:"linear-gradient(90deg,#ff8c00,#ff0080)" }}>➕ Agregar</button>
            {mode !== "none" && <button onClick={cancel} style={{ ...styles.action, background:"#888" }}>Cancelar</button>}
          </div>

          {/* Panel inferior según modo */}
          <div style={{ marginTop:18 }}>
            {mode === "eliminar" && (
              <div style={{ background:"#fff", border:"1px solid #eee", borderRadius:12, padding:16 }}>
                <h4 style={{ marginTop:0 }}>Eliminar tradición</h4>
                {selectedId ? (
                  <button onClick={confirmDelete} style={{ ...styles.action, background:"linear-gradient(45deg,#ff512f,#dd2476)" }}>
                    Confirmar eliminación
                  </button>
                ) : <p>Selecciona una card para eliminarla.</p>}
              </div>
            )}

            {mode === "editar" && (
              <div style={{ background:"#fff", border:"1px solid #eee", borderRadius:12, padding:16 }}>
                <h4 style={{ marginTop:0 }}>Editar tradición</h4>
                {selectedId ? (
                  <>
                    <label style={styles.label}>Título</label>
                    <input style={styles.input} value={eTitulo} onChange={(e)=>setETitulo(e.target.value)} />
                    <label style={styles.label}>Fecha</label>
                    <input style={styles.input} value={eFecha} onChange={(e)=>setEFecha(e.target.value)} />
                    <label style={styles.label}>Descripción</label>
                    <textarea style={{ ...styles.input, minHeight:90 }} value={eDescripcion} onChange={(e)=>setEDescripcion(e.target.value)} />
                    <label style={styles.label}>Antecedentes</label>
                    <textarea style={{ ...styles.input, minHeight:90 }} value={eAntecedentes} onChange={(e)=>setEAntecedentes(e.target.value)} />
                    <label style={styles.label}>Cambiar imagen (opcional)</label>
                    <input type="file" accept="image/*" onChange={(e)=>{ const f=e.target.files?.[0]||null; setEFile(f); setEPreview(f?URL.createObjectURL(f):null); }} />
                    {ePreview && <img src={ePreview} style={{ width:"100%", maxHeight:200, objectFit:"cover", borderRadius:8, marginTop:8 }} />}
                    {editError && <p style={{ color:"crimson" }}>{editError}</p>}
                    <div style={{ display:"flex", gap:8, marginTop:8 }}>
                      <button onClick={saveEdit} disabled={editSaving} style={{ ...styles.action, background:"linear-gradient(90deg,#00b09b,#96c93d)", opacity: editSaving?0.7:1 }}>
                        {editSaving? "Guardando..." : "Guardar cambios"}
                      </button>
                      <button onClick={cancel} style={{ ...styles.action, background:"#888" }}>Cancelar</button>
                    </div>
                  </>
                ) : <p>Selecciona una card para editarla.</p>}
              </div>
            )}

            {mode === "agregar" && (
              <div style={{ background:"#fff", border:"1px solid #eee", borderRadius:12, padding:16 }}>
                <h4 style={{ marginTop:0 }}>Agregar tradición</h4>
                <form onSubmit={handleCreate}>
                  <label style={styles.label}>Título *</label>
                  <input style={styles.input} value={titulo} onChange={(e)=>setTitulo(e.target.value)} placeholder="La Noche que Nadie Duerme" />
                  <label style={styles.label}>Fecha</label>
                  <input style={styles.input} value={fecha} onChange={(e)=>setFecha(e.target.value)} placeholder="14 de agosto" />
                  <label style={styles.label}>Imagen *</label>
                  <input type="file" accept="image/*" onChange={(e)=>{ const f=e.target.files?.[0]||null; setFile(f); setPreview(f?URL.createObjectURL(f):null); }} />
                  {preview && <img src={preview} style={{ width:"100%", maxHeight:220, objectFit:"cover", borderRadius:8, marginTop:8 }} />}
                  <label style={styles.label}>Descripción</label>
                  <textarea style={{ ...styles.input, minHeight:90 }} value={descripcion} onChange={(e)=>setDescripcion(e.target.value)} />
                  <label style={styles.label}>Antecedentes</label>
                  <textarea style={{ ...styles.input, minHeight:90 }} value={antecedentes} onChange={(e)=>setAntecedentes(e.target.value)} />

                  {formError && <p style={{ color:"crimson" }}>{formError}</p>}
                  {formOk && <p style={{ color:"green" }}>{formOk}</p>}
                  <div style={{ display:"flex", gap:8, marginTop:8 }}>
                    <button type="submit" disabled={saving} style={{ ...styles.action, background:"linear-gradient(90deg,#ff8c00,#ff0080)", opacity: saving?0.7:1 }}>
                      {saving? "Guardando..." : "Guardar"}
                    </button>
                    <button type="button" onClick={cancel} style={{ ...styles.action, background:"#888" }}>Cancelar</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
