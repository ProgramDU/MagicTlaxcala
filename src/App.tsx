import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Home from "./Home";
import Admin from "./Admin";
import Pueblo from "./Pueblo";
import PuebloDetalle from "./PuebloDetalle";
import Sidebar from "./Sidebar";

function Layout() {
  const location = useLocation();

  // Ocultar Sidebar en las rutas que empiecen con /pueblo
  const hideSidebar = location.pathname.startsWith("/pueblo");

  return (
    <div className="app-container">
      {!hideSidebar && <Sidebar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/pueblo/:id" element={<Pueblo />} />
        <Route path="/pueblo/:id/detalle" element={<PuebloDetalle />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}
