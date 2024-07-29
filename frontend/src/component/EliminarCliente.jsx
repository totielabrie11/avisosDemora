import React from 'react';
import axios from 'axios';
import { FaTrash } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';

const EliminarCliente = ({ codigo, token, BACKEND_URL, onClienteEliminado }) => {
  const handleDelete = async () => {
    const confirmDelete = window.confirm(`¿Estás seguro de que deseas eliminar el cliente con código ${codigo}?`);
    if (!confirmDelete) {
      return;
    }

    try {
      const response = await axios.delete(`${BACKEND_URL}/api/v1/clientes/${codigo}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 200) {
        alert('Cliente eliminado exitosamente');
        onClienteEliminado(codigo);
      } else {
        alert('Error eliminando cliente');
      }
    } catch (error) {
      console.error('Error eliminando cliente:', error);
      alert('Error eliminando cliente');
    }
  };

  return (
    <button className="btn btn-danger btn-sm ms-2" onClick={handleDelete}>
      <FaTrash />
    </button>
  );
};

export default EliminarCliente;
