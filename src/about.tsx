import React from "react";
import { useNavigate } from "react-router-dom";
import "./about.css"; // importa el CSS

const About: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="about-page">
      {/* Cabecera */}
      <header className="about-header">
        <h1>🌟 Sobre MagicTlax</h1>
        <p>La magia de Tlaxcala en un solo lugar</p>
      </header>

      {/* Contenido principal en un card claro */}
      <main className="about-main">
        <div className="about-card">
          <p>
            <strong>MagicTlax</strong> nace con el propósito de mostrar al mundo
            la riqueza cultural, histórica y natural de los pueblos mágicos de
            Tlaxcala.
          </p>
          <p>
            Esta plataforma busca ser un puente entre los visitantes y las
            comunidades locales, fomentando el turismo responsable, la
            apreciación de las tradiciones y la promoción del patrimonio
            mexicano.
          </p>
          <p>
            A través de imágenes, descripciones y recomendaciones, MagicTlax te
            invita a explorar lugares llenos de historia como{" "}
            <strong>Ixtenco</strong>, <strong>Huamantla</strong> y{" "}
            <strong>Tlaxco</strong>. Cada uno con su identidad propia, sus
            costumbres ancestrales y su gastronomía auténtica.
          </p>
          <p>
            Queremos que los viajeros vivan experiencias transformadoras,
            convivan con su gente y comprendan el valor de lo que representa un{" "}
            <em>"Pueblo Mágico"</em>.
          </p>
          <p>
            🌄 Tlaxcala es pequeño en tamaño, pero inmenso en tradiciones,
            belleza y orgullo.
          </p>
          <p className="highlight">
            ¡Descubre con nosotros la magia que vive en cada rincón de Tlaxcala!
          </p>

          <button className="btn-back" onClick={() => navigate("/")}>
            ⬅ Volver al Home
          </button>
        </div>
      </main>
    </div>
  );
};

export default About;
