// src/component/GestorAlmacenes.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import UserState from './UserState';

const GestorAlmacenes = ({ token, username, role, onLogout }) => {
  const [reclamos, setReclamos] = useState([]);
  const [urgenteCount, setUrgenteCount] = useState(0);
  const [regularCount, setRegularCount] = useState(0);

  // Fetch información de reclamos
  useEffect(() => {
    const fetchReclamos = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/v1/reclamos', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data;
        const urgenteReclamos = data.filter((r) => r.prioridad === 'Urgente');
        const regularReclamos = data.filter((r) => r.prioridad === 'Regular');
        setReclamos(data);
        setUrgenteCount(urgenteReclamos.length);
        setRegularCount(regularReclamos.length);
      } catch (error) {
        console.error('Error fetching reclamos:', error);
      }
    };

    fetchReclamos();
  }, [token]);

  const handleResponder = (reclamo) => {
    console.log('Respondiendo reclamo:', reclamo);
    // Aquí puedes añadir la lógica para responder al reclamo
  };

  return (
    <div className="container mt-5">
      <UserState username={username} role={role} onLogout={onLogout} />
      <h1>Gestor de Reclamos - Almacenes</h1>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Urgente: {urgenteCount}</h2>
        <h2>Regular: {regularCount}</h2>
      </div>
      <div className="row">
        {reclamos.map((reclamo, idx) => (
          <div
            key={idx}
            className={`col-md-4 mb-4 card ${
              reclamo.prioridad === 'Urgente' ? 'bg-danger' : 'bg-warning'
            } text-white`}
          >
            <div className="card-body">
              <h5 className="card-title">{reclamo.pedido} - {reclamo.cliente}</h5>
              <p className="card-text">{reclamo.mensaje}</p>
              <p className="card-text">
                <small>
                  <strong>Prioridad:</strong> {reclamo.prioridad}<br />
                  <strong>Fecha:</strong> {reclamo.fecha}<br />
                  <strong>Reportado por:</strong> {reclamo.username}
                </small>
              </p>
              <button className="btn btn-primary" onClick={() => handleResponder(reclamo)}>
                Responder
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GestorAlmacenes;

