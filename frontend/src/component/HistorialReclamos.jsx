import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { BACKEND_URL } from '../config'; // Ruta corregida

const HistorialReclamos = ({ pedidoId, token, showModal, handleClose }) => {
  const [historial, setHistorial] = useState([]);

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/v1/historicoReclamos?pedidoId=${pedidoId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHistorial(response.data);
      } catch (error) {
        console.error('Error fetching historial:', error);
      }
    };

    if (showModal) {
      fetchHistorial();
    }
  }, [pedidoId, token, showModal]);

  return (
    <Modal show={showModal} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Historial de Reclamos</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ul className="list-group">
          {historial.map((entry, index) => (
            <li key={index} className="list-group-item">
              <p><strong>Fecha:</strong> {entry.fecha}</p>
              <p><strong>Estado:</strong> {entry.estado}</p>
              <p><strong>Mensaje:</strong> {entry.mensaje}</p>
              <p><strong>Timestamp:</strong> {entry.timestamp}</p>
              {entry.tipoMensaje && entry.tipoMensaje.trim() !== '' && (
                <p><strong>Tipo de Mensaje:</strong> {entry.tipoMensaje}</p>
              )}
            </li>
          ))}
        </ul>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default HistorialReclamos;
