// src/Home.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  getDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged, signOut, User } from "firebase/auth";
import { db } from "./firebase";
import "./home.css";

type Pueblo = {
  id: string;
  nombre: string;
  descripcion?: string;
  imagen: string;
};

function useIsAdmin() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const auth = getAuth();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(db, "users", u.uid));
          setIsAdmin(!!snap.exists() && snap.data()?.role === "admin");
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsub();
  }, []);

  return { user, isAdmin, auth };
}

export default function Home() {
  const navigate = useNavigate();
  const { user, isAdmin, auth } = useIsAdmin();

  const [pueblos, setPueblos] = useState<Pueblo[]>([]);
  const [sidebarPueblos, setSidebarPueblos] = useState<Pueblo[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qy = query(collection(db, "pueblosMagicos"), orderBy("nombre"));
    const unsub = onSnapshot(
      qy,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Pueblo[];
        setPueblos(rows);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        alert("No se pudieron cargar los pueblos.");
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const qy = query(collection(db, "pueblosMagicos"), orderBy("nombre"));
    const unsub = onSnapshot(qy, (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Pueblo[];
      setSidebarPueblos(rows.slice(0, 10));
    });
    return () => unsub();
  }, []);

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (!window.confirm("¿Eliminar este pueblo mágico?")) return;
    try {
      await deleteDoc(doc(db, "pueblosMagicos", id));
      alert("Pueblo eliminado ✅");
    } catch (e: any) {
      console.error(e);
      alert("No se pudo eliminar: " + (e?.message || "Error desconocido"));
    }
  };

  const handleLoginLogout = async () => {
    if (user) {
      await signOut(auth);
    } else {
      navigate("/login");
    }
  };

  const pueblosFiltrados = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = term
      ? pueblos.filter((p) => p.nombre?.toLowerCase().includes(term))
      : pueblos;
    return [...list].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [pueblos, q]);

  return (
    <div className="home-app">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <h2 className="brand-title">
            <span className="brand-gradient">MagicTlax</span>
          </h2>
          <p className="brand-sub">Explora los pueblos mágicos</p>
        </div>

        <div className="session-box">
          {user ? (
            <>
              <p className="session-muted">Sesión iniciada</p>
              <p className="session-email" title={user.email || ""}>
                {user.email}
              </p>
              {isAdmin ? (
                <span className="chip chip-admin">Admin</span>
              ) : (
                <span className="chip chip-user">Usuario</span>
              )}
            </>
          ) : (
            <p className="session-text">No has iniciado sesión</p>
          )}
        </div>

        <div className="session-actions">
          {isAdmin && (
            <button
              onClick={() => navigate("/admin")}
              className="btn btn-indigo"
            >
              ⚙️ Panel administrador
            </button>
          )}
          <button
            onClick={handleLoginLogout}
            className={`btn ${user ? "btn-rose" : "btn-dark"}`}
          >
            {user ? "🔓 Cerrar sesión" : "🔑 Iniciar sesión"}
          </button>
        </div>

        <nav className="nav">
          <p className="nav-section">General</p>
          <button onClick={() => navigate("/")} className="nav-link">🏠 Inicio</button>
          <button onClick={() => navigate("/mapa")} className="nav-link">🗺️ Mapa</button>
          <button onClick={() => navigate("/about")} className="nav-link">📖 Acerca de</button>
          <button onClick={() => navigate("/contact")} className="nav-link">📞 Contacto</button>

          {sidebarPueblos.length > 0 && (
            <>
              <p className="nav-section mt">Pueblos</p>
              <div className="nav-list">
                {sidebarPueblos.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/pueblo/${p.id}`, { state: { pueblo: p } })}
                    className="nav-link nav-link--truncate"
                    title={p.nombre}
                  >
                    🪄 {p.nombre}
                  </button>
                ))}
              </div>
            </>
          )}
        </nav>

        <div className="sidebar-footer">© 2025 MagicTlax</div>
      </aside>

      {/* CONTENIDO */}
      <div className="content">
        {/* HERO */}
        <section className="hero">
          <div className="hero-bg" />
          <div className="hero-inner">
            <h1 className="hero-title">✨ Bienvenid@ a MagicTlax ✨</h1>
            <p className="hero-sub">
              Descubre, guarda y comparte la magia de los pueblos de Tlaxcala.
            </p>

            <div className="hero-actions">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="🔎 Busca por nombre…"
                className="input"
              />
              {isAdmin && (
                <button
                  onClick={() => navigate("/admin")}
                  className="btn btn-pink"
                >
                  ➕ Agregar pueblo
                </button>
              )}
            </div>
          </div>
        </section>

        {/* GRID DE TARJETAS */}
        <main className="cards-wrap">
          {loading ? (
            <div className="empty">Cargando…</div>
          ) : pueblosFiltrados.length === 0 ? (
            <div className="empty">No hay pueblos aún.</div>
          ) : (
            <div className="cards">
              {pueblosFiltrados.map((p) => (
                <article key={p.id} className="card">
                  <div className="card-img">
                    {p.imagen ? (
                      <>
                        <img
                          src={p.imagen}
                          alt={p.nombre}
                          loading="lazy"
                        />
                        <div className="card-img-grad" />
                        <h3 className="card-title-overlay">{p.nombre}</h3>
                      </>
                    ) : (
                      <div className="card-img-empty">Sin imagen</div>
                    )}
                  </div>

                  <div className="card-body">
                    <p className="card-desc">
                      {p.descripcion || "Sin descripción disponible."}
                    </p>

                    <div className="card-actions">
                      <button
                        onClick={() => navigate(`/pueblo/${p.id}`, { state: { pueblo: p } })}
                        className="btn btn-sky btn-xs"
                        title="Explorar"
                      >
                        🌎 Explorar
                      </button>

                      {isAdmin ? (
                        <>
                          <button
                            onClick={() => navigate(`/admin?id=${p.id}`)}
                            className="btn btn-emerald btn-xs"
                            title="Editar"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="btn btn-rose btn-xs"
                            title="Eliminar"
                          >
                            🗑 Eliminar
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-disabled btn-xs" disabled>✏️ Editar</button>
                          <button className="btn btn-disabled btn-xs" disabled>🗑 Eliminar</button>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
