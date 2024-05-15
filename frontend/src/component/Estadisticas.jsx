import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Estadisticas.css';

const Estadisticas = ({ token }) => {
  const [stats, setStats] = useState({ pedidosPorCliente: {}, pedidosPorMes: {}, totalPedidos: 0 });
  const [error, setError] = useState(null);  // Estado para almacenar el mensaje de error

  useEffect(() => {
    axios.get('http://localhost:3000/api/v1/estadisticas', {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((response) => {
      setStats(response.data);
      setError(null);  // Limpiar errores previos si la solicitud es exitosa
    })
    .catch((error) => {
      console.error('Error fetching estadisticas:', error);
      // Manejo de errores según el código de estado HTTP
      if (error.response) {
        if (error.response.status === 403) {
          setError('Acceso denegado. No tiene permiso para ver estas estadísticas.');
        } else {
          setError('Error al obtener estadísticas.');
        }
      } else {
        setError('Error de conexión con el servidor.');
      }
    });
  }, [token]);

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="estadisticas-container mt-4">
      <h2 className="estadisticas-titulo">Estadísticas</h2>
      <div className="row">
        <div className="col-md-6">
          <div className="estadisticas-total mb-3">
            <h3>Total de Pedidos: {stats.totalPedidos}</h3>
          </div>
          <div className="estadisticas-seccion">
            <h3 className="estadisticas-subtitulo">Pedidos por Cliente</h3>
            <ul className="estadisticas-lista">
              {Object.entries(stats.pedidosPorCliente).map(([cliente, count], idx) => (
                <li key={idx} className="estadisticas-item">
                  {cliente}: <span className="estadisticas-valor">{count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="col-md-6">
          <div className="estadisticas-seccion">
            <h3 className="estadisticas-subtitulo">Pedidos por Mes</h3>
            <ul className="estadisticas-lista">
              {Object.entries(stats.pedidosPorMes).map(([mes, count], idx) => (
                <li key={idx} className="estadisticas-item">
                  {mes}: <span className="estadisticas-valor">{count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Estadisticas;


