import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Tooltip, OverlayTrigger } from 'react-bootstrap';
import './Estadisticas.css';
import Historico from './Historico';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BACKEND_URL } from '../config'; // Importa la URL del backend desde config

const Estadisticas = ({ token }) => {
  const [stats, setStats] = useState({ pedidosPorCliente: {}, pedidosPorMes: {}, totalPedidos: 0 });
  const [error, setError] = useState(null);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [mesSeleccionado, setMesSeleccionado] = useState(null);

  const saveCurrentDayData = useCallback((data) => {
    axios.post(`${BACKEND_URL}/api/v1/historico`, data, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(response => {
      console.log('Datos del día guardados:', response.data);
    })
    .catch(error => {
      if (error.response && error.response.status === 409) {
        console.log('Los datos del día ya existen.');
      } else {
        console.error('Error guardando los datos del día:', error);
      }
    });
  }, [token]);

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/v1/estadisticas`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((response) => {
      setStats(response.data);
      setError(null);
      saveCurrentDayData(response.data);
    })
    .catch((error) => {
      console.error('Error fetching estadisticas:', error);
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
  }, [token, saveCurrentDayData]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert(`Pedido ${text} copiado al portapapeles`);
    }).catch(err => {
      console.error('Error copying to clipboard:', err);
    });
  };

  const toggleClienteSeleccionado = (cliente) => {
    if (clienteSeleccionado === cliente) {
      setClienteSeleccionado(null);
    } else {
      setClienteSeleccionado(cliente);
    }
  };

  const toggleMesSeleccionado = (mes) => {
    if (mesSeleccionado === mes) {
      setMesSeleccionado(null);
    } else {
      setMesSeleccionado(mes);
    }
  };

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="estadisticas-container mt-4">
      <div className="btn-group mb-3" role="group" aria-label="Navegación">
        <button 
          className={`btn ${!mostrarHistorico ? 'btn-primary' : 'btn-secondary'}`} 
          onClick={() => setMostrarHistorico(false)}
        >
          Estadísticas
        </button>
        <button 
          className={`btn ${mostrarHistorico ? 'btn-primary' : 'btn-secondary'}`} 
          onClick={() => setMostrarHistorico(true)}
        >
          Histórico
        </button>
      </div>

      {!mostrarHistorico ? (
        <>
          <h2 className="estadisticas-titulo">Estadísticas</h2>
          <div className="row">
            <div className="col-md-6">
              <div className="estadisticas-total mb-3">
                <h3>Total de Pedidos: {stats.totalPedidos}</h3>
              </div>
              <div className="estadisticas-seccion">
                <h3 className="estadisticas-subtitulo">Pedidos por Cliente</h3>
                <ul className="estadisticas-lista">
                  {Object.entries(stats.pedidosPorCliente).map(([cliente, pedidos], idx) => (
                    <OverlayTrigger
                      key={idx}
                      placement="top"
                      overlay={
                        <Tooltip id={`tooltip-cliente-${idx}`}>
                          {pedidos.map((pedido, idx) => (
                            <div key={idx} onClick={() => handleCopy(pedido)} style={{ cursor: 'pointer' }}>
                              {pedido}
                            </div>
                          ))}
                        </Tooltip>
                      }
                    >
                      <li 
                        className={`estadisticas-item ${clienteSeleccionado === cliente ? 'selected' : ''}`}
                        onClick={() => toggleClienteSeleccionado(cliente)}
                        style={{ cursor: 'pointer' }}
                      >
                        {cliente}: <span className="estadisticas-valor">{pedidos.length}</span>
                        {clienteSeleccionado === cliente && (
                          <div className="pedidos-lista">
                            {pedidos.map((pedido, idx) => (
                              <div 
                                key={idx} 
                                className="pedido-item" 
                                onClick={() => handleCopy(pedido)}
                              >
                                {pedido}
                              </div>
                            ))}
                          </div>
                        )}
                      </li>
                    </OverlayTrigger>
                  ))}
                </ul>
              </div>
            </div>
            <div className="col-md-6">
              <div className="estadisticas-seccion">
                <h3 className="estadisticas-subtitulo">Pedidos por Mes</h3>
                <ul className="estadisticas-lista">
                  {Object.entries(stats.pedidosPorMes).map(([mes, clientes], idx) => (
                    <OverlayTrigger
                      key={idx}
                      placement="top"
                      overlay={
                        <Tooltip id={`tooltip-mes-${idx}`}>
                          {Object.entries(clientes).map(([cliente, pedidos], idx) => (
                            <div key={idx} onClick={() => handleCopy(cliente)} style={{ cursor: 'pointer' }}>
                              {cliente}
                            </div>
                          ))}
                        </Tooltip>
                      }
                    >
                      <li 
                        className={`estadisticas-item ${mesSeleccionado === mes ? 'selected' : ''}`}
                        onClick={() => toggleMesSeleccionado(mes)}
                        style={{ cursor: 'pointer' }}
                      >
                        {mes}: <span className="estadisticas-valor">{Object.keys(clientes).length}</span>
                        {mesSeleccionado === mes && (
                          <div className="pedidos-lista">
                            {Object.entries(clientes).map(([cliente, pedidos], idx) => (
                              <div 
                                key={idx} 
                                className="pedido-item" 
                                onClick={() => handleCopy(cliente)}
                              >
                                {cliente}
                              </div>
                            ))}
                          </div>
                        )}
                      </li>
                    </OverlayTrigger>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      ) : (
        <Historico token={token} />
      )}
    </div>
  );
};

export default Estadisticas;

