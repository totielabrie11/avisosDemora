import React, { useState } from 'react';
import axios from 'axios';
import { Button, Modal, Form } from 'react-bootstrap';
import { BACKEND_URL } from '../config'; // Importa la URL del backend desde config

const CerrarReclamoButton = ({ reclamo, token, onReclamoCerrado, username }) => {
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [remito, setRemito] = useState('');
  const [error, setError] = useState('');

  const handleClose = () => {
    setShow(false);
    setRemito('');
    setError('');
  };

  const handleShow = () => setShow(true);

  const handleRemitoChange = (e) => {
    const { value } = e.target;
    if (/^\d{0,6}$/.test(value)) {
      setRemito(value);
      setError('');
    } else {
      setError('El número de remito debe ser un número de 6 dígitos.');
    }
  };

  const handleCerrarReclamo = async () => {
    if (!/^\d{6}$/.test(remito)) {
      setError('El número de remito debe ser un número de 6 dígitos.');
      return;
    }
  
    const confirmed = window.confirm('¿Está seguro de que desea cerrar el reclamo?');
    if (confirmed) {
      setLoading(true);
      try {
        const response = await axios.put(`${BACKEND_URL}/api/v1/reclamos/${reclamo.id}`, {
          estado: 'cerrado',
          subId: reclamo.subId,
          usernameAlmacen: username,
          remito: remito,
          respuesta: `El usuario ${username} ha dado por cerrado el reclamo.`,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        if (response.status === 200) {
          const updatedReclamo = {
            ...reclamo,
            estado: 'cerrado',
            remito: remito,
          };
          onReclamoCerrado(updatedReclamo); // Aquí se actualiza el estado en ManejadorReclamosVentas
          handleClose();
        }
      } catch (error) {
        console.error('Error cerrando el reclamo:', error);
        alert('No se pudo cerrar el reclamo. Por favor, intente de nuevo.');
      } finally {
        setLoading(false);
      }
    }
  };
  

  return (
    <>
      <Button className="w-100 mt-2" variant="danger" onClick={handleShow} disabled={loading}>
        {loading ? 'Cerrando...' : 'Cerrar Reclamo'}
      </Button>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Cerrar Reclamo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formRemito">
              <Form.Label>Indique número de remito de 6 dígitos que cierra el reclamo:</Form.Label>
              <Form.Control
                type="text"
                value={remito}
                onChange={handleRemitoChange}
                isInvalid={!!error}
              />
              <Form.Control.Feedback type="invalid">
                {error}
              </Form.Control.Feedback>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleCerrarReclamo} disabled={loading}>
            {loading ? 'Cerrando...' : 'Cerrar Reclamo'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default CerrarReclamoButton;