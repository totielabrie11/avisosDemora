import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const ManejadorReclamosVentas = ({ token }) => {
  const [reclamos, setReclamos] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReclamos = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/v1/reclamos', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const reclamosRespondidos = response.data.filter(r => r.estado === 'respondido');
        setReclamos(reclamosRespondidos);
      } catch (error) {
        if (error.response && error.response.status === 403) {
          setError('Acceso denegado. No tiene permiso para ver esta información.');
        } else {
          console.error('Error al obtener reclamos:', error);
          setError('Error al obtener reclamos.');
        }
      }
    };

    fetchReclamos();
  }, [token]);

  if (error) {
    return <div className="alert alert-danger" role="alert">{error}</div>;
  }

  return (
    <div className="container mt-5">
      <h1>Reclamos Respondidos</h1>
      <div className="row">
        {reclamos.map((reclamo, index) => (
          <div key={index} className={`col-md-4 mb-4 card bg-secondary text-white`}>
            <div className="card-body">
              <h5 className="card-title">{reclamo.pedido} - {reclamo.cliente}</h5>
              <p className="card-text"><strong>Reclamo: </strong>{reclamo.mensaje}</p>
              <small><strong>Emitido por:</strong> {reclamo.username}</small>
              <p className="card-text">
                <small>
                  <strong>Estado:</strong> {reclamo.estado}<br />
                  <strong>Fecha:</strong> {reclamo.respuesta}<br />
                  <strong>Atendido por:</strong> {reclamo.usernameAlmacen}
                </small>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManejadorReclamosVentas;


