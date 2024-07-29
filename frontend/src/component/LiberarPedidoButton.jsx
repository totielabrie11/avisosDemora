import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import axios from 'axios';
import { BACKEND_URL } from '../config'; // Importa la URL del backend desde config

const LiberarPedidoButton = ({ reclamo, token, onProblemaReportado }) => {
  const [show, setShow] = useState(false);
  const [tipoLiberacion, setTipoLiberacion] = useState('');
  const [codigoInterno, setCodigoInterno] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [codigoAnterior, setCodigoAnterior] = useState('');
  const [codigoPosterior, setCodigoPosterior] = useState('');

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleSubmit = async () => {
    try {
      let pedidoEstado;
      if (tipoLiberacion === 'total') {
        pedidoEstado = 'activacionTotal';
      } else if (tipoLiberacion === 'parcial') {
        pedidoEstado = 'activacionParcial';
      } else {
        pedidoEstado = 'cambioCodigoInterno';
      }

      const updatedReclamo = {
        ...reclamo,
        pedidoEstado,
        codigoInterno: codigoInterno || null,
        codigoAnterior: codigoAnterior || null,
        codigoPosterior: codigoPosterior || null,
        cantidad: cantidad || null
      };

      const response = await axios.put(
        `${BACKEND_URL}/api/v1/reclamos/${reclamo.id}`,
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
      console.error('Error reportando problema con la liberación del pedido:', error);
    }
  };

  return (
    <>
      <Button variant="light" onClick={handleShow}>
        Liberar Pedido
      </Button>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Opciones de Liberación de Pedido</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label htmlFor="tipoLiberacion" className="form-label">
              Tipo de Liberación
            </label>
            <select
              id="tipoLiberacion"
              className="form-select"
              value={tipoLiberacion}
              onChange={(e) => setTipoLiberacion(e.target.value)}
            >
              <option value="">Seleccione una opción</option>
              <option value="cambioCodigoInterno">Cambio de Código Interno</option>
              <option value="total">Activación de Pedido Total</option>
              <option value="parcial">Activación de Pedido Parcial</option>
            </select>
          </div>
          {tipoLiberacion === 'parcial' && (
            <>
              <div className="mb-3">
                <label htmlFor="codigoInterno" className="form-label">
                  Código Interno
                </label>
                <input
                  type="text"
                  id="codigoInterno"
                  className="form-control"
                  value={codigoInterno}
                  onChange={(e) => setCodigoInterno(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="cantidad" className="form-label">
                  Cantidad
                </label>
                <input
                  type="number"
                  id="cantidad"
                  className="form-control"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                />
              </div>
            </>
          )}
          {tipoLiberacion === 'cambioCodigoInterno' && (
            <>
              <div className="mb-3">
                <label htmlFor="codigoAnterior" className="form-label">
                  Código Anterior
                </label>
                <input
                  type="text"
                  id="codigoAnterior"
                  className="form-control"
                  value={codigoAnterior}
                  onChange={(e) => setCodigoAnterior(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="codigoPosterior" className="form-label">
                  Código Posterior
                </label>
                <input
                  type="text"
                  id="codigoPosterior"
                  className="form-control"
                  value={codigoPosterior}
                  onChange={(e) => setCodigoPosterior(e.target.value)}
                />
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cerrar
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!tipoLiberacion}>
            Enviar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default LiberarPedidoButton;
