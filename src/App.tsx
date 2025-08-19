// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import Admin from "./Admin";
import Pueblo from "./Pueblo";
import Login from "./Login";
import Register from "./Register";
import PuebloDetalle from "./PuebloDetalle";
import { db } from "./firebase";
import About from "./about";
import Contact from "./Contact";


export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pueblo/:id" element={<Pueblo />} />
        <Route path="/pueblo/:id/detalle" element={<PuebloDetalle />} />
        <Route path="*" element={<div>404 Not Found</div>} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        
      </Routes>
    </Router>
  );
}
console.log("FIREBASE PROJECT:", db.app.options.projectId);