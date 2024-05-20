import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const EnvioDeRemito = ({ id, subId, onRemitoEnviado, token }) => {
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
    const formData = new FormData();
    formData.append('file', file);
    formData.append('numeroRemito', numeroRemito);
    formData.append('id', id);
    formData.append('subId', subId);

    try {
      const response = await axios.post('http://localhost:3000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        setMessage('Archivo enviado con éxito.');
        setFile(null);
        setNumeroRemito('');
        if (onRemitoEnviado) {
          onRemitoEnviado(numeroRemito);
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
          <input type="text" className="form-control" id="numeroRemito" value={numeroRemito} onChange={handleNumeroRemitoChange} />
        </div>
        <button type="submit" className="btn btn-primary">Enviar</button>
        </form>
    {message && <div className="mt-3 alert alert-info">{message}</div>}
  </div>
  );
};

export default EnvioDeRemito;




