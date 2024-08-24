import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../config';

const ContadorFechasEntregaPorPedido = ({ token, pedidoId, tipo }) => {
  const [cantidadFechas, setCantidadFechas] = useState(0);

  useEffect(() => {
    const fetchCantidadFechas = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/v1/cantidadFechasEntrega/${pedidoId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCantidadFechas(response.data.cantidadFechas);
      } catch (error) {
        console.error('Error fetching cantidad de fechas de entrega:', error);
      }
    };

    fetchCantidadFechas();
  }, [token, pedidoId]);

  return (
    <div>
      <h6>Cantidad de promesas de entrega: {cantidadFechas}</h6>
      {cantidadFechas >= 3 && (
        <p style={{ color: 'red' }}>
          {tipo === 'ventas'
            ? 'Se han realizado 3 promesas de entrega en este reclamo'
            : 'Ha superado la cantidad de promesas máximas permitidas'}
        </p>
      )}
    </div>
  );
};

export default ContadorFechasEntregaPorPedido;
