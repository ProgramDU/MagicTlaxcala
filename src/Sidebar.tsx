// src/Sidebar.tsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaHome, FaMapMarkedAlt, FaInfoCircle, FaPhoneAlt, FaSignOutAlt } from "react-icons/fa";

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem("session");
    navigate("/login");
  };

  return (
    <motion.aside
      initial={{ width: 260 }}
      animate={{ width: isOpen ? 260 : 80 }}
      className="bg-gradient-to-b from-yellow-200 via-pink-100 to-green-100 text-gray-800 shadow-xl transition-all duration-500 overflow-hidden fixed h-full z-20"
    >
      {/* Logo y toggle */}
      <div className="flex items-center justify-between px-4 py-6">
        {isOpen && <h2 className="text-2xl font-extrabold text-pink-700">MagicTlax</h2>}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-600 hover:text-gray-900 text-lg font-bold"
        >
          {isOpen ? "⮜" : "⮞"}
        </button>
      </div>

      {/* Navegación */}
      <nav className="flex flex-col gap-4 px-4 mt-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-3 py-2 hover:text-pink-600 transition-colors duration-300"
        >
          <FaHome /> {isOpen && "Inicio"}
        </button>
        <button
          onClick={() => navigate("/about")}
          className="flex items-center gap-3 py-2 hover:text-pink-600 transition-colors duration-300"
        >
          <FaInfoCircle /> {isOpen && "Acerca de"}
        </button>
        <button
          onClick={() => navigate("/contact")}
          className="flex items-center gap-3 py-2 hover:text-pink-600 transition-colors duration-300"
        >
          <FaPhoneAlt /> {isOpen && "Contacto"}
        </button>
        <button
          onClick={() => navigate("/mapa")}
          className="flex items-center gap-3 py-2 hover:text-pink-600 transition-colors duration-300"
        >
          <FaMapMarkedAlt /> {isOpen && "Mapa"}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 py-2 mt-10 text-red-600 hover:text-red-800 transition-colors duration-300"
        >
          <FaSignOutAlt /> {isOpen && "Cerrar sesión"}
        </button>
      </nav>
    </motion.aside>
  );
};

export default Sidebar;