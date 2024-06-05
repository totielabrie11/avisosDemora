import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import axios from 'axios';

const ProblemaRemitoButton = ({ reclamo, token, onProblemaReportado }) => {
  const [show, setShow] = useState(false);
  const [tipoProblema, setTipoProblema] = useState('');

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleSubmit = async () => {
    try {
      const updatedReclamo = {
        ...reclamo,
        problemaRemito: tipoProblema,
        estadoRemito: 'conflicto'
      };

      const response = await axios.put(
        `http://localhost:3000/api/v1/reclamos/${reclamo.id}`,
        updatedReclamo,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        onProblemaReportado(updatedReclamo);
        handleClose();
      }
    } catch (error) {
      console.error('Error reportando problema con remito:', error);
    }
  };

  return (
    <>
      <Button variant="light" onClick={handleShow}>
        Problema con el Remito
      </Button>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Reportar Problema con Remito</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label htmlFor="tipoProblema" className="form-label">
              Tipo de Problema
            </label>
            <select
              id="tipoProblema"
              className="form-select"
              value={tipoProblema}
              onChange={(e) => setTipoProblema(e.target.value)}
            >
              <option value="">Seleccione un tipo de problema</option>
              <option value="crédito">Crédito</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cerrar
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!tipoProblema}>
            Enviar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ProblemaRemitoButton;







