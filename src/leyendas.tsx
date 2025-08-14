import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  collection, onSnapshot, query, orderBy,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from "firebase/firestore";
import { dataUrlBytes, fileToCompressedDataURL, MAX_DATAURL_BYTES } from "./utils/images";

type Leyenda = {
  id?: string;
  titulo: string;
  descripcion?: string;   // relato / sinopsis
  fuente?: string;        // opcional
  imagenDataUrl?: string; // opcional
  createdAt?: any;
};

const C = {
  grid: { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:14 } as React.CSSProperties,
  card: (sel: boolean) =>
    ({ border: sel?"2px solid #7b1fa2":"1px solid #eaeaea", borderRadius:12, overflow:"hidden", background:"#fff",
      boxShadow: sel?"0 12px 28px rgba(123,31,162,0.22)":"0 4px 12px rgba(0,0,0,0.08)", transition:"all .12s ease", cursor:"pointer" } as React.CSSProperties),
  img: { width:"100%", height:150, objectFit:"cover", display:"block" } as React.CSSProperties,
  body: { padding:12 } as React.CSSProperties,
  row: { display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 } as React.CSSProperties,
  title: { margin:0, color:"#6a1b9a", fontWeight:800, fontSize:16, flex:1 } as React.CSSProperties,
  caret: { fontSize:18 } as React.CSSProperties,
  meta: { color:"#444", margin:"8px 0 0 0", fontSize:13 } as React.CSSProperties,
  detail: { color:"#333", marginTop:8, fontSize:13, lineHeight:1.35 } as React.CSSProperties,
  input: { width:"100%", padding:10, border:"1px solid #ddd", borderRadius:8, marginBottom:10 } as React.CSSProperties,
  label: { fontWeight:700, marginBottom:6, display:"block" } as React.CSSProperties,
  action: { padding:"10px 16px", border:"none", borderRadius:8, cursor:"pointer", color:"#fff", fontWeight:700 } as React.CSSProperties,
};

type Props = { puebloId: string };

export default function Leyendas({ puebloId }: Props) {
  const [items, setItems] = useState<Leyenda[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [mode, setMode] = useState<"none" | "agregar" | "editar" | "eliminar">("none");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // alta
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fuente, setFuente] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // edición
  const [eTitulo, setETitulo] = useState("");
  const [eDescripcion, setEDescripcion] = useState("");
  const [eFuente, setEFuente] = useState("");
  const [eFile, setEFile] = useState<File | null>(null);
  const [ePreview, setEPreview] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true); setErr(null);
    const ref = collection(db, "pueblosMagicos", puebloId, "leyendas");
    const qy = query(ref, orderBy("titulo"));
    const unsub = onSnapshot(
      qy,
      (snap) => {
        const rows = snap.docs.map((d)=>({ id:d.id, ...(d.data() as any) })) as Leyenda[];
        setItems(rows); setLoading(false);
      },
      (e)=>{ console.error(e); setErr("No se pudieron cargar las leyendas."); setLoading(false); }
    );
    return () => unsub();
  }, [puebloId]);

  function enter(m:"none"|"agregar"|"editar"|"eliminar"){
      setMode(m); setSelectedId(null);
      setTitulo(""); setDescripcion(""); setFuente(""); setFile(null); setPreview(null);
      setETitulo(""); setEDescripcion(""); setEFuente(""); setEFile(null); setEPreview(null);
    }
  function cancel(){ setMode("none"); setSelectedId(null); }
  function onCardClick(l: Leyenda){
    if (mode==="editar" || mode==="eliminar"){
      setSelectedId(prev=>prev===l.id?null:l.id||null);
      if (mode==="editar"){
        setETitulo(l.titulo || "");
        setEDescripcion(l.descripcion || "");
        setEFuente(l.fuente || "");
      }
    }
  }
  function toggleExpand(id?: string){ setExpandedId(prev=>prev===id?null:id||null); }

  async function handleCreate(e:React.FormEvent){
    e.preventDefault();
    if (!titulo.trim()) return alert("El título es obligatorio.");
    let dataUrl: string | undefined;
    if (file){
      if (!file.type.startsWith("image/")) return alert("El archivo debe ser imagen.");
      dataUrl = await fileToCompressedDataURL(file);
      if (dataUrlBytes(dataUrl) > MAX_DATAURL_BYTES) return alert("Imagen demasiado grande tras compresión.");
    }
    await addDoc(collection(db,"pueblosMagicos",puebloId,"leyendas"),{
      titulo, descripcion, fuente, ...(dataUrl?{imagenDataUrl:dataUrl}:{ }), createdAt: serverTimestamp(),
    });
    enter("none");
  }

  async function confirmDelete(){
    if(!selectedId) return;
    await deleteDoc(doc(db,"pueblosMagicos",puebloId,"leyendas",selectedId));
    enter("none");
  }

  async function saveEdit(){
    if(!selectedId) return;
    const updates: Partial<Leyenda> = { titulo:eTitulo, descripcion:eDescripcion, fuente:eFuente };
    if (eFile){
      if (!eFile.type.startsWith("image/")) return alert("La nueva imagen no es válida.");
      const dataUrl = await fileToCompressedDataURL(eFile);
      if (dataUrlBytes(dataUrl) > MAX_DATAURL_BYTES) return alert("Imagen demasiado grande tras compresión.");
      updates.imagenDataUrl = dataUrl;
    }
    await updateDoc(doc(db,"pueblosMagicos",puebloId,"leyendas",selectedId), updates as any);
    enter("none");
  }

  return (
    <div>
      {loading && <p>Cargando leyendas...</p>}
      {err && <p style={{ color:"crimson" }}>{err}</p>}

      {!loading && !err && (
        <>
          {(mode==="editar"||mode==="eliminar") && (
            <div style={{ background:"#e0d7ff", padding:10, borderRadius:8, marginBottom:10, border:"1px solid #c6b7ff" }}>
              {mode==="editar" ? "Selecciona una card para editarla." : "Selecciona una card para eliminarla."}
            </div>
          )}

          <div style={C.grid}>
            {items.map(l=>{
              const sel = l.id===selectedId, exp = l.id===expandedId;
              return (
                <div key={l.id} style={C.card(sel)} onClick={()=>onCardClick(l)}>
                  {l.imagenDataUrl && <img src={l.imagenDataUrl} alt={l.titulo} style={C.img} />}
                  <div style={C.body}>
                    <div style={C.row}>
                      <h3 style={C.title} onClick={(e)=>{ e.stopPropagation(); toggleExpand(l.id); }}>
                        {l.titulo}
                      </h3>
                      <span style={C.caret}>{exp ? "▾" : "▸"}</span>
                    </div>
                    {exp && (
                      <div style={C.detail}>
                        {l.descripcion && <p><strong>Relato:</strong> {l.descripcion}</p>}
                        {l.fuente && <p><strong>Fuente:</strong> {l.fuente}</p>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display:"flex", gap:12, marginTop:18, flexWrap:"wrap" }}>
            <button onClick={()=>enter("eliminar")} style={{ ...C.action, background:"linear-gradient(45deg,#ff512f,#dd2476)" }}>🗑 Eliminar</button>
            <button onClick={()=>enter("editar")}   style={{ ...C.action, background:"linear-gradient(90deg,#2193b0,#6dd5ed)" }}>✏️ Editar</button>
            <button onClick={()=>enter("agregar")}  style={{ ...C.action, background:"linear-gradient(90deg,#7b1fa2,#ab47bc)" }}>➕ Agregar</button>
            {mode!=="none" && <button onClick={cancel} style={{ ...C.action, background:"#888" }}>Cancelar</button>}
          </div>

          <div style={{ marginTop:18 }}>
            {mode==="eliminar" && (
              <div style={{ background:"#fff", border:"1px solid #eee", borderRadius:12, padding:16 }}>
                <h4 style={{ marginTop:0 }}>Eliminar leyenda</h4>
                {selectedId
                  ? <button onClick={confirmDelete} style={{ ...C.action, background:"linear-gradient(45deg,#ff512f,#dd2476)" }}>Confirmar eliminación</button>
                  : <p>Selecciona una card para eliminarla.</p>}
              </div>
            )}

            {mode==="editar" && (
              <div style={{ background:"#fff", border:"1px solid #eee", borderRadius:12, padding:16 }}>
                <h4 style={{ marginTop:0 }}>Editar leyenda</h4>
                {selectedId ? (
                  <>
                    <label style={C.label}>Título *</label>
                    <input style={C.input} value={eTitulo} onChange={(e)=>setETitulo(e.target.value)} />
                    <label style={C.label}>Relato / descripción</label>
                    <textarea style={{ ...C.input, minHeight:90 }} value={eDescripcion} onChange={(e)=>setEDescripcion(e.target.value)} />
                    <label style={C.label}>Fuente (opcional)</label>
                    <input style={C.input} value={eFuente} onChange={(e)=>setEFuente(e.target.value)} />
                    <label style={C.label}>Cambiar imagen (opcional)</label>
                    <input type="file" accept="image/*" onChange={(e)=>{ const f=e.target.files?.[0]||null; setEFile(f); setEPreview(f?URL.createObjectURL(f):null); }} />
                    {ePreview && <img src={ePreview} style={{ width:"100%", maxHeight:200, objectFit:"cover", borderRadius:8, marginTop:8 }} />}
                    <div style={{ display:"flex", gap:8, marginTop:8 }}>
                      <button onClick={saveEdit} style={{ ...C.action, background:"linear-gradient(90deg,#00b09b,#96c93d)" }}>Guardar cambios</button>
                      <button onClick={cancel} style={{ ...C.action, background:"#888" }}>Cancelar</button>
                    </div>
                  </>
                ) : <p>Selecciona una card para editarla.</p>}
              </div>
            )}

            {mode==="agregar" && (
              <div style={{ background:"#fff", border:"1px solid #eee", borderRadius:12, padding:16 }}>
                <h4 style={{ marginTop:0 }}>Agregar leyenda</h4>
                <form onSubmit={handleCreate}>
                  <label style={C.label}>Título *</label>
                  <input style={C.input} value={titulo} onChange={(e)=>setTitulo(e.target.value)} />
                  <label style={C.label}>Relato / descripción</label>
                  <textarea style={{ ...C.input, minHeight:90 }} value={descripcion} onChange={(e)=>setDescripcion(e.target.value)} />
                  <label style={C.label}>Fuente (opcional)</label>
                  <input style={C.input} value={fuente} onChange={(e)=>setFuente(e.target.value)} />
                  <label style={C.label}>Imagen (opcional)</label>
                  <input type="file" accept="image/*" onChange={(e)=>{ const f=e.target.files?.[0]||null; setFile(f); setPreview(f?URL.createObjectURL(f):null); }} />
                  {preview && <img src={preview} style={{ width:"100%", maxHeight:220, objectFit:"cover", borderRadius:8, marginTop:8 }} />}

                  <div style={{ display:"flex", gap:8, marginTop:8 }}>
                    <button type="submit" style={{ ...C.action, background:"linear-gradient(90deg,#7b1fa2,#ab47bc)" }}>Guardar</button>
                    <button type="button" onClick={cancel} style={{ ...C.action, background:"#888" }}>Cancelar</button>
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
