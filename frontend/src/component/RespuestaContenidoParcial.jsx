import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const RespuestaContenidoParcial = ({ reclamo, onConfirm }) => {
  // Inicializar los items seleccionados fuera de cualquier condición
  const initialItems = reclamo && reclamo.material ? reclamo.material.map((item) => ({
    ...item,
    selected: false,
    fechaEntrega: null,
    cantidad: item.cantidad, // Inicializar con la cantidad original del reclamo
  })) : [];

  const [selectedItems, setSelectedItems] = useState(initialItems);
  const [fechaError, setFechaError] = useState(false);

  if (!reclamo || !reclamo.material) {
    return <div>No hay materiales para mostrar en este reclamo.</div>;
  }

  const handleSelectItem = (index) => {
    const updatedItems = [...selectedItems];
    updatedItems[index].selected = !updatedItems[index].selected;
    setSelectedItems(updatedItems);
  };

  const handleFechaEntregaChange = (index, date) => {
    const updatedItems = [...selectedItems];
    updatedItems[index].fechaEntrega = date;
    setSelectedItems(updatedItems);
  };

  const handleCantidadChange = (index, newCantidad) => {
    const updatedItems = [...selectedItems];
    updatedItems[index].cantidad = Math.max(1, Math.min(newCantidad, reclamo.material[index].cantidad)); // Limitar la cantidad
    setSelectedItems(updatedItems);
  };

  const handleConfirm = () => {
    const itemsSeleccionados = selectedItems.filter(item => item.selected);

    // Verificar si todos los items seleccionados tienen una fecha asignada
    const fechaValida = itemsSeleccionados.every(item => item.fechaEntrega);

    if (!fechaValida) {
      setFechaError(true);
      return;
    }

    setFechaError(false);
    onConfirm(itemsSeleccionados);
  };

  const handleAsignarFechaATodos = () => {
    const fechaComun = selectedItems.find(item => item.selected && item.fechaEntrega)?.fechaEntrega;
    if (fechaComun) {
      const updatedItems = selectedItems.map(item =>
        item.selected ? { ...item, fechaEntrega: fechaComun } : item
      );
      setSelectedItems(updatedItems);
    }
  };

  return (
    <div>
      {selectedItems.map((item, index) => (
        <div key={item.codigo} className="mb-3">
          <input
            type="checkbox"
            checked={item.selected}
            onChange={() => handleSelectItem(index)}
            className="me-2"
          />
          <span>{item.descripcion} - Cantidad: </span>
          <div className="d-flex align-items-center">
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => handleCantidadChange(index, item.cantidad - 1)}
              disabled={item.cantidad <= 1}
            >
              -
            </button>
            <input
              type="text"
              value={item.cantidad}
              onChange={(e) => handleCantidadChange(index, parseInt(e.target.value, 10))}
              className="form-control mx-2"
              style={{ width: '60px' }}
              readOnly
            />
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => handleCantidadChange(index, item.cantidad + 1)}
              disabled={item.cantidad >= reclamo.material[index].cantidad}
            >
              +
            </button>
          </div>
          {item.selected && (
            <div className="mt-2">
              <DatePicker
                selected={item.fechaEntrega}
                onChange={(date) => handleFechaEntregaChange(index, date)}
                minDate={new Date()}
                placeholderText="Selecciona una fecha de entrega"
                dateFormat="dd-MM-yyyy"
                className="form-control"
              />
            </div>
          )}
        </div>
      ))}
      
      {fechaError && (
        <div className="text-danger mb-3">Al menos un item seleccionado no cuenta con una fecha asignada.</div>
      )}

      <div className="d-flex justify-content-between">
        <button
          className="btn btn-sm btn-link p-0"
          onClick={handleAsignarFechaATodos}
          disabled={selectedItems.every(item => !item.selected)}
        >
          Asignar la misma fecha a todos
        </button>

        <button
          className="btn btn-success"
          onClick={handleConfirm}
          disabled={selectedItems.every(item => !item.selected)}
        >
          Enviar Respuesta Parcial
        </button>
      </div>
    </div>
  );
};

export default RespuestaContenidoParcial;
