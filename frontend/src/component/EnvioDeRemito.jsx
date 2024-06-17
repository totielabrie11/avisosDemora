import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import moment from 'moment';

const EnvioDeRemito = ({ id, subId, onRemitoEnviado, token, cliente }) => {
  const [file, setFile] = useState(null);
  const [numeroRemito, setNumeroRemito] = useState('');
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleNumeroRemitoChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 6) {
      setNumeroRemito(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Paso 1: Subir el archivo
      const formData = new FormData();
      formData.append('file', file);
      formData.append('numeroRemito', numeroRemito);
      formData.append('id', id);
      formData.append('subId', subId);

      const uploadResponse = await axios.post('http://localhost:3000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      if (uploadResponse.status === 200) {
        const { downloadUrl } = uploadResponse.data;

        // Paso 2: Actualizar el reclamo
        const updateData = {
          estado: 'remito enviado',
          respuesta: `Remito enviado con número ${numeroRemito}`,
          subId,
          usernameAlmacen: cliente, // Usar el nombre del cliente pasado como prop
          remito: numeroRemito,
          estadoRemito: 'resuelto'
        };

        const updateResponse = await axios.put(`http://localhost:3000/api/v1/reclamos/${id}`, updateData, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (updateResponse.status === 200) {
          // Registrar en el historial de reclamos
          const historicoData = {
            id: subId,
            pedido: id,
            cliente: cliente,
            estado: 'remito enviado',
            mensaje: `Se ha impreso el remito y enviado al personal de ventas con número ${numeroRemito}`,
            fecha: moment().format('DD-MM-YYYY HH:mm:ss')
          };
          await axios.post('http://localhost:3000/api/v1/historicoReclamos', historicoData, {
            headers: { Authorization: `Bearer ${token}` }
          });

          setMessage('Archivo enviado con éxito.');
          setFile(null);
          setNumeroRemito('');
          if (onRemitoEnviado) {
            onRemitoEnviado(numeroRemito, downloadUrl);
          }
        } else {
          setMessage('Error al actualizar el reclamo.');
        }
      } else {
        setMessage('Error al enviar el archivo.');
      }
    } catch (error) {
      console.error('Error al enviar el archivo:', error);
      setMessage('Error al enviar el archivo.');
    }
  };

  return (
    <div className="container mt-5">
      <h1>Enviar Remito</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="file" className="form-label">Archivo</label>
          <input type="file" className="form-control" id="file" onChange={handleFileChange} />
        </div>
        <div className="mb-3">
          <label htmlFor="numeroRemito" className="form-label">Número de Remito</label>
          <input type="number" className="form-control" id="numeroRemito" value={numeroRemito} onChange={handleNumeroRemitoChange} />
        </div>
        <button type="submit" className="btn btn-primary">Enviar</button>
      </form>
      {message && <div className="mt-3 alert alert-info">{message}</div>}
    </div>
  );
};

export default EnvioDeRemito;

