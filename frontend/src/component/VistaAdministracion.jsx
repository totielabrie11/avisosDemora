import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import UserState from './UserState';
import VistaDetalleAlmacen from './VistaDetalleAlmacen';
import LeyendaAdministracion from './leyendas/LeyendaAdministracion'; // Importa el componente
import { BACKEND_URL } from '../config'; // Importa la URL del backend desde config

const VistaAdministracion = ({ token, username, role, onLogout }) => {
  const [reclamos, setReclamos] = useState([]);
  const [selectedReclamo, setSelectedReclamo] = useState(null);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [error, setError] = useState(null);

  const fetchReclamos = useCallback(async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/v1/reclamos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;

      console.log('Datos recibidos:', data);

      // Filtramos por los estados relevantes
      const reclamosFiltrados = data.filter(reclamo => 
        ['conflicto', 'resuelto', 'retenido deuda', 'remito enviado'].includes(reclamo.estadoRemito)
      );

      setReclamos(reclamosFiltrados);
    } catch (error) {
      console.error('Error fetching reclamos:', error);
      setReclamos([]);
      setError('Error al obtener reclamos.');
    }
  }, [token]);

  useEffect(() => {
    fetchReclamos();
  }, [fetchReclamos]);

  const handleVerDetalle = reclamo => {
    setSelectedReclamo(reclamo);
    setShowDetalleModal(true);
  };

  const handleClienteDesbloqueado = async (reclamo) => {
    const confirmed = window.confirm('¿Está seguro de que desea desbloquear al cliente?');
    if (confirmed) {
      try {
        const subReclamoId = reclamo.subId; // Asegúrate de que este campo esté disponible
        await axios.put(`${BACKEND_URL}/api/v1/reclamos/${reclamo.id}`, 
          { estadoRemito: 'desbloqueado', subId: subReclamoId }, 
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
  
        alert('Cliente desbloqueado exitosamente');
  
        // Refresca la lista de reclamos
        await fetchReclamos();
      } catch (error) {
        console.error('Error desbloqueando al cliente:', error);
        alert('No se pudo desbloquear al cliente. Por favor, intente de nuevo.');
      }
    }
  };
  
  const handleRemitoRetenido = async (reclamo) => {
    const confirmed = window.confirm(`¿Está seguro de que desea retener el remito para el reclamo con id: ${reclamo.id}?`);
    if (confirmed) {
      try {
        const subReclamoId = reclamo.subId; // Asegúrate de que este campo está disponible
        await axios.put(`${BACKEND_URL}/api/v1/reclamos/${reclamo.id}`, 
          { estadoRemito: 'retenido deuda', subId: subReclamoId }, 
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
  
        alert('Remito retenido exitosamente');
  
        // Refresca la lista de reclamos
        await fetchReclamos();
      } catch (error) {
        console.error('Error reteniendo el remito:', error);
        alert('No se pudo retener el remito. Por favor, intente de nuevo.');
      }
    }
  };

  if (role !== 'administrativo') {
    return <div>No tienes acceso a esta vista.</div>;
  }

  const ReclamoCard = ({ reclamo }) => (
    <div className={`col-md-4 mb-4 card ${reclamo.estadoRemito === 'resuelto' ? 'bg-warning text-dark' : (reclamo.estadoRemito === 'retenido deuda' ? 'bg-danger text-white' : 'bg-primary text-white')}`}>
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
        <p className="card-text">
          <strong>Estado Remito:</strong> {reclamo.estadoRemito}
        </p>
        {(reclamo.estadoRemito === 'resuelto' || reclamo.estadoRemito === 'retenido deuda') && (
          <p className="card-text">
            <strong>Número de Remito:</strong> {reclamo.remito}
          </p>
        )}
        <div className="d-flex flex-column">
          <button className="btn btn-secondary mb-2" onClick={() => handleVerDetalle(reclamo)}>
            Ver Detalle
          </button>
          {reclamo.estadoRemito === 'conflicto' && (
            <button className="btn btn-danger mb-2" onClick={() => handleClienteDesbloqueado(reclamo)}>
              Cliente Desbloqueado
            </button>
          )}
          {reclamo.estadoRemito === 'resuelto' && (
            <button className="btn btn-danger mb-2" onClick={() => handleRemitoRetenido(reclamo)}>
              Remito Retenido
            </button>
          )}
          {reclamo.estadoRemito === 'retenido deuda' && (
            <button className="btn btn-info mb-2" onClick={() => handleClienteDesbloqueado(reclamo)}>
              Cliente Desbloqueado
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (error) {
    return <div className="alert alert-danger" role="alert">{error}</div>;
  }

  return (
    <div className="container mt-5">
      <UserState username={username} role={role} onLogout={onLogout} />
      <h1 className="mb-4">Gestor de Reclamos - Administración</h1>
      <LeyendaAdministracion /> {/* Agrega el componente LeyendaAdministracion aquí */}
      <div className="row">
        {reclamos.length === 0 ? (
          <p>No hay reclamos con estado de remito en conflicto o que exista remito en algún reclamo.</p>
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
