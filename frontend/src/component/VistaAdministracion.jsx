import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import UserState from './UserState';
import VistaDetalleAlmacen from './VistaDetalleAlmacen';
import ProblemaRemitoButton from './ProblemaRemitoButton';

const VistaAdministracion = ({ token, username, role, onLogout }) => {
  const [reclamos, setReclamos] = useState([]);
  const [selectedReclamo, setSelectedReclamo] = useState(null);
  const [showDetalleModal, setShowDetalleModal] = useState(false);

  const fetchReclamos = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/v1/reclamos', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;

      // Verifica la estructura de los datos recibidos
      console.log('Datos recibidos:', data);

      // Filtrar directamente en el nivel del reclamo principal
      const reclamosFiltrados = data.filter(reclamo => reclamo.estadoRemito === 'conflicto');

      setReclamos(reclamosFiltrados);
    } catch (error) {
      console.error('Error fetching reclamos:', error);
      setReclamos([]);
    }
  }, [token]);

  useEffect(() => {
    fetchReclamos();
  }, [fetchReclamos]);

  const handleVerDetalle = reclamo => {
    setSelectedReclamo(reclamo);
    setShowDetalleModal(true);
  };

  if (role !== 'administrativo') {
    return <div>No tienes acceso a esta vista.</div>;
  }

  const ReclamoCard = ({ reclamo }) => (
    <div className={`col-md-4 mb-4 card bg-warning text-white`}>
      <div className="card-body">
        <h5 className="card-title">{reclamo.pedido} - {reclamo.cliente}</h5>
        <p className="card-text">
          <strong>Reclamo: </strong>{reclamo.mensaje}
        </p>
        <p className="card-text">
          <strong>Fecha vencimiento de entrega:</strong> {reclamo.material.map(m => m.fechaVencimiento).join(', ')}
        </p>
        <p className="card-text">
          <strong>Fecha inicio reclamo:</strong> {reclamo.fecha}
        </p>
        <p className="card-text">
          <strong>Estado:</strong> {reclamo.estado}
        </p>
        <p className="card-text">
          <strong>Reportado por:</strong> {reclamo.username}
        </p>
        <p className="card-text">
          <strong>Tipo de problema informado: </strong>{reclamo.problemaRemito}
        </p>
        <div className="d-flex flex-column">
          <button className="btn btn-secondary mb-2" onClick={() => handleVerDetalle(reclamo)}>
            Ver Detalle
          </button>
          <ProblemaRemitoButton
            reclamo={reclamo}
            token={token}
            onProblemaReportado={(updatedReclamo) => {
              const updatedReclamos = reclamos.map(r => r.id === updatedReclamo.id ? updatedReclamo : r);
              setReclamos(updatedReclamos);
            }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mt-5">
      <UserState username={username} role={role} onLogout={onLogout} />
      <h1 className="mb-4">Gestor de Reclamos - Administración</h1>
      <div className="row">
        {reclamos.length === 0 ? (
          <p>No hay reclamos con estado de remito en conflicto.</p>
        ) : (
          reclamos.map((reclamo, idx) => (
            <ReclamoCard
              key={`${idx}`}
              reclamo={reclamo}
              handleVerDetalle={handleVerDetalle}
              token={token}
            />
          ))
        )}
      </div>

      <VistaDetalleAlmacen
        show={showDetalleModal}
        onHide={() => setShowDetalleModal(false)}
        reclamo={selectedReclamo}
      />
    </div>
  );
};

export default VistaAdministracion;

