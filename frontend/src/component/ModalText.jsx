import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import axios from 'axios';

const ModalText = ({ show, onHide, pedido, onSubmit, token }) => {
  const [prioridad, setPrioridad] = useState('Regular');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (show) {
      setPrioridad('Regular');
      setMensaje('');
      setError('');
    }
  }, [show]);

  const handlePrioridadChange = (e) => {
    setPrioridad(e.target.value);
  };

  const handleMensajeChange = (e) => {
    setMensaje(e.target.value);
  };

  const handleSubmit = async () => {
    const reclamo = {
      pedido: pedido.Pedido,
      cliente: pedido.Cliente,
      prioridad,
      mensaje
    };

    try {
      await axios.post(
        'http://localhost:3000/api/v1/reclamos',
        reclamo,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      onSubmit(reclamo);
      onHide();
    } catch (error) {
      console.error('Error enviando el reclamo:', error);
      setError('Error enviando el reclamo');
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Vencimiento Próximo - Pedido {pedido.Pedido}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <p className="text-danger">{error}</p>}
        <Form>
          <Form.Group>
            <Form.Label>Cliente</Form.Label>
            <Form.Control type="text" readOnly defaultValue={pedido.Cliente} />
          </Form.Group>
          <Form.Group>
            <Form.Label>Prioridad</Form.Label>
            <Form.Control as="select" value={prioridad} onChange={handlePrioridadChange}>
              <option>Regular</option>
              <option>Urgente</option>
            </Form.Control>
          </Form.Group>
          <Form.Group>
            <Form.Label>Mensaje</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={mensaje}
              onChange={handleMensajeChange}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Enviar Mensaje
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalText;

