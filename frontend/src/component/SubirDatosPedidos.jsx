import React, { useState } from 'react';
import axios from 'axios';
import { Button, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const isLocalhost = window.location.hostname === 'localhost';
const BACKEND_URL = isLocalhost 
  ? 'http://localhost:43000'
  : 'http://dosivac.homeip.net:43000';

const SubirDatosPedidos = ({ token }) => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Por favor, seleccione un archivo.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${BACKEND_URL}/api/v1/uploadPedidos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      setMessage(response.data.message);
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessage('Error al subir el archivo.');
    }
  };

  return (
    <div className="container mt-4">
      <h2>Subir Datos de Pedidos</h2>
      <Form>
        <Form.Group>
          <Form.Label>Seleccione archivo Excel</Form.Label>
          <Form.Control type="file" onChange={handleFileChange} />
        </Form.Group>
        <Button variant="primary" onClick={handleUpload} className="mt-2">
          Subir
        </Button>
      </Form>
      {message && <div className="mt-3 alert alert-info">{message}</div>}
    </div>
  );
};

export default SubirDatosPedidos;
