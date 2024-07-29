import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../config'; // Importa la URL del backend desde config

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
      console.log(reclamo)
    };

    verificarEmail();
  }, [reclamo, fetchEmail]);

  const validarEmail = (correo) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(correo);
  };

  const extraerNumeroRemito = (respuesta) => {
    const match = respuesta.match(/número (\d{4,6})/);
    return match ? match[1] : '';
  };

  const enviarCorreo = async () => {
    if (!email || !validarEmail(email)) {
      setEmailError('Por favor, ingrese un correo electrónico válido.');
      return;
    }

    const descripcionMaterial = reclamo.material && reclamo.material.length > 0
                               ? reclamo.material[0].descripcion
                               : 'el material solicitado';

    let subject = `Actualización de Reclamo - Orden de Compra ${reclamo.oc}`; //aquí se imprime la orden de compra
    let text = '';
    let tipoMensaje = '';

    const respuestaLower = reclamo.respuesta ? reclamo.respuesta.toLowerCase() : '';
    const remitoNumero = reclamo.respuesta ? extraerNumeroRemito(reclamo.respuesta) : '';

    if (!reclamo.respuesta) {
      text = `Estimado cliente ${reclamo.cliente},\n\nEstamos trabajando de forma urgente en atender su reclamo. Le informaremos tan pronto como tengamos una actualización.\n\nSaludos,\nEquipo de Soporte.`;
      tipoMensaje = 'inicioReclamo';
    } else if (respuestaLower.includes('remito')) {
      text = `Estimado cliente ${reclamo.cliente},\n\nLa mercancía ${descripcionMaterial} se encuentra preparada en nuestro almacén con remito número ${remitoNumero}. Procedemos a coordinar la entrega para que cuente con el material lo antes posible.\n\nSaludos,\nEquipo de Soporte.`;
      tipoMensaje = 'remitoPreparado';
    } else if (respuestaLower.includes('fecha')) {
      text = `Estimado cliente ${reclamo.cliente},\n\nLamentamos informarle que no podremos entregar ${descripcionMaterial} en la fecha acordada. \n\n Compromiso de Nueva Fecha de entrega: ${reclamo.respuesta}.\n\nSaludos,\nEquipo de Soporte.`;
      tipoMensaje = 'cambioFechaEntrega';
    } else {
      text = `Estimado cliente ${reclamo.cliente},\n\nLe informamos que la fecha de entrega de ${descripcionMaterial} ha sido modificada. Por favor, consulte los detalles actualizados en su cuenta.\n\nSaludos,\nEquipo de Soporte.`;
      tipoMensaje = 'fechaModificada';
    }

    const emailData = {
      to: email,
      subject: subject,
      text: text,
      html: `<p>${text.replace(/\n/g, '<br>')}</p>`,
    };

    try {
      await axios.post(`${BACKEND_URL}/api/v1/sendEmail`, emailData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Registrar en el historial de reclamos
      const historicoData = {
        id: reclamo.subId,
        pedido: reclamo.pedido,
        cliente: reclamo.cliente,
        estado: 'email enviado',
        mensaje: `Correo enviado a ${email}`,
        fecha: reclamo.fecha,
        tipoMensaje // Incluye el tipo de mensaje
      };
      await axios.post(`${BACKEND_URL}/api/v1/historicoReclamos`, historicoData, {
        headers: { Authorization: `Bearer ${token}` }
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
      await axios.post(`${BACKEND_URL}/api/v1/saveEmail`, { cliente: reclamo.cliente, email }, {
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
