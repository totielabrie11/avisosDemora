import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../config';

const MostrarDemoras = ({ token }) => {
  const [demoras, setDemoras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDemoras = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/v1/reclamos`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Filtrar reclamos con demora y excluir los que han sido cerrados
        const reclamosConDemora = response.data.filter(reclamo => {
          const isCerrado = reclamo.respuesta && reclamo.respuesta.includes('ha dado por cerrado el reclamo.');
          return reclamo.demora && !isCerrado && !reclamo.remito;
        });

        setDemoras(reclamosConDemora);
        setLoading(false);
      } catch (error) {
        console.error('Error al obtener demoras:', error);
        setError('Error al obtener demoras');
        setLoading(false);
      }
    };

    fetchDemoras();
  }, [token]);

  if (loading) return <p>Cargando demoras...</p>;
  if (error) return <p>{error}</p>;
  if (demoras.length === 0) return null;

  return (
    <div>
      {demoras.map((demora, index) => (
        <div key={index} className="alert alert-warning">
          <strong>Demora en respuesta:</strong> El pedido <strong>{demora.pedido}</strong> del cliente <strong>{demora.cliente}</strong> tiene una demora de más de 5 días en su respuesta.
        </div>
      ))}
    </div>
  );
};

export default MostrarDemoras;
