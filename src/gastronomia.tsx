import React, { useEffect, useMemo, useState } from "react";
import { db } from "./firebase";
import {
  collection, onSnapshot, query, orderBy,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from "firebase/firestore";
import { dataUrlBytes, fileToCompressedDataURL, MAX_DATAURL_BYTES } from "./utils/images";

type Platillo = {
  id?: string;
  nombre: string;
  tipo: "entrada" | "plato_fuerte" | "postre" | "snack";
  origen?: string;
  presentacion?: string;
  sabor?: string;
  significadoTradicional?: string;
  imagenDataUrl?: string;
  createdAt?: any;
  updatedAt?: any;
};

const S = {
  grid: { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:14 } as React.CSSProperties,
  card: (sel: boolean) =>
    ({ border: sel?"2px solid #ff0080":"1px solid #eaeaea", borderRadius:12, overflow:"hidden", background:"#fff",
      boxShadow: sel?"0 12px 28px rgba(255,0,128,0.22)":"0 4px 12px rgba(0,0,0,0.08)", transition:"all .12s ease", cursor:"pointer" } as React.CSSProperties),
  img: { width:"100%", height:150, objectFit:"cover", display:"block" } as React.CSSProperties,
  body: { padding:12 } as React.CSSProperties,
  row: { display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 } as React.CSSProperties,
  title: { margin:0, color:"#2e7d32", fontWeight:800, fontSize:16, flex:1 } as React.CSSProperties,
  caret: { fontSize:18 } as React.CSSProperties,
  meta: { color:"#444", margin:"8px 0 0 0", fontSize:13 } as React.CSSProperties,
  detail: { color:"#333", marginTop:8, fontSize:13, lineHeight:1.35 } as React.CSSProperties,
  input: { width:"100%", padding:10, border:"1px solid #ddd", borderRadius:8, marginBottom:10 } as React.CSSProperties,
  label: { fontWeight:700, marginBottom:6, display:"block" } as React.CSSProperties,
  action: { padding:"10px 16px", border:"none", borderRadius:8, cursor:"pointer", color:"#fff", fontWeight:700 } as React.CSSProperties,
};

type Props = { puebloId: string };

export default function Gastronomia({ puebloId }: Props) {
  const [items, setItems] = useState<Platillo[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [mode, setMode] = useState<"none" | "agregar" | "editar" | "eliminar">("none");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // alta
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<Platillo["tipo"]>("entrada");
  const [origen, setOrigen] = useState("");
  const [presentacion, setPresentacion] = useState("");
  const [sabor, setSabor] = useState("");
  const [significado, setSignificado] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formOk, setFormOk] = useState<string | null>(null);

  // edición
  const [eNombre, setENombre] = useState("");
  const [eTipo, setETipo] = useState<Platillo["tipo"]>("entrada");
  const [eOrigen, setEOrigen] = useState("");
  const [ePresentacion, setEPresentacion] = useState("");
  const [eSabor, setESabor] = useState("");
  const [eSignificado, setESignificado] = useState("");
  const [eFile, setEFile] = useState<File | null>(null);
  const [ePreview, setEPreview] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setErr(null);
    const ref = collection(db, "pueblosMagicos", puebloId, "gastronomia");
    const qy = query(ref, orderBy("nombre"));
    const unsub = onSnapshot(
      qy,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Platillo[];
        setItems(rows);
        setLoading(false);
      },
      (e) => { console.error(e); setErr("No se pudo cargar gastronomía."); setLoading(false); }
    );
    return () => unsub();
  }, [puebloId]);

  function enter(m: "agregar" | "editar" | "eliminar") {
    setMode(m); setSelectedId(null);
    setFormError(null); setFormOk(null); setSaving(false);
    setNombre(""); setTipo("entrada"); setOrigen(""); setPresentacion(""); setSabor(""); setSignificado(""); setFile(null); setPreview(null);
    setEditSaving(false); setEditError(null);
    setENombre(""); setETipo("entrada"); setEOrigen(""); setEPresentacion(""); setESabor(""); setESignificado("");
    setEFile(null); setEPreview(null);
  }
  function cancel(){ setMode("none"); setSelectedId(null); }
  function onCardClick(p: Platillo){
    if (mode === "editar" || mode === "eliminar") {
      setSelectedId(prev => prev === p.id ? null : p.id || null);
      if (mode === "editar") {
        setENombre(p.nombre || "");
        setETipo(p.tipo || "entrada");
        setEOrigen(p.origen || "");
        setEPresentacion(p.presentacion || "");
        setESabor(p.sabor || "");
        setESignificado(p.significadoTradicional || "");
      }
    }
  }
  function toggleExpand(id?: string) {
    setExpandedId(prev => prev === id ? null : id || null);
  }

  async function handleCreate(e: React.FormEvent){
    e.preventDefault();
    setFormError(null); setFormOk(null);
    if (!nombre.trim()) return setFormError("El nombre es obligatorio.");

    try {
      setSaving(true);
      let dataUrl: string | undefined;
      if (file) {
        if (!file.type.startsWith("image/")) throw new Error("El archivo debe ser imagen.");
        dataUrl = await fileToCompressedDataURL(file);
        const bytes = dataUrlBytes(dataUrl);
        if (bytes > MAX_DATAURL_BYTES) throw new Error("Imagen demasiado grande tras compresión.");
      }
      await addDoc(collection(db, "pueblosMagicos", puebloId, "gastronomia"), {
        nombre, tipo, origen, presentacion, sabor,
        significadoTradicional: significado,
        ...(dataUrl ? { imagenDataUrl: dataUrl } : {}),
        createdAt: serverTimestamp(),
      });
      setFormOk("¡Platillo agregado!");
      setNombre(""); setTipo("entrada"); setOrigen(""); setPresentacion(""); setSabor(""); setSignificado(""); setFile(null); setPreview(null);
    } catch (e:any) { console.error(e); setFormError(e?.message || "No se pudo guardar."); }
    finally { setSaving(false); }
  }

  async function confirmDelete(){
    if(!selectedId) return;
    const it = items.find(x=>x.id===selectedId);
    if(!it) return;
    if(!window.confirm(`¿Eliminar "${it.nombre}"?`)) return;
    await deleteDoc(doc(db, "pueblosMagicos", puebloId, "gastronomia", selectedId));
    setSelectedId(null); setMode("none");
  }

  async function saveEdit(){
    if(!selectedId) return;
    try {
      setEditSaving(true);
      const updates: Partial<Platillo> = {
        nombre: eNombre, tipo: eTipo, origen: eOrigen, presentacion: ePresentacion,
        sabor: eSabor, significadoTradicional: eSignificado, updatedAt: serverTimestamp(),
      };
      if (eFile) {
        if(!eFile.type.startsWith("image/")) throw new Error("La nueva imagen no es válida.");
        const dataUrl = await fileToCompressedDataURL(eFile);
        const bytes = dataUrlBytes(dataUrl);
        if(bytes > MAX_DATAURL_BYTES) throw new Error("Imagen demasiado grande tras compresión.");
        updates.imagenDataUrl = dataUrl;
      }
      await updateDoc(doc(db,"pueblosMagicos",puebloId,"gastronomia",selectedId), updates as any);
      setMode("none"); setSelectedId(null);
    } catch(e:any){ console.error(e); setEditError(e?.message || "No se pudo guardar."); }
    finally { setEditSaving(false); }
  }

  const banner = useMemo(() => {
    if (mode === "editar") return "Selecciona una card para editarla.";
    if (mode === "eliminar") return "Selecciona una card para eliminarla.";
    return null;
  }, [mode]);

  return (
    <div>
      {loading && <p>Cargando gastronomía...</p>}
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      {!loading && !err && (
        <>
          {banner && <div style={{ background:"#fff3cd", padding:10, borderRadius:8, marginBottom:10, border:"1px solid #ffeeba" }}>{banner}</div>}

          <div style={S.grid}>
            {items.map((p) => {
              const sel = p.id === selectedId;
              const exp = p.id === expandedId;
              return (
                <div key={p.id} style={S.card(sel)} onClick={() => onCardClick(p)}>
                  {p.imagenDataUrl && <img src={p.imagenDataUrl} alt={p.nombre} style={S.img} />}
                  <div style={S.body}>
                    <div style={S.row}>
                      <h3
                        style={S.title}
                        onClick={(e)=>{ e.stopPropagation(); toggleExpand(p.id); }}
                        title="Mostrar/ocultar detalles"
                      >
                        {p.nombre}
                      </h3>
                      <span style={S.caret}>{exp ? "▾" : "▸"}</span>
                    </div>
                    <p style={S.meta}><strong>Tipo:</strong> {p.tipo.replace("_"," ")}</p>
                    {exp && (
                      <div style={S.detail}>
                        {p.origen && <p><strong>Origen:</strong> {p.origen}</p>}
                        {p.presentacion && <p><strong>Presentación:</strong> {p.presentacion}</p>}
                        {p.sabor && <p><strong>Sabor:</strong> {p.sabor}</p>}
                        {p.significadoTradicional && <p><strong>Significado tradicional:</strong> {p.significadoTradicional}</p>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display:"flex", gap:12, marginTop:18, flexWrap:"wrap" }}>
            <button onClick={() => enter("eliminar")} style={{ ...S.action, background:"linear-gradient(45deg,#ff512f,#dd2476)" }}>🗑 Eliminar</button>
            <button onClick={() => enter("editar")}   style={{ ...S.action, background:"linear-gradient(90deg,#2193b0,#6dd5ed)" }}>✏️ Editar</button>
            <button onClick={() => enter("agregar")}  style={{ ...S.action, background:"linear-gradient(90deg,#ff8c00,#ff0080)" }}>➕ Agregar</button>
            {mode !== "none" && <button onClick={cancel} style={{ ...S.action, background:"#888" }}>Cancelar</button>}
          </div>

          <div style={{ marginTop:18 }}>
            {mode === "eliminar" && (
              <div style={{ background:"#fff", border:"1px solid #eee", borderRadius:12, padding:16 }}>
                <h4 style={{ marginTop:0 }}>Eliminar platillo</h4>
                {selectedId ? (
                  <button onClick={confirmDelete} style={{ ...S.action, background:"linear-gradient(45deg,#ff512f,#dd2476)" }}>
                    Confirmar eliminación
                  </button>
                ) : <p>Selecciona una card para eliminarla.</p>}
              </div>
            )}

            {mode === "editar" && (
              <div style={{ background:"#fff", border:"1px solid #eee", borderRadius:12, padding:16 }}>
                <h4 style={{ marginTop:0 }}>Editar platillo</h4>
                {selectedId ? (
                  <>
                    <label style={S.label}>Nombre *</label>
                    <input style={S.input} value={eNombre} onChange={(e)=>setENombre(e.target.value)} />
                    <label style={S.label}>Tipo *</label>
                    <select style={S.input} value={eTipo} onChange={(e)=>setETipo(e.target.value as Platillo["tipo"])}>
                      <option value="entrada">Entrada</option>
                      <option value="plato_fuerte">Plato fuerte</option>
                      <option value="postre">Postre</option>
                      <option value="snack">Snack</option>
                    </select>
                    <label style={S.label}>Origen</label>
                    <input style={S.input} value={eOrigen} onChange={(e)=>setEOrigen(e.target.value)} />
                    <label style={S.label}>Presentación</label>
                    <input style={S.input} value={ePresentacion} onChange={(e)=>setEPresentacion(e.target.value)} />
                    <label style={S.label}>Sabor</label>
                    <input style={S.input} value={eSabor} onChange={(e)=>setESabor(e.target.value)} />
                    <label style={S.label}>Significado tradicional</label>
                    <textarea style={{ ...S.input, minHeight:90 }} value={eSignificado} onChange={(e)=>setESignificado(e.target.value)} />
                    <label style={S.label}>Cambiar imagen (opcional)</label>
                    <input type="file" accept="image/*" onChange={(e)=>{ const f=e.target.files?.[0]||null; setEFile(f); setEPreview(f?URL.createObjectURL(f):null); }} />
                    {ePreview && <img src={ePreview} style={{ width:"100%", maxHeight:200, objectFit:"cover", borderRadius:8, marginTop:8 }} />}
                    {editError && <p style={{ color:"crimson" }}>{editError}</p>}
                    <div style={{ display:"flex", gap:8, marginTop:8 }}>
                      <button onClick={saveEdit} disabled={editSaving} style={{ ...S.action, background:"linear-gradient(90deg,#00b09b,#96c93d)", opacity: editSaving?0.7:1 }}>
                        {editSaving ? "Guardando..." : "Guardar cambios"}
                      </button>
                      <button onClick={cancel} style={{ ...S.action, background:"#888" }}>Cancelar</button>
                    </div>
                  </>
                ) : <p>Selecciona una card para editarla.</p>}
              </div>
            )}

            {mode === "agregar" && (
              <div style={{ background:"#fff", border:"1px solid #eee", borderRadius:12, padding:16 }}>
                <h4 style={{ marginTop:0 }}>Agregar platillo</h4>
                <form onSubmit={handleCreate}>
                  <label style={S.label}>Nombre *</label>
                  <input style={S.input} value={nombre} onChange={(e)=>setNombre(e.target.value)} placeholder="Tamal de frijol" />
                  <label style={S.label}>Tipo *</label>
                  <select style={S.input} value={tipo} onChange={(e)=>setTipo(e.target.value as Platillo["tipo"])}>
                    <option value="entrada">Entrada</option>
                    <option value="plato_fuerte">Plato fuerte</option>
                    <option value="postre">Postre</option>
                    <option value="snack">Snack</option>
                  </select>
                  <label style={S.label}>Imagen (opcional)</label>
                  <input type="file" accept="image/*" onChange={(e)=>{ const f=e.target.files?.[0]||null; setFile(f); setPreview(f?URL.createObjectURL(f):null); }} />
                  {preview && <img src={preview} style={{ width:"100%", maxHeight:220, objectFit:"cover", borderRadius:8, marginTop:8 }} />}

                  <label style={S.label}>Origen</label>
                  <input style={S.input} value={origen} onChange={(e)=>setOrigen(e.target.value)} />
                  <label style={S.label}>Presentación</label>
                  <input style={S.input} value={presentacion} onChange={(e)=>setPresentacion(e.target.value)} />
                  <label style={S.label}>Sabor</label>
                  <input style={S.input} value={sabor} onChange={(e)=>setSabor(e.target.value)} />
                  <label style={S.label}>Significado tradicional</label>
                  <textarea style={{ ...S.input, minHeight:90 }} value={significado} onChange={(e)=>setSignificado(e.target.value)} />

                  {formError && <p style={{ color:"crimson" }}>{formError}</p>}
                  {formOk && <p style={{ color:"green" }}>{formOk}</p>}
                  <div style={{ display:"flex", gap:8, marginTop:8 }}>
                    <button type="submit" disabled={saving} style={{ ...S.action, background:"linear-gradient(90deg,#ff8c00,#ff0080)", opacity: saving?0.7:1 }}>
                      {saving ? "Guardando..." : "Guardar"}
                    </button>
                    <button type="button" onClick={cancel} style={{ ...S.action, background:"#888" }}>Cancelar</button>
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
