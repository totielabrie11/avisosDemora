import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BACKEND_URL } from '../config'; // Importa la URL del backend desde config

const EnvioDeRemito = ({ id, subId, token, cliente }) => {
  const [file, setFile] = useState(null);
  const [numeroRemito, setNumeroRemito] = useState('');
  const [message, setMessage] = useState('');
  const [remitoExistente, setRemitoExistente] = useState(false);

  useEffect(() => {
    // Función para verificar si ya existe un remito para este subId
    const verificarRemito = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/v1/reclamos/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const reclamo = response.data.reclamos.find(subReclamo => subReclamo.id === subId);
        if (reclamo && reclamo.remito && reclamo.downloadUrl) {
          setRemitoExistente(true);
        }
      } catch (error) {
        console.error('Error al verificar el remito:', error.response ? error.response.data : error.message);
      }
    };

    verificarRemito();
  }, [id, subId, token]);

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

      console.log("Form Data:", {
        file,
        numeroRemito,
        id,
        subId
      });

      const uploadResponse = await axios.post(`${BACKEND_URL}/upload`, formData, {
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
          usernameAlmacen: cliente,
          remito: numeroRemito,
          estadoRemito: 'resuelto',
          downloadUrl // Incluir downloadUrl en la actualización
        };

        const updateResponse = await axios.put(`${BACKEND_URL}/api/v1/reclamos/${id}`, updateData, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (updateResponse.status === 200) {
          setMessage('Archivo enviado con éxito.');
          setFile(null);
          setNumeroRemito('');
          setRemitoExistente(true); // Actualizar estado a true
        } else {
          setMessage('Error al actualizar el reclamo.');
        }
      } else {
        setMessage('Error al enviar el archivo.');
      }
    } catch (error) {
      console.error('Error al enviar el archivo:', error.response ? error.response.data : error.message);
      setMessage('Error al enviar el archivo.');
    }
  };

  return (
    <div className="container mt-5">
      <h1>Enviar Remito</h1>
      {remitoExistente ? (
        <div className="alert alert-success">
          El remito ya ha sido enviado.
        </div>
      ) : (
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
      )}
      {message && <div className="mt-3 alert alert-info">{message}</div>}
    </div>
  );
};

export default EnvioDeRemito;
