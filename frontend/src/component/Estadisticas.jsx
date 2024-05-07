// Estadisticas.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Estadisticas.css';

const Estadisticas = () => {
  const [stats, setStats] = useState({ pedidosPorCliente: {}, pedidosPorMes: {} });

  useEffect(() => {
    axios.get('http://localhost:3000/api/v1/estadisticas')
      .then(response => setStats(response.data))
      .catch(error => console.error(error));
  }, []);

  return (
    <div className="estadisticas-container mt-4">
      <h2 className="estadisticas-titulo">Estadísticas</h2>
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
  );
};

export default Estadisticas;
