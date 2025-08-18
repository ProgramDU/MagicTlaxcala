import React from 'react';
import { useNavigate } from 'react-router-dom';

const Contact: React.FC = () => {
  const navigate = useNavigate();


  return (
    <div className="min-h-screen bg-white text-black p-10 text-center">
      <h1 className="text-4xl font-bold text-blue-800 mb-4">Contáctanos</h1>
      <p className="text-gray-700 max-w-xl mx-auto text-lg mb-6">
        ¿Tienes preguntas, comentarios o deseas colaborar? ¡Nos encantaría escucharte!
      </p>
      <form className="max-w-md mx-auto text-left">
        <label className="block mb-2 text-sm font-semibold">Nombre</label>
        <input className="w-full p-2 mb-4 border rounded" type="text" required />

        <label className="block mb-2 text-sm font-semibold">Correo</label>
        <input className="w-full p-2 mb-4 border rounded" type="email" required />

        <label className="block mb-2 text-sm font-semibold">Mensaje</label>
        <textarea className="w-full p-2 mb-4 border rounded" rows={4} required></textarea>

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Enviar
        </button>
      </form>
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition mb-4 mt-8"
      >
        <span className="text-xl">&#8592;</span>
        Volver al Home
      </button>
    </div>
  );
};

export default Contact;
