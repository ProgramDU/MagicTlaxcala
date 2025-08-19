import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./contact.css";

// Vite env
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string;
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string;
const TO_EMAIL    = (import.meta.env.VITE_CONTACT_TO_EMAIL as string) || "tlaxmagicmex@gmail.com";

const Contact: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Campos del formulario
  const [nombre, setNombre]   = useState("");
  const [correo, setCorreo]   = useState("");
  const [asunto, setAsunto]   = useState("");
  const [mensaje, setMensaje] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u || null);
      if (u) {
        setCorreo(u.email || "");
        if (u.displayName && !nombre) setNombre(u.displayName);
      }
    });
    return () => unsub();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!correo || !asunto || !mensaje) {
      alert("Por favor completa correo, asunto y mensaje.");
      return;
    }

    const payload = {
      service_id: SERVICE_ID,
      template_id: TEMPLATE_ID,
      user_id: PUBLIC_KEY,
      template_params: {
        from_name: nombre || "(sin nombre)",
        reply_to:  correo,
        subject:   `[MagicTlax] ${asunto}`,
        message:   mensaje,
        to_email:  TO_EMAIL,
      },
    };

    try {
      setSending(true);
      const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`EmailJS error ${res.status}: ${text}`);
      }
      alert("¡Tu mensaje fue enviado! 🎉");
      setAsunto("");
      setMensaje("");
    } catch (err) {
      console.error("[Contact] send error:", err);
      alert("No se pudo enviar el mensaje. Inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="contact-page">
      {/* Cabecera */}
      <header className="contact-header">
        <h1>📬 Contáctanos</h1>
        <p>Estamos aquí para ayudarte</p>

        {/* Botón volver al Home */}
        <div className="contact-header-actions">
          <button className="btn btn-ghost" onClick={() => navigate("/")}>
            ← Volver al Home
          </button>
        </div>
      </header>

      {/* Card principal */}
      <main className="contact-main">
        <div className="contact-card">
          <div className="contact-intro">
            <h2>
              {currentUser?.email
                ? `Hola, ${currentUser.displayName || currentUser.email}!`
                : "Hola, visitante!"}
            </h2>
            <p>
              ¿Tienes <b>preguntas</b>, <b>comentarios</b> o deseas <b>colaborar</b>? ¡Nos encantaría escucharte!
              Completa el formulario y te responderemos pronto.
            </p>
          </div>

          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="field">
              <label className="label">Nombre</label>
              <input
                className="input"
                type="text"
                placeholder="Tu nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>

            <div className="field">
              <label className="label">Correo electrónico *</label>
              <input
                className="input"
                type="email"
                placeholder="tucorreo@ejemplo.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label className="label">Asunto *</label>
              <input
                className="input"
                type="text"
                placeholder="Motivo de tu mensaje"
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label className="label">Mensaje *</label>
              <textarea
                className="textarea"
                placeholder="Cuéntanos en detalle..."
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                required
              />
            </div>

            <div className="actions">
              <button type="submit" className="btn btn-primary" disabled={sending}>
                {sending ? "Enviando..." : "Enviar mensaje"}
              </button>
              <a href="mailto:tlaxmagicmex@gmail.com" className="btn btn-ghost">
                Escribir directamente
              </a>
            </div>
          </form>

          <div className="contact-footer">
            <p>
              También puedes escribirnos a{" "}
              <a href="mailto:tlaxmagicmex@gmail.com">tlaxmagicmex@gmail.com</a>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Contact;
