import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../config'; // Importa la URL del backend desde config

const MostrarTareasPendientes = ({ token, username, role }) => {
  const [tareasPendientes, setTareasPendientes] = useState([]);

  useEffect(() => {
    const fetchTareasPendientes = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/v1/reclamos`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        let tareas = response.data;

        // Filtrar por username si no es administrador o vendedor
        if (role !== 'administrador' && role !== 'vendedor') {
          tareas = tareas.filter(tarea => tarea.username === username);
        }

        // Filtrar por pedidoEstado no vacío
        tareas = tareas.filter(tarea => tarea.pedidoEstado && tarea.pedidoEstado.trim() !== '');

        setTareasPendientes(tareas);
      } catch (error) {
        console.error('Error al obtener tareas pendientes:', error);
      }
    };

    fetchTareasPendientes();
  }, [token, username, role]);

  return (
    <div>
      {tareasPendientes.map((tarea, index) => (
        <div key={index} className="card mb-3">
          <div className="card-body">
            <h5 className="card-title">{tarea.pedido} - {tarea.cliente}</h5>
            <p className="card-text">{tarea.descripcion}</p>
            <p className="card-text"><strong>Estado:</strong> {tarea.pedidoEstado}</p>
            {/* Mostrar más detalles de la tarea pendiente si es necesario */}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MostrarTareasPendientes;
