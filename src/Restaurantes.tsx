// src/Restaurantes.tsx
import React, { useEffect, useState } from "react";
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from "firebase/firestore";
import { db } from "./firebase";
import AdminOnly from "./components/AdminOnly";

type Restaurante = {
  id?: string;
  nombre: string;
  concepto?: string;
  tipoComida?: string;
  descripcion?: string;
  imagen?: string;        // dataURL comprimida
  createdAt?: any;
};

type Props = { puebloId: string };

const MAX_W = 800;
const MAX_BYTES = 1_048_576; // ~1MB

async function compress(file: File): Promise<string> {
  const fr = new FileReader();
  const data = await new Promise<string>((res, rej) => {
    fr.onload = () => res(fr.result as string);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = data;
  });

  const scale = Math.min(1, MAX_W / img.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const out = canvas.toDataURL("image/jpeg", 0.72);
  const bytes = Math.ceil((out.length * 3) / 4);
  if (bytes > MAX_BYTES) throw new Error("Imagen demasiado grande tras compresión.");
  return out;
}

export default function Restaurantes({ puebloId }: Props) {
  const [items, setItems] = useState<Restaurante[]>([]);
  const [mode, setMode] = useState<"none" | "agregar" | "editar" | "eliminar">("none");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // agregar
  const [rNombre, setRNombre] = useState("");
  const [rConcepto, setRConcepto] = useState("");
  const [rTipo, setRTipo] = useState("");
  const [rDescripcion, setRDescripcion] = useState("");
  const [rFile, setRFile] = useState<File | null>(null);
  const [rPrev, setRPrev] = useState<string | null>(null);

  // editar
  const [eNombre, setENombre] = useState("");
  const [eConcepto, setEConcepto] = useState("");
  const [eTipo, setETipo] = useState("");
  const [eDescripcion, setEDescripcion] = useState("");
  const [eFile, setEFile] = useState<File | null>(null);
  const [ePrev, setEPrev] = useState<string | null>(null);

  useEffect(() => {
    const ref = collection(db, "pueblosMagicos", puebloId, "restaurantes");
    const qy = query(ref, orderBy("nombre"));
    const unsub = onSnapshot(qy, (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Restaurante[]);
    });
    return () => unsub();
  }, [puebloId]);

  function reset() {
    setMode("none"); setSelectedId(null); setExpandedId(null);
    setRNombre(""); setRConcepto(""); setRTipo(""); setRDescripcion(""); setRFile(null); setRPrev(null);
    setENombre(""); setEConcepto(""); setETipo(""); setEDescripcion(""); setEFile(null); setEPrev(null);
  }

  function onCardClick(it: Restaurante) {
    if (mode === "editar" || mode === "eliminar") {
      setSelectedId(prev => prev === it.id ? null : it.id || null);
      if (mode === "editar") {
        setENombre(it.nombre || "");
        setEConcepto(it.concepto || "");
        setETipo(it.tipoComida || "");
        setEDescripcion(it.descripcion || "");
        setEPrev(it.imagen || null);
      }
    }
  }

  // Crear
  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!rNombre.trim()) return alert("El nombre es obligatorio.");
    let img: string | undefined;
    if (rFile) img = await compress(rFile);

    await addDoc(collection(db, "pueblosMagicos", puebloId, "restaurantes"), {
      nombre: rNombre,
      concepto: rConcepto,
      tipoComida: rTipo,
      descripcion: rDescripcion,
      imagen: img,
      createdAt: serverTimestamp(),
    });
    reset();
  }

  // Guardar edición
  async function guardar() {
    if (!selectedId) return;
    const upd: Partial<Restaurante> = {
      nombre: eNombre,
      concepto: eConcepto,
      tipoComida: eTipo,
      descripcion: eDescripcion,
    };
    if (eFile) upd.imagen = await compress(eFile);

    await updateDoc(doc(db, "pueblosMagicos", puebloId, "restaurantes", selectedId), upd as any);
    reset();
  }

  // Eliminar
  async function eliminar() {
    if (!selectedId) return;
    await deleteDoc(doc(db, "pueblosMagicos", puebloId, "restaurantes", selectedId));
    reset();
  }

  return (
    <div>
      {/* GRID de cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 16 }}>
        {items.map(it => {
          const sel = it.id === selectedId, exp = it.id === expandedId;
          return (
            <div
              key={it.id}
              onClick={() => onCardClick(it)}
              style={{
                border: sel ? "2px solid #7c3aed" : "1px solid #eee",
                borderRadius: 14,
                background: "#fff",
                boxShadow: sel ? "0 10px 28px rgba(124,58,237,.25)" : "0 6px 16px rgba(0,0,0,.08)",
                overflow: "hidden",
                cursor: (mode === "editar" || mode === "eliminar") ? "pointer" : "default"
              }}
            >
              {it.imagen && (
                <img
                  src={it.imagen}
                  alt={it.nombre}
                  style={{ width: "100%", height: 150, objectFit: "cover" }}
                />
              )}
              <div style={{ padding: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <h3
                    style={{ margin: 0, color: "#7c3aed", fontWeight: 800, fontSize: 16, flex: 1 }}
                    onClick={(e) => { e.stopPropagation(); setExpandedId(prev => prev === it.id ? null : it.id || null); }}
                  >
                    {it.nombre}
                  </h3>
                  <span style={{ fontSize: 18 }}>{exp ? "▾" : "▸"}</span>
                </div>

                {exp && (
                  <div style={{ marginTop: 8, fontSize: 13, color: "#334155", lineHeight: 1.35 }}>
                    {it.concepto && <p><b>Concepto:</b> {it.concepto}</p>}
                    {it.tipoComida && <p><b>Tipo de comida:</b> {it.tipoComida}</p>}
                    {it.descripcion && <p>{it.descripcion}</p>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Controles solo admin */}
      <AdminOnly>
        <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
          <button onClick={() => setMode("eliminar")} style={btn("linear-gradient(45deg,#ff512f,#dd2476)")}>🗑 Eliminar</button>
          <button onClick={() => setMode("editar")} style={btn("linear-gradient(90deg,#7c3aed,#a78bfa)")}>✏️ Editar</button>
          <button onClick={() => setMode("agregar")} style={btn("linear-gradient(90deg,#7c3aed,#ec4899)")}>➕ Agregar</button>
          {mode !== "none" && <button onClick={reset} style={btn("#6b7280")}>Cancelar</button>}
        </div>

        {mode === "eliminar" && (
          <Panel>
            <h4>Eliminar restaurante</h4>
            {selectedId
              ? <button onClick={eliminar} style={btn("linear-gradient(45deg,#ff512f,#dd2476)")}>Confirmar eliminación</button>
              : <p>Selecciona una card para eliminar.</p>}
          </Panel>
        )}

        {mode === "editar" && (
          <Panel>
            <h4>Editar restaurante</h4>
            {selectedId ? (
              <div style={{ display: "grid", gap: 10 }}>
                <Input label="Nombre *" value={eNombre} onChange={setENombre} />
                <Input label="Concepto" value={eConcepto} onChange={setEConcepto} />
                <Input label="Tipo de comida" value={eTipo} onChange={setETipo} />
                <Text label="Descripción" value={eDescripcion} onChange={setEDescripcion} />
                <label style={lab}>Cambiar imagen (opcional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setEFile(f);
                    setEPrev(f ? URL.createObjectURL(f) : null);
                  }}
                />
                {ePrev && <img src={ePrev} style={imgPrev} />}
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={guardar} style={btn("linear-gradient(90deg,#10b981,#84cc16)")}>Guardar</button>
                  <button onClick={reset} style={btn("#6b7280")}>Cancelar</button>
                </div>
              </div>
            ) : <p>Selecciona una card para editar.</p>}
          </Panel>
        )}

        {mode === "agregar" && (
          <Panel>
            <h4>Agregar restaurante</h4>
            <form onSubmit={crear} style={{ display: "grid", gap: 10 }}>
              <Input label="Nombre *" value={rNombre} onChange={setRNombre} />
              <Input label="Concepto" value={rConcepto} onChange={setRConcepto} />
              <Input label="Tipo de comida" value={rTipo} onChange={setRTipo} />
              <Text label="Descripción" value={rDescripcion} onChange={setRDescripcion} />
              <label style={lab}>Imagen (opcional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setRFile(f);
                  setRPrev(f ? URL.createObjectURL(f) : null);
                }}
              />
              {rPrev && <img src={rPrev} style={imgPrev} />}
              <div style={{ display: "flex", gap: 8 }}>
                <button type="submit" style={btn("linear-gradient(90deg,#7c3aed,#ec4899)")}>Guardar</button>
                <button type="button" onClick={reset} style={btn("#6b7280")}>Cancelar</button>
              </div>
            </form>
          </Panel>
        )}
      </AdminOnly>
    </div>
  );
}

/* Helpers UI */
const lab: React.CSSProperties = { fontWeight: 700, marginBottom: 6, display: "block" };
const inputCss: React.CSSProperties = { width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8 };
const textCss: React.CSSProperties = { ...inputCss, minHeight: 90 } as React.CSSProperties;
const imgPrev: React.CSSProperties = { width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 8, marginTop: 8 };

function btn(bg: string): React.CSSProperties {
  return { padding: "10px 16px", border: "none", borderRadius: 8, cursor: "pointer", color: "#fff", fontWeight: 700, background: bg };
}
function Panel({ children }: { children: React.ReactNode }) {
  return <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: 16, marginTop: 16 }}>{children}</div>;
}
function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (<div><label style={lab}>{label}</label><input style={inputCss} value={value} onChange={e => onChange(e.target.value)} /></div>);
}
function Text({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (<div><label style={lab}>{label}</label><textarea style={textCss} value={value} onChange={e => onChange(e.target.value)} /></div>);
}
