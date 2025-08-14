import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "./firebase";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";

type Pueblo = {
  id: string;
  nombre: string;
  descripcion?: string;
  imagen: string;
};

export default function Home() {
  const [pueblos, setPueblos] = useState<Pueblo[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "pueblosMagicos"), (snapshot) => {
      const data: Pueblo[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Pueblo, "id">),
      }));
      setPueblos(data);
    });
    const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u));
    return () => {
      unsub();
      unsubAuth();
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Seguro que quieres eliminar este pueblo mágico?")) {
      await deleteDoc(doc(db, "pueblosMagicos", id));
    }
  };

  const handleLoginLogout = async () => {
    if (user) {
      await signOut(auth);
    } else {
      navigate("/login");
    }
  };

  const pueblosOrdenados = useMemo(
    () => [...pueblos].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    [pueblos]
  );

  // ===== Estilos inline =====
  const LAYOUT: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    background: "linear-gradient(to bottom, #ffffff, #eff6ff)",
    color: "#0f172a",
  };

  const SIDEBAR: React.CSSProperties = {
    width: 288,
    borderRight: "1px solid rgba(0,0,0,0.08)",
    background: "rgba(255,255,255,0.96)",
    height: "100vh",
    position: "sticky",
    top: 0,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  };

  const BRAND_TITLE: React.CSSProperties = { fontSize: 24, fontWeight: 800, color: "#be185d", margin: 0 };
  const BRAND_SUB: React.CSSProperties = { fontSize: 12, color: "#64748b", margin: "4px 0 10px" };

  const SECTION_CAPTION: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0.4,
    color: "#334155",
    marginTop: 6,
  };

  const NAV_BTN: React.CSSProperties = {
    width: "100%",
    textAlign: "left" as const,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    background: "#fff",
    cursor: "pointer",
    fontSize: 14,
  };

  const MAIN: React.CSSProperties = { flex: 1, minWidth: 0, display: "flex", flexDirection: "column" };

  const TOPBAR: React.CSSProperties = {
    position: "sticky",
    top: 0,
    zIndex: 10,
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(6px)",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
    padding: "14px 22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };
  const H1: React.CSSProperties = { margin: 0, fontSize: 26, fontWeight: 800, color: "#0f172a" };
  const PTOP: React.CSSProperties = { margin: 0, fontSize: 12, color: "#64748b" };

  const TOP_BTN: React.CSSProperties = {
    padding: "8px 12px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    color: "#fff",
    fontSize: 12,
    fontWeight: 600,
  };

  const MAIN_INNER: React.CSSProperties = { padding: "20px 22px" };

  const GRID: React.CSSProperties = {
    display: "grid",
    gap: 20,
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    alignItems: "stretch",
  };

  const CARD: React.CSSProperties = {
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    transition: "box-shadow .2s ease, transform .2s ease",
  };

  const CARD_IMG_WRAP: React.CSSProperties = { height: 160, width: "100%", background: "#e2e8f0" };
  const CARD_IMG: React.CSSProperties = { height: "100%", width: "100%", objectFit: "cover" as const };

  const CARD_CONTENT: React.CSSProperties = { padding: 14, display: "flex", flexDirection: "column", flex: 1 };
  const CARD_TITLE: React.CSSProperties = { margin: 0, fontWeight: 700, color: "#0f172a" };
  const CARD_DESC: React.CSSProperties = {
    marginTop: 6,
    fontSize: 14,
    color: "#475569",
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical" as any,
    overflow: "hidden",
  };

  const ACTIONS: React.CSSProperties = { marginTop: "auto", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 };
  const ACTION_BTN: React.CSSProperties = {
    fontSize: 12,
    padding: "8px 8px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    color: "#fff",
    fontWeight: 700,
  };

  const hover = (el: HTMLElement, styles: React.CSSProperties) => Object.assign(el.style, styles);
  const unhover = (el: HTMLElement, styles: React.CSSProperties) => Object.assign(el.style, styles);

  return (
    <div style={LAYOUT}>
      {/* SIDEBAR FIJO (sin desplegables) */}
      <aside style={SIDEBAR}>
        <div>
          <h2 style={BRAND_TITLE}>✨ MagicTlax</h2>
          <p style={BRAND_SUB}>Explora los pueblos mágicos</p>
        </div>

        {/* Botones Admin y Sesión */}
        <div style={{ display: "grid", gap: 8 }}>
          <button
            style={{ ...NAV_BTN, background: "#0ea5e9", color: "#fff", borderColor: "#0ea5e9" }}
            onMouseEnter={(e) => hover(e.currentTarget, { opacity: 0.9 })}
            onMouseLeave={(e) => unhover(e.currentTarget, { opacity: 1 })}
            onClick={() => navigate("/admin")}
          >
            🛠️ Panel Administrador
          </button>

          <button
            style={{
              ...NAV_BTN,
              background: user ? "#e11d48" : "#16a34a",
              color: "#fff",
              borderColor: user ? "#e11d48" : "#16a34a",
            }}
            onMouseEnter={(e) => hover(e.currentTarget, { opacity: 0.9 })}
            onMouseLeave={(e) => unhover(e.currentTarget, { opacity: 1 })}
            onClick={handleLoginLogout}
          >
            {user ? "🔓 Cerrar Sesión" : "🔑 Iniciar Sesión"}
          </button>
        </div>

        {/* Navegación simple */}
        <div style={{ marginTop: 8 }}>
          <div style={SECTION_CAPTION}>GENERAL</div>
          <button
            style={NAV_BTN}
            onMouseEnter={(e) => hover(e.currentTarget, { background: "#f1f5f9" })}
            onMouseLeave={(e) => unhover(e.currentTarget, { background: "#fff" })}
            onClick={() => navigate("/")}
          >
            🏠 Home
          </button>
          <button
            style={NAV_BTN}
            onMouseEnter={(e) => hover(e.currentTarget, { background: "#f1f5f9" })}
            onMouseLeave={(e) => unhover(e.currentTarget, { background: "#fff" })}
            onClick={() => navigate("/mapa")}
          >
            🗺️ Mapa
          </button>

          <div style={{ ...SECTION_CAPTION, marginTop: 12 }}>PUEBLOS MÁGICOS</div>
          {pueblosOrdenados.slice(0, 20).map((p) => (
            <button
              key={p.id}
              style={NAV_BTN}
              title={p.nombre}
              onMouseEnter={(e) => hover(e.currentTarget, { background: "#f1f5f9" })}
              onMouseLeave={(e) => unhover(e.currentTarget, { background: "#fff" })}
              onClick={() => navigate(`/pueblo/${p.id}`, { state: { pueblo: p } })}
            >
              🪄 {p.nombre}
            </button>
          ))}

          <div style={{ ...SECTION_CAPTION, marginTop: 12 }}>CATEGORÍAS</div>
          <button
            style={NAV_BTN}
            onMouseEnter={(e) => hover(e.currentTarget, { background: "#f1f5f9" })}
            onMouseLeave={(e) => unhover(e.currentTarget, { background: "#fff" })}
            onClick={() => navigate("/buscar")}
          >
            🔎 Buscar
          </button>
          <button
            style={NAV_BTN}
            onMouseEnter={(e) => hover(e.currentTarget, { background: "#f1f5f9" })}
            onMouseLeave={(e) => unhover(e.currentTarget, { background: "#fff" })}
            onClick={() => navigate("/zonas")}
          >
            🏞️ Zonas Turísticas
          </button>
        </div>

        <div style={{ marginTop: "auto", fontSize: 11, color: "#94a3b8" }}>© 2025 MagicTlax</div>
      </aside>

      {/* MAIN (cards a la derecha) */}
      <div style={MAIN}>
        <header style={TOPBAR}>
          <div>
            <h1 style={H1}>✨ Bienvenid@ a MagicTlax ✨</h1>
            <p style={PTOP}>Explora los pueblos mágicos con historia</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => navigate("/about")}
              style={{ ...TOP_BTN, background: "#db2777" }}
              onMouseEnter={(e) => hover(e.currentTarget, { opacity: 0.9 })}
              onMouseLeave={(e) => unhover(e.currentTarget, { opacity: 1 })}
            >
              About
            </button>
            <button
              onClick={() => navigate("/contact")}
              style={{ ...TOP_BTN, background: "#16a34a" }}
              onMouseEnter={(e) => hover(e.currentTarget, { opacity: 0.9 })}
              onMouseLeave={(e) => unhover(e.currentTarget, { opacity: 1 })}
            >
              Contact
            </button>
          </div>
        </header>

        <main style={MAIN_INNER}>
          {pueblos.length === 0 ? (
            <div style={{ textAlign: "center", color: "#64748b", padding: "48px 0" }}>
              No hay pueblos aún.
            </div>
          ) : (
            <div style={GRID}>
              {pueblos.map((p) => (
                <div
                  key={p.id}
                  style={CARD}
                  onMouseEnter={(e) =>
                    hover(e.currentTarget, { boxShadow: "0 10px 22px rgba(0,0,0,0.12)", transform: "translateY(-2px)" })
                  }
                  onMouseLeave={(e) =>
                    unhover(e.currentTarget, { boxShadow: "0 6px 18px rgba(0,0,0,0.08)", transform: "translateY(0)" })
                  }
                >
                  <div style={CARD_IMG_WRAP}>
                    {p.imagen ? (
                      <img src={p.imagen} alt={p.nombre} style={CARD_IMG} loading="lazy" />
                    ) : (
                      <div
                        style={{
                          ...CARD_IMG_WRAP,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#94a3b8",
                          fontSize: 13,
                        }}
                      >
                        Sin imagen
                      </div>
                    )}
                  </div>

                  <div style={CARD_CONTENT}>
                    <h3 style={CARD_TITLE}>{p.nombre}</h3>
                    <p style={CARD_DESC}>{p.descripcion || "Sin descripción disponible."}</p>

                    <div style={ACTIONS}>
                      <button
                        onClick={() => navigate(`/pueblo/${p.id}`, { state: { pueblo: p } })}
                        style={{ ...ACTION_BTN, background: "#0284c7" }}
                        onMouseEnter={(e) => hover(e.currentTarget, { opacity: 0.9 })}
                        onMouseLeave={(e) => unhover(e.currentTarget, { opacity: 1 })}
                        title="Explorar"
                      >
                        🌎 Explorar
                      </button>
                      <button
                        onClick={() => navigate(`/admin?id=${p.id}`)}
                        style={{ ...ACTION_BTN, background: "#059669" }}
                        onMouseEnter={(e) => hover(e.currentTarget, { opacity: 0.9 })}
                        onMouseLeave={(e) => unhover(e.currentTarget, { opacity: 1 })}
                        title="Editar"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        style={{ ...ACTION_BTN, background: "#e11d48" }}
                        onMouseEnter={(e) => hover(e.currentTarget, { opacity: 0.9 })}
                        onMouseLeave={(e) => unhover(e.currentTarget, { opacity: 1 })}
                        title="Eliminar"
                      >
                        🗑 Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
