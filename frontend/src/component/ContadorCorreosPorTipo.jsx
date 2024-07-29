import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../config'; // Importa la URL del backend desde config

const ContadorCorreosPorTipo = ({ token, pedidoId }) => {
  const [conteoCorreos, setConteoCorreos] = useState({
    inicioReclamo: 0,
    cambioFechaEntrega: 0,
    remitoPreparado: 0,
    deudaPendiente: 0 // Nuevo tipo de mensaje
  });

  useEffect(() => {
    const fetchConteoCorreos = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/v1/contarCorreosPorTipo/${pedidoId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data;
        setConteoCorreos({
          inicioReclamo: data.inicioReclamo || 0,
          cambioFechaEntrega: data.cambioFechaEntrega || 0,
          remitoPreparado: data.remitoPreparado || 0,
          deudaPendiente: data.deudaPendiente || 0 // Nuevo tipo de mensaje
        });
      } catch (error) {
        console.error('Error fetching conteo de correos por tipo:', error);
      }
    };

    fetchConteoCorreos();
  }, [token, pedidoId]);

  return (
    <div>
      <h6>Conteo de correos enviados por tipo:</h6>
      <p>Inicio Reclamo: {conteoCorreos.inicioReclamo}</p>
      <p>Cambio Fecha Entrega: {conteoCorreos.cambioFechaEntrega}</p>
      <p>Remito Preparado: {conteoCorreos.remitoPreparado}</p>
      <p>Deuda Pendiente: {conteoCorreos.deudaPendiente}</p> {/* Nuevo tipo de mensaje */}
    </div>
  );
};

export default ContadorCorreosPorTipo;
