import React, { useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../config'; // Importa la URL del backend desde el archivo de configuración

const AdminFileUpload = ({ token }) => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Por favor, seleccione un archivo.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${BACKEND_URL}/api/v1/uploadOrders`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response.data.message || 'Error al subir el archivo.');
    }
  };

/*   return (
    <div className="admin-file-upload">
      <h2>Actualizar Base de Datos "JSON"</h2>
      <input type="file" accept=".json" onChange={handleFileChange} />
      <button onClick={handleUpload} className="btn btn-primary mt-2">
        Subir Archivo
      </button>
      {message && <p>{message}</p>}
    </div>
  ); */
};

export default AdminFileUpload;
