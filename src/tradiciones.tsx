import React, { useEffect, useState } from "react";
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from "firebase/firestore";
import { db } from "./firebase";
import AdminOnly from "./components/AdminOnly";

type Tradicion = {
  id?: string;
  titulo: string;
  fecha?: string;            // ej: 15 de agosto
  antecedentes?: string;     // historia / contexto
  descripcion?: string;      // detalle
  imagenDataUrl?: string;    // base64 opcional
  createdAt?: any;
};

type Props = { puebloId: string };

const MAX_W = 800;
const MAX_BYTES = 1_048_576; // 1MB

async function fileToBase64Compressed(file: File): Promise<string> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = rej;
      im.src = fr.result as string;
    };
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
  const scale = Math.min(1, MAX_W / img.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.72);
  // tamaño aproximado bytes de dataURL
  const bytes = Math.ceil((dataUrl.length * 3) / 4);
  if (bytes > MAX_BYTES) throw new Error("Imagen demasiado grande tras compresión.");
  return dataUrl;
}

export default function Tradiciones({ puebloId }: Props) {
  const [items, setItems] = useState<Tradicion[]>([]);
  const [mode, setMode] = useState<"none" | "agregar" | "editar" | "eliminar">("none");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // form agregar
  const [tTitulo, setTTitulo] = useState("");
  const [tFecha, setTFecha] = useState("");
  const [tAntecedentes, setTAntecedentes] = useState("");
  const [tDescripcion, setTDescripcion] = useState("");
  const [tFile, setTFile] = useState<File | null>(null);
  const [tPreview, setTPreview] = useState<string | null>(null);

  // form editar
  const [eTitulo, setETitulo] = useState("");
  const [eFecha, setEFecha] = useState("");
  const [eAntecedentes, setEAntecedentes] = useState("");
  const [eDescripcion, setEDescripcion] = useState("");
  const [eFile, setEFile] = useState<File | null>(null);
  const [ePreview, setEPreview] = useState<string | null>(null);

  useEffect(() => {
    const ref = collection(db, "pueblosMagicos", puebloId, "tradiciones");
    const q = query(ref, orderBy("titulo"));
    const unsub = onSnapshot(q, snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Tradicion[]);
    });
    return () => unsub();
  }, [puebloId]);

  function resetUI() {
    setMode("none");
    setSelectedId(null);
    setExpandedId(null);
    setTTitulo(""); setTFecha(""); setTAntecedentes(""); setTDescripcion(""); setTFile(null); setTPreview(null);
    setETitulo(""); setEFecha(""); setEAntecedentes(""); setEDescripcion(""); setEFile(null); setEPreview(null);
  }

  function onCardClick(it: Tradicion) {
    if (mode === "editar" || mode === "eliminar") {
      setSelectedId(prev => prev === it.id ? null : it.id || null);
      if (mode === "editar") {
        setETitulo(it.titulo || "");
        setEFecha(it.fecha || "");
        setEAntecedentes(it.antecedentes || "");
        setEDescripcion(it.descripcion || "");
        setEPreview(it.imagenDataUrl || null);
      }
    }
  }

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!tTitulo.trim()) return alert("El título es obligatorio.");
    let dataUrl: string | undefined;
    if (tFile) dataUrl = await fileToBase64Compressed(tFile);
    await addDoc(collection(db, "pueblosMagicos", puebloId, "tradiciones"), {
      titulo: tTitulo,
      fecha: tFecha,
      antecedentes: tAntecedentes,
      descripcion: tDescripcion,
      imagenDataUrl: dataUrl,
      createdAt: serverTimestamp(),
    });
    resetUI();
  }

  async function guardarEdicion() {
    if (!selectedId) return;
    const updates: Partial<Tradicion> = {
      titulo: eTitulo, fecha: eFecha, antecedentes: eAntecedentes, descripcion: eDescripcion
    };
    if (eFile) updates.imagenDataUrl = await fileToBase64Compressed(eFile);
    await updateDoc(doc(db, "pueblosMagicos", puebloId, "tradiciones", selectedId), updates as any);
    resetUI();
  }

  async function confirmarEliminar() {
    if (!selectedId) return;
    await deleteDoc(doc(db, "pueblosMagicos", puebloId, "tradiciones", selectedId));
    resetUI();
  }

  return (
    <div>
      {/* grid de cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:16}}>
        {items.map(it=>{
          const sel = it.id===selectedId, exp = it.id===expandedId;
          return (
            <div
              key={it.id}
              onClick={()=>onCardClick(it)}
              style={{
                border: sel ? "2px solid #ef4444" : "1px solid #eee",
                borderRadius:14, background:"#fff",
                boxShadow: sel ? "0 10px 28px rgba(239,68,68,.25)" : "0 6px 16px rgba(0,0,0,.08)",
                overflow:"hidden", cursor:(mode==="editar"||mode==="eliminar")?"pointer":"default"
              }}
            >
              {it.imagenDataUrl && <img src={it.imagenDataUrl} alt={it.titulo} style={{width:"100%",height:150,objectFit:"cover"}}/>}
              <div style={{padding:12}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                  <h3
                    style={{margin:0,color:"#ea580c",fontWeight:800,fontSize:16,flex:1}}
                    onClick={(e)=>{ e.stopPropagation(); setExpandedId(prev=>prev===it.id?null:it.id||null); }}
                    title="Ver detalles"
                  >
                    {it.titulo}
                  </h3>
                  <span style={{fontSize:18}}>{exp ? "▾" : "▸"}</span>
                </div>
                {exp && (
                  <div style={{marginTop:8,fontSize:13,color:"#334155",lineHeight:1.35}}>
                    {it.fecha && <p><b>Fecha:</b> {it.fecha}</p>}
                    {it.antecedentes && <p><b>Antecedentes:</b> {it.antecedentes}</p>}
                    {it.descripcion && <p><b>Descripción:</b> {it.descripcion}</p>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* acciones admin */}
      <AdminOnly>
        <div style={{display:"flex",gap:12,marginTop:18,flexWrap:"wrap"}}>
          <button onClick={()=>setMode("eliminar")} style={btn("linear-gradient(45deg,#ff512f,#dd2476)")}>🗑 Eliminar</button>
          <button onClick={()=>setMode("editar")}   style={btn("linear-gradient(90deg,#2193b0,#6dd5ed)")}>✏️ Editar</button>
          <button onClick={()=>setMode("agregar")}  style={btn("linear-gradient(90deg,#ef4444,#f59e0b)")}>➕ Agregar</button>
          {mode!=="none" && <button onClick={resetUI} style={btn("#6b7280")}>Cancelar</button>}
        </div>

        {/* paneles */}
        {mode==="eliminar" && (
          <Panel>
            <h4>Eliminar tradición</h4>
            {selectedId
              ? <button onClick={confirmarEliminar} style={btn("linear-gradient(45deg,#ff512f,#dd2476)")}>Confirmar eliminación</button>
              : <p>Selecciona una card para eliminar.</p>}
          </Panel>
        )}

        {mode==="editar" && (
          <Panel>
            <h4>Editar tradición</h4>
            {selectedId ? (
              <div style={{display:"grid",gap:10}}>
                <Input label="Título *" value={eTitulo} onChange={setETitulo}/>
                <Input label="Fecha" value={eFecha} onChange={setEFecha}/>
                <Text label="Antecedentes" value={eAntecedentes} onChange={setEAntecedentes}/>
                <Text label="Descripción" value={eDescripcion} onChange={setEDescripcion}/>
                <label style={lab}>Cambiar imagen (opcional)</label>
                <input type="file" accept="image/*" onChange={e=>{ const f=e.target.files?.[0]||null; setEFile(f); setEPreview(f?URL.createObjectURL(f):null); }}/>
                {ePreview && <img src={ePreview} style={imgPrev}/>}
                <div style={{display:"flex",gap:8}}>
                  <button onClick={guardarEdicion} style={btn("linear-gradient(90deg,#10b981,#84cc16)")}>Guardar cambios</button>
                  <button onClick={resetUI} style={btn("#6b7280")}>Cancelar</button>
                </div>
              </div>
            ) : <p>Selecciona una card para editar.</p>}
          </Panel>
        )}

        {mode==="agregar" && (
          <Panel>
            <h4>Agregar tradición</h4>
            <form onSubmit={crear} style={{display:"grid",gap:10}}>
              <Input label="Título *" value={tTitulo} onChange={setTTitulo}/>
              <Input label="Fecha" value={tFecha} onChange={setTFecha}/>
              <Text label="Antecedentes" value={tAntecedentes} onChange={setTAntecedentes}/>
              <Text label="Descripción" value={tDescripcion} onChange={setTDescripcion}/>
              <label style={lab}>Imagen (opcional)</label>
              <input type="file" accept="image/*" onChange={(e)=>{ const f=e.target.files?.[0]||null; setTFile(f); setTPreview(f?URL.createObjectURL(f):null); }}/>
              {tPreview && <img src={tPreview} style={imgPrev}/>}
              <div style={{display:"flex",gap:8}}>
                <button type="submit" style={btn("linear-gradient(90deg,#ef4444,#f59e0b)")}>Guardar</button>
                <button type="button" onClick={resetUI} style={btn("#6b7280")}>Cancelar</button>
              </div>
            </form>
          </Panel>
        )}
      </AdminOnly>
    </div>
  );
}

const lab: React.CSSProperties = { fontWeight:700, marginBottom:6, display:"block" };
const inputCss: React.CSSProperties = { width:"100%", padding:10, border:"1px solid #ddd", borderRadius:8 };
const textCss: React.CSSProperties = { ...inputCss, minHeight:90 } as React.CSSProperties;
const imgPrev: React.CSSProperties = { width:"100%", maxHeight:220, objectFit:"cover", borderRadius:8, marginTop:8 };

function btn(bg: string): React.CSSProperties {
  return { padding:"10px 16px", border:"none", borderRadius:8, cursor:"pointer", color:"#fff", fontWeight:700, background:bg };
}
function Panel({ children }: { children: React.ReactNode }) {
  return <div style={{ background:"#fff", border:"1px solid #eee", borderRadius:12, padding:16, marginTop:16 }}>{children}</div>;
}
function Input({ label, value, onChange }: { label: string; value: string; onChange: (v:string)=>void }) {
  return (<div><label style={lab}>{label}</label><input style={inputCss} value={value} onChange={e=>onChange(e.target.value)}/></div>);
}
function Text({ label, value, onChange }: { label: string; value: string; onChange: (v:string)=>void }) {
  return (<div><label style={lab}>{label}</label><textarea style={textCss} value={value} onChange={e=>onChange(e.target.value)}/></div>);
}
