import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import axios from 'axios';
import { BACKEND_URL } from '../config';

const ModalText = ({ show, onHide, pedido, estado, onSubmit, token, usuario }) => {
  const [prioridad, setPrioridad] = useState(estado === 'no vencido' ? 'Normal' : 'Regular');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [selectedItems, setSelectedItems] = useState({});

  useEffect(() => {
    if (show) {
      setPrioridad(estado === 'no vencido' ? 'Normal' : 'Regular');
      setMensaje(
        estado === 'no vencido' 
          ? `El operador ${usuario}, consulta si Vamos a poder cumplir con este pedido?` 
          : `El operador ${usuario}, indica que tenemos una demora de entrega en este pedido.`
      );
      setError('');

      if (estado === 'no vencido') {
        const allItems = {};
        pedido.Items.forEach((item, index) => {
          allItems[index] = {
            id: index,
            ...item,
            cantidad: item.Cantidad,
            selected: true
          };
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

  const handleItemChange = (id, cantidad) => {
    setSelectedItems((prevSelectedItems) => ({
      ...prevSelectedItems,
      [id]: {
        ...prevSelectedItems[id],
        cantidad,
        selected: cantidad > 0
      }
    }));
  };

  const handleSelectAll = () => {
    const allItems = {};
    pedido.Items.forEach((item, index) => {
      allItems[index] = {
        id: index,
        ...item,
        cantidad: item.Cantidad,
        selected: true
      };
    });
    setSelectedItems(allItems);
  };

  const handleDeselectAll = () => {
    const allItems = {};
    pedido.Items.forEach((item, index) => {
      allItems[index] = {
        id: index,
        ...item,
        cantidad: 0,
        selected: false
      };
    });
    setSelectedItems(allItems);
  };

  const handleSubmit = async () => {
    const material = Object.values(selectedItems)
      .filter((item) => item.selected && item.cantidad > 0)
      .map((item) => ({
        codigo: item.Codigo,
        cantidad: item.cantidad,
        descripcion: item.Descripcion,
        fechaVencimiento: item.Fecha_vencida,
      }));

    const reclamo = {
      pedido: pedido.Pedido,
      cliente: pedido.Cliente,
      oc: pedido.oc,
      estado,
      prioridad,
      mensaje,
      material,
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
      console.error(
        'Error enviando el reclamo:',
        error.response ? error.response.data : error
      );
      setError(
        `Error enviando el reclamo: ${
          error.response ? error.response.data.error : 'Desconocido'
        }`
      );
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
            <Form.Control
              as="select"
              value={prioridad}
              onChange={handlePrioridadChange}
              disabled={estado === 'no vencido'}
            >
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
            <div className="d-flex justify-content-between mb-2">
              <Button variant="link" onClick={handleSelectAll}>
                Seleccionar Todo
              </Button>
              <Button variant="link" onClick={handleDeselectAll}>
                Deseleccionar Todo
              </Button>
            </div>
            {pedido.Items.map((item, index) => (
              <div key={index} className="mb-2">
                <Form.Check
                  type="checkbox"
                  label={`${item.Descripcion} - Cantidad: ${item.Cantidad}`}
                  onChange={(e) =>
                    handleItemChange(index, e.target.checked ? item.Cantidad : 0)
                  }
                  checked={selectedItems[index]?.selected || false}
                />
                {selectedItems[index]?.selected && (
                  <Form.Control
                    type="number"
                    value={selectedItems[index].cantidad}
                    min="1"
                    max={item.Cantidad}
                    onChange={(e) => {
                      const cantidad = Number(e.target.value);
                      handleItemChange(index, cantidad);
                    }}
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
