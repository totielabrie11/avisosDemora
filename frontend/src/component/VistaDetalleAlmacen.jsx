import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const VistaDetalleAlmacen = ({ show, onHide, reclamo }) => {
  console.log('Reclamo en VistaDetalleAlmacen:', reclamo); // Añadir log para depuración

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Detalle del Reclamo: {reclamo?.pedido}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <h5>Cliente: {reclamo?.cliente}</h5>
        <p><strong>Mensaje:</strong> {reclamo?.mensaje}</p>
        <h5>Materiales:</h5>
        {reclamo?.material && reclamo.material.length > 0 ? (
          <ul>
            {reclamo.material.map((item, index) => (
              <li key={index}>
                <strong>Código:</strong> {item.codigo}<br />
                <strong>Descripción:</strong> {item.descripcion}<br />
                <strong>Cantidad:</strong> {item.cantidad}
              </li>
            ))}
          </ul>
        ) : (
          <p>No hay materiales para este reclamo.</p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default VistaDetalleAlmacen;
