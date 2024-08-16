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

  // Función para formatear la respuesta y agregar saltos de línea
  const formatRespuesta = (respuesta) => {
    if (!respuesta) return '';
    return respuesta.split(' | ').map((line, idx) => (
      <span key={idx} style={{ display: 'block' }}>{line}</span>
    ));
  };

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
              <p><strong>Estado:</strong> <span className={`badge ${entry.estado === 'cerrado' ? 'bg-success' : 'bg-warning'}`}>{entry.estado}</span></p>
              <p><strong>Mensaje:</strong></p>
              <p className="mb-1" style={{ whiteSpace: 'pre-line', color: '#333' }}>{entry.mensaje}</p>
              {entry.tipoMensaje && entry.tipoMensaje.trim() !== '' && (
                <p><strong>Tipo de Mensaje:</strong> {entry.tipoMensaje}</p>
              )}

              {/* Mostrar detalles agrupados si existen múltiples fechas o items */}
              {entry.items && entry.items.length > 0 && (
                <div className="mt-2">
                  <p><strong>Detalles:</strong></p>
                  <ul className="list-group list-group-flush">
                    {entry.items.map((item, idx) => (
                      <li key={idx} className="list-group-item">
                        <strong>{item.descripcion}</strong>
                        <p>Fecha de Entrega: <span className="text-primary">{item.fechaEntrega}</span></p>
                        <p>Cantidad: {item.cantidad}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p><strong>Respuesta:</strong></p>
              <div>{formatRespuesta(entry.respuesta)}</div>

              <p><strong>Registrado:</strong> {entry.timestamp}</p>
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
