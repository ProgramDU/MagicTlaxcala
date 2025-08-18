import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db } from "./firebase";
import { useIsAdmin } from "./hooks/useIsAdmin";

type Pueblo = {
  id: string;
  nombre: string;
  descripcion?: string;
  imagen: string;
};

export default function Home() {
  const navigate = useNavigate();
  const { user, isAdmin, auth } = useIsAdmin(); // <-  hook
  const [pueblos, setPueblos] = useState<Pueblo[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "pueblosMagicos"), (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Pueblo[];
      setPueblos(rows);
    });
    return () => unsub();
  }, []);

  const handleDelete = async (id: string) => {
    if (!isAdmin) return; // seguridad en cliente
    if (window.confirm("¿Eliminar este pueblo mágico?")) {
      await deleteDoc(doc(db, "pueblosMagicos", id));
    }
  };

  const handleLoginLogout = async () => {
    if (user) await signOut(auth);
    else navigate("/login");
  };

  const pueblosFiltrados = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = term ? pueblos.filter((p) => p.nombre?.toLowerCase().includes(term)) : pueblos;
    return [...list].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [pueblos, q]);

  return (
    <div className="home__wrap">
      {/* SIDEBAR */}
      <aside className="home__sidebar">
        <div className="brand">
          <h2 className="brand__title">
            <span className="brand__gradient">MagicTlax</span>
          </h2>
          <p className="brand__subtitle">Explora los pueblos mágicos</p>
        </div>

        <div className="sessioncard">
          {user ? (
            <>
              <p className="muted">Sesión iniciada</p>
              <p className="sessioncard__mail" title={user.email || ""}>
                {user.email}
              </p>
              {isAdmin && <span className="chip chip--ok">Admin</span>}
              {!isAdmin && <span className="chip">Usuario</span>}
            </>
          ) : (
            <p className="muted">No has iniciado sesión</p>
          )}
        </div>

        <div className="sideactions">
          {/* Panel solo si es admin */}
          {isAdmin && (
            <button onClick={() => navigate("/admin")} className="btn btn-indigo">
              ⚙️ Panel administrador
            </button>
          )}
          {/* Login/Logout */}
          <button
            onClick={handleLoginLogout}
            className={`btn ${user ? "btn-danger" : "btn-dark"}`}
          >
            {user ? "🔓 Cerrar sesión" : "🔑 Iniciar sesión"}
          </button>
        </div>

        <nav className="sidenav">
          <p className="sidenav__section">General</p>
          <button onClick={() => navigate("/")} className="sidenav__item">🏠 Inicio</button>
          <button onClick={() => navigate("/mapa")} className="sidenav__item">🗺️ Mapa</button>
          <button onClick={() => navigate("/about")} className="sidenav__item">📖 Acerca de</button>
          <button onClick={() => navigate("/contact")} className="sidenav__item">📞 Contacto</button>
        </nav>

        <div className="sidebar__footer">© 2025 MagicTlax</div>
      </aside>

      {/* CONTENIDO */}
      <div className="home__content">
        {/* HERO */}
        <section className="hero">
          <div className="hero__inner">
            <h1 className="hero__title">✨ Bienvenid@ a MagicTlax ✨</h1>
            <p className="hero__subtitle">Descubre la magia de los pueblos de Tlaxcala.</p>

            <div className="hero__actions">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="🔎 Busca por nombre…"
                className="input"
              />
              {/* Botón agregar solo si es admin */}
              {isAdmin && (
                <button onClick={() => navigate("/admin")} className="btn btn-pink">
                  ➕ Agregar pueblo
                </button>
              )}
            </div>
          </div>
        </section>

        {/* GRID */}
        <main className="cards">
          {pueblosFiltrados.length === 0 ? (
            <div className="empty">No hay pueblos aún.</div>
          ) : (
            <div className="cards__grid">
              {pueblosFiltrados.map((p) => (
                <article key={p.id} className="card">
                  <div className="card__imgwrap">
                    {p.imagen ? (
                      <>
                        <img src={p.imagen} alt={p.nombre} className="card__img" loading="lazy" />
                        <div className="card__fade" />
                        <h3 className="card__title">{p.nombre}</h3>
                      </>
                    ) : (
                      <div className="card__imgplaceholder">Sin imagen</div>
                    )}
                  </div>

                  <div className="card__body">
                    <p className="card__desc">
                      {p.descripcion || "Sin descripción disponible."}
                    </p>

                    <div className="card__actions">
                      <button
                        onClick={() => navigate(`/pueblo/${p.id}`, { state: { pueblo: p } })}
                        className="btn btn-sky small"
                        title="Explorar"
                      >
                        🌎 Explorar
                      </button>

                      {/* Editar y Eliminar SOLO si es admin (no se renderizan si no) */}
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => navigate(`/admin?id=${p.id}`)}
                            className="btn btn-emerald small"
                            title="Editar"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="btn btn-rose small"
                            title="Eliminar"
                          >
                            🗑 Eliminar
                          </button>
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
