import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Graficos from './Graficos';
import './Historico.css';
import { BACKEND_URL } from '../config'; // Importa la URL del backend desde config

const Historico = ({ token }) => {
  const [historico, setHistorico] = useState([]);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/v1/historico`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((response) => {
      setHistorico(response.data);
      setError(null);
    })
    .catch((error) => {
      console.error('Error fetching historico:', error);
      setError('Error al obtener el histórico.');
    });
  }, [token]);

  const handleNext = () => {
    if (currentIndex < historico.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleKeyUp = (event) => {
    if (event.key === 'ArrowRight') {
      handleNext();
    } else if (event.key === 'ArrowLeft') {
      handlePrev();
    }
  };

  useEffect(() => {
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [currentIndex, historico]);

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  if (historico.length === 0) {
    return <div>Cargando...</div>;
  }

  const registro = historico[currentIndex];

  return (
    <div className="historico-container mt-4">
      <h2 className="historico-titulo">Histórico</h2>
      <div className="d-flex justify-content-between mb-3">
        <button className="btn btn-secondary" onClick={handlePrev} disabled={currentIndex === 0}>
          &larr; Día Anterior
        </button>
        <button className="btn btn-secondary" onClick={handleNext} disabled={currentIndex === historico.length - 1}>
          Día Siguiente &rarr;
        </button>
      </div>
      <div className="historico-content">
        <div className="historico-lista-container">
          <ul className="historico-lista">
            <li key={currentIndex} className="historico-item">
              <strong>{registro.fecha}</strong>
              <div>
                <strong>Pedidos por Cliente:</strong>
                <ul>
                  {Object.entries(registro.datos.pedidosPorCliente).map(([cliente, pedidos], index) => (
                    <li key={index}>{cliente}: {pedidos}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Pedidos por Mes:</strong>
                <ul>
                  {Object.entries(registro.datos.pedidosPorMes).map(([mes, pedidos], index) => (
                    <li key={index}>{mes}: {pedidos}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Total Pedidos:</strong> {registro.datos.totalPedidos}
              </div>
            </li>
          </ul>
        </div>
        <div className="graficos-container">
          <Graficos datos={registro.datos} />
        </div>
      </div>
    </div>
  );
};

export default Historico;

