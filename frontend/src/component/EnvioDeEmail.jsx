import React from 'react';
import axios from 'axios';

const EnvioDeEmail = ({ reclamo, token }) => {
  const enviarCorreo = async () => {
    if (!reclamo.respuesta) {
      alert('El reclamo no cuenta con respuesta para enviar al cliente.');
      return;
    }

    const emailData = {
      to: 'martinezcarlosmanuel.1@gmail.com', // Reemplazar con el correo del cliente
      subject: 'Actualización de Reclamo',
      text: `Estimado cliente,\n\nSu reclamo con el ID ${reclamo.id} ha sido actualizado.\n\nRespuesta: ${reclamo.respuesta}\n\nSaludos,\nEquipo de Soporte`,
    };

    try {
      await axios.post('http://localhost:3000/api/v1/sendEmail', emailData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Correo enviado con éxito');
    } catch (error) {
      console.error('Error enviando el correo:', error);
      alert('No se pudo enviar el correo. Por favor, intente de nuevo.');
    }
  };

  return (
    <button className="btn btn-info mt-2" onClick={enviarCorreo}>
      Enviar Correo
    </button>
  );
};

export default EnvioDeEmail;
