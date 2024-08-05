import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Modal, Button } from 'react-bootstrap';

const RespuestaMaterialListo = ({ showModal, setShowModal, handleEnviarRespuesta, fechaEntrega, setFechaEntrega, tipoRespuesta, setTipoRespuesta }) => (
  <Modal show={showModal} onHide={() => setShowModal(false)}>
    <Modal.Header closeButton>
      <Modal.Title>Responder a Reclamo</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <div className="form-group">
        <label>Tipo de Respuesta:</label>
        <select className="form-control mb-2" value={tipoRespuesta} onChange={(e) => setTipoRespuesta(e.target.value)}>
          <option value="fecha">Fecha de Entrega</option>
          <option value="material_sin_remito">Material Preparado pero sin Remito</option>
        </select>
      </div>
      {tipoRespuesta === 'fecha' && (
        <DatePicker
          selected={fechaEntrega}
          onChange={(date) => setFechaEntrega(date)}
          minDate={new Date()}
          placeholderText="Selecciona una fecha de entrega"
          dateFormat="dd-MM-yyyy"
          className="form-control mb-2"
        />
      )}
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={() => setShowModal(false)}>
        Cerrar
      </Button>
      <Button variant="success" onClick={handleEnviarRespuesta}>
        Enviar Respuesta
      </Button>
    </Modal.Footer>
  </Modal>
);

export default RespuestaMaterialListo;
