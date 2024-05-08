// src/component/ModalText.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const ModalText = ({ show, onHide, pedido, onSubmit }) => {
  const [prioridad, setPrioridad] = useState('Regular');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    // Resetear los campos del formulario cada vez que se muestre el modal
    if (show) {
      setPrioridad('Regular');
      setMensaje('');
    }
  }, [show]);

  const handlePrioridadChange = (e) => {
    setPrioridad(e.target.value);
  };

  const handleMensajeChange = (e) => {
    setMensaje(e.target.value);
  };

  const handleSubmit = () => {
    const reclamo = {
      id: pedido.Pedido,
      cliente: pedido.Cliente,
      prioridad,
      mensaje,
      fecha: new Date().toISOString(),
    };

    // Llamar al callback pasado como prop
    onSubmit(reclamo);
    onHide(); // Cerrar el modal después de enviar el mensaje
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Vencimiento Próximo - Pedido {pedido.Pedido}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
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
