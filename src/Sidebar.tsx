// src/Sidebar.tsx
import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="sidebar">
      <h2>MagicTlax</h2>
      <Link to="/">Inicio</Link>
      <Link to="/acerca">Acerca de</Link>
      <Link to="/contacto">Contacto</Link>
      <Link to="/mapa">Mapa</Link>
      <Link to="/login" className="logout">Cerrar sesión</Link>
    </div>
  );
}
