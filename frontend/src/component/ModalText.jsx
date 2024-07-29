import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import axios from 'axios';
import { BACKEND_URL } from '../config'; // Importa la URL del backend desde config

const ModalText = ({ show, onHide, pedido, estado, onSubmit, token, usuario }) => {
  const [prioridad, setPrioridad] = useState(estado === 'no vencido' ? 'Normal' : 'Regular');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [selectedItems, setSelectedItems] = useState({});

  useEffect(() => {
    if (show) {
      setPrioridad(estado === 'no vencido' ? 'Normal' : 'Regular');
      setMensaje(estado === 'no vencido' ? `El operador ${usuario}, consulta si Vamos a poder cumplir con este pedido?` : `El operador ${usuario}, indica que tenemos una demora de entrega en este pedido.`);
      setError('');

      if (estado === 'no vencido') {
        const allItems = {};
        pedido.Items.forEach((item) => {
          allItems[item.Codigo] = { ...item, cantidad: item.Cantidad };
        });
        setSelectedItems(allItems);
      } else {
        setSelectedItems({});
      }
    }
  }, [show, estado, pedido.Items, usuario]);

  const handlePrioridadChange = (e) => {
    setPrioridad(e.target.value);
  };

  const handleMensajeChange = (e) => {
    setMensaje(e.target.value);
  };

  const handleItemChange = (item, cantidad) => {
    setSelectedItems((prevSelectedItems) => ({
      ...prevSelectedItems,
      [item.Codigo]: { ...item, cantidad },
    }));
  };

  const handleSelectAll = () => {
    const allItems = {};
    pedido.Items.forEach((item) => {
      allItems[item.Codigo] = { ...item, cantidad: item.Cantidad };
    });
    setSelectedItems(allItems);
  };

  const handleSubmit = async () => {
    const material = Object.values(selectedItems)
      .filter(item => item.cantidad > 0)
      .map(item => ({
        codigo: item.Codigo,
        cantidad: item.cantidad,
        descripcion: item.Descripcion,
        fechaVencimiento: item.Fecha_vencida
      }));

    const reclamo = {
      pedido: pedido.Pedido,
      cliente: pedido.Cliente,
      oc: pedido.oc, // Incluye el valor de OC en el reclamo
      estado,
      prioridad,
      mensaje,
      material
    };

    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/v1/reclamos`,
        reclamo,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log('Respuesta del servidor:', response.data);
      onSubmit(reclamo);
      onHide();
    } catch (error) {
      console.error('Error enviando el reclamo:', error.response ? error.response.data : error);
      setError(`Error enviando el reclamo: ${error.response ? error.response.data.error : 'Desconocido'}`);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {estado === 'vencido' ? 'Alerta Demora' : 'Vencimiento Próximo'} - Pedido {pedido.Pedido}
        </Modal.Title>
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
            <Form.Control as="select" value={prioridad} onChange={handlePrioridadChange} disabled={estado === 'no vencido'}>
              {estado === 'no vencido' ? (
                <>
                  <option>Normal</option>
                  <option>Regular</option>
                </>
              ) : (
                <>
                  <option>Regular</option>
                  <option>Urgente</option>
                </>
              )}
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
          <Form.Group>
            <Form.Label>Items del Pedido</Form.Label>
            <Button variant="link" onClick={handleSelectAll}>
              Seleccionar Todo
            </Button>
            {pedido.Items.map((item) => (
              <div key={item.Codigo} className="mb-2">
                <Form.Check
                  type="checkbox"
                  label={`${item.Descripcion} - Cantidad: ${item.Cantidad}`}
                  onChange={(e) => handleItemChange(item, e.target.checked ? item.Cantidad : 0)}
                  checked={!!selectedItems[item.Codigo]}
                />
                {selectedItems[item.Codigo]?.cantidad > 0 && (
                  <Form.Control
                    type="number"
                    value={selectedItems[item.Codigo].cantidad}
                    min="1"
                    max={item.Cantidad}
                    onChange={(e) => handleItemChange(item, Number(e.target.value))}
                    className="mt-1"
                  />
                )}
              </div>
            ))}
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
