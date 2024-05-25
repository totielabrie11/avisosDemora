import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EnvioDeEmail = ({ reclamo, token, onSaveEmail, fetchEmail }) => {
  const [email, setEmail] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    const verificarEmail = async () => {
      const emailAlmacenado = await fetchEmail(reclamo.cliente);
      setEmail(emailAlmacenado);
      setLoading(false);
    };

    verificarEmail();
  }, [reclamo.cliente, fetchEmail]);

  const validarEmail = (correo) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(correo);
  };

  const enviarCorreo = async () => {
    if (!email || !validarEmail(email)) {
      setEmailError('Por favor, ingrese un correo electrónico válido.');
      return;
    }

    const descripcionMaterial = reclamo.material && reclamo.material.length > 0
                                ? reclamo.material[0].descripcion
                                : 'el material solicitado';

    let subject, text;

    if (reclamo.estado === 'respondido') {
      if (!reclamo.respuesta) {
        alert('El reclamo no cuenta con respuesta para enviar al cliente.');
        return;
      }
      subject = `Actualización de Reclamo - Pedido ${reclamo.pedido}`;
      text = `Estimado cliente,\n\nLamentamos informarle que no podremos entregar ${descripcionMaterial} en la fecha acordada. La nueva fecha de entrega ha sido actualizada.\n\nRespuesta: ${reclamo.respuesta}\n\nSaludos,\nEquipo de Soporte.`;
    } else {
      subject = `Actualización en Fecha de Entrega en Orden de Compra ${reclamo.pedido}`;
      text = `Estimado cliente,\n\nLe informamos que la fecha de entrega de ${descripcionMaterial} ha sido modificada. Por favor, consulte los detalles actualizados en su cuenta.\n\nSaludos,\nEquipo de Soporte.`;
    }

    const emailData = {
      to: email,
      subject: subject,
      text: text,
      html: `<p>${text.replace(/\n/g, '<br>')}</p>`,
    };

    try {
      await axios.post('http://localhost:3000/api/v1/sendEmail', emailData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await guardarCorreo(); // Guardar el correo solo después de enviar

      alert('Correo enviado con éxito');
      setEditMode(false);
    } catch (error) {
      console.error('Error enviando el correo:', error);
      alert('No se pudo enviar el correo. Por favor, intente de nuevo.');
    }
  };

  const guardarCorreo = async () => {
    try {
      await axios.post('http://localhost:3000/api/v1/saveEmail', { cliente: reclamo.cliente, email }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onSaveEmail(email);
    } catch (error) {
      console.error('Error guardando el correo:', error);
      alert('No se pudo guardar el correo. Por favor, intente de nuevo.');
    }
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div>
      {editMode || !email ? (
        <div>
          <label>Ingrese correo electrónico:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError(''); // Limpiar el error cuando el usuario escribe
            }}
            onFocus={() => setEditMode(true)} // Establecer editMode en true al enfocar el input
            className="form-control mt-2"
            placeholder="Ingrese correo electrónico"
            required
            pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$" // Patrón para validar el correo electrónico
          />
          {emailError && <div className="text-white mt-2">{emailError}</div>}
        </div>
      ) : (
        <div>
          <small>
            <i className="fas fa-envelope" onClick={() => setEditMode(true)} style={{ cursor: 'pointer', color: '#007bff' }}></i>
            <span style={{ marginLeft: '8px' }}>{email}</span>
          </small>
        </div>
      )}
      <button className="btn btn-info mt-2" onClick={enviarCorreo}>
        Enviar Correo
      </button>
    </div>
  );
};

export default EnvioDeEmail;



