import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const EnvioDeRemito = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:3000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.status === 200) {
        setMessage('Archivo enviado con éxito.');
      } else {
        setMessage('Error al enviar el archivo.');
      }
    } catch (error) {
      console.error('Error al enviar el archivo:', error);
      setMessage('Error al enviar el archivo.');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input type="file" onChange={handleFileChange} className="form-control-file" />
        </div>
        <button type="submit" className="btn btn-primary">Enviar Remito</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default EnvioDeRemito;
