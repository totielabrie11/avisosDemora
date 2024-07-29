import React, { useState } from 'react';
import axios from 'axios';
import { Button, Modal, Form } from 'react-bootstrap';
import { BACKEND_URL } from '../config'; // Importa la URL del backend desde config

const ProblemaRemitoButton = ({ reclamo, token, onProblemaReportado, username }) => {
  const [show, setShow] = useState(false);
  const [problemaRemito, setProblemaRemito] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleProblemaRemitoChange = (e) => {
    setProblemaRemito(e.target.value);
  };

  const handleReportarProblema = async () => {
    setLoading(true);
    try {
      const response = await axios.put(`${BACKEND_URL}/api/v1/reclamos/${reclamo.id}`, {
        estadoRemito: 'conflicto',
        problemaRemito: problemaRemito,
        subId: reclamo.subId,
        usernameAlmacen: username,  // Aquí usamos el nombre del usuario logueado
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        const updatedReclamo = {
          ...reclamo,
          estadoRemito: 'conflicto',
          problemaRemito: problemaRemito,
        };
        onProblemaReportado(updatedReclamo);
        handleClose();
      }
    } catch (error) {
      console.error('Error reportando problema con remito:', error);
      alert('No se pudo reportar el problema. Por favor, intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="warning" onClick={handleShow}>
        Reportar Problema con Remito
      </Button>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Reportar Problema con Remito</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="problemaRemito">
              <Form.Label>Descripción del Problema</Form.Label>
              <Form.Control
                type="text"
                value={problemaRemito}
                onChange={handleProblemaRemitoChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cerrar
          </Button>
          <Button variant="primary" onClick={handleReportarProblema} disabled={loading}>
            {loading ? 'Reportando...' : 'Reportar Problema'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ProblemaRemitoButton;
