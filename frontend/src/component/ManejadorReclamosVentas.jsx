import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManejadorReclamosVentas = ({ token }) => {
  const [reclamos, setReclamos] = useState([]);

  useEffect(() => {
    const fetchReclamos = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/v1/reclamos', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const reclamosRespondidos = response.data.filter(r => r.estado === 'respondido');
        setReclamos(reclamosRespondidos);
      } catch (error) {
        console.error('Error al obtener reclamos:', error);
      }
    };

    fetchReclamos();
  }, [token]);

  return (
    <div>
      <h2>Reclamos Respondidos</h2>
      <ul>
        {reclamos.map((reclamo, index) => (
          <li key={index}>
            <strong>Pedido:</strong> {reclamo.pedido} - <strong>Cliente:</strong> {reclamo.cliente}<br/>
            <strong>Mensaje:</strong> {reclamo.mensaje}<br/>
            <strong>Estado:</strong> {reclamo.estado} - <strong>Fecha:</strong> {reclamo.fecha}<br/>
            <strong>Atendido por:</strong> {reclamo.username}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ManejadorReclamosVentas;
