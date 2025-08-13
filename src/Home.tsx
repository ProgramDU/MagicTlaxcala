import ixtencoImg from "./assets/ixtenco.jpg";
import huamantlaImg from "./assets/huamantla.jpg";
import tlaxcoImg from "./assets/tlaxco.jpg";

export default function Home() {
  const pueblos = [
    {
      nombre: "Ixtenco",
      descripcion: "Pueblo otomí que destaca por su riqueza cultural, artesanías y la iglesia de San Juan Bautista.",
      imagen: ixtencoImg
    },
    {
      nombre: "Huamantla",
      descripcion: "Conocido por sus tapetes de aserrín, la feria y la Basílica de la Caridad. Huamantla es historia y tradición.",
      imagen: huamantlaImg
    },
    {
      nombre: "Tlaxco",
      descripcion: "Rodeado de bosques y haciendas, Tlaxco ofrece experiencias únicas con arquitectura colonial y queserías.",
      imagen: tlaxcoImg
    }
  ];

  return (
    <div className="main-content">
      <div className="header">
        <h1>✨ Bienvenid@ a MagicTlax ✨</h1>
        <p>Explora los pueblos mágicos con historia</p>
      </div>
      <div className="cards-container">
        {pueblos.map((pueblo, idx) => (
          <div key={idx} className="card">
            <img src={pueblo.imagen} alt={pueblo.nombre} />
            <div className="card-content">
              <h3>{pueblo.nombre}</h3>
              <p>{pueblo.descripcion}</p>
            </div>
            <button>Explorar</button>
          </div>
        ))}
      </div>
    </div>
  );
}
