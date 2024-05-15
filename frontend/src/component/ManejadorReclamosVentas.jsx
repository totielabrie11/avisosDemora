// ManejadorReclamosVentas.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const ManejadorReclamosVentas = ({ token, username, role }) => {  // Aceptar role como prop
  const [reclamos, setReclamos] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReclamos = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/v1/reclamos', {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Verifica si el usuario es administrador para filtrar los reclamos
        let reclamosFiltrados = response.data.filter(r => r.estado === 'respondido');
        if (role !== 'administrador') {
          reclamosFiltrados = reclamosFiltrados.filter(r => r.username === username);
        }
        setReclamos(reclamosFiltrados);
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
  }, [token, username, role]);  // Incluye role en las dependencias del useEffect

  const cerrarReclamo = (reclamoId) => {
    const remito = prompt("Indique número de remito que cierra el reclamo:");
    if (!remito) {
      alert("No se ingresó ningún número de remito.");
      return;
    }

    const remitoNumero = Number(remito);
    if (isNaN(remitoNumero)) {
      alert("El valor ingresado no es un número válido.");
      return;
    }

    alert("Reclamo cerrado exitosamente");
    // Aquí podrías llamar a una API para cerrar el reclamo y luego actualizar el estado de reclamos
  };

  if (error) {
    return <div className="alert alert-danger" role="alert">{error}</div>;
  }

  return (
    <div className="container mt-5">
      <h1>Reclamos Respondidos</h1>
      <div className="row">
        {reclamos.map((reclamo, index) => (
          <div key={index} className="col-md-4 mb-4 card bg-secondary text-white">
            <div className="card-body">
              <h5 className="card-title">{reclamo.pedido} - {reclamo.cliente}</h5>
              <p className="card-text"><strong>Reclamo:</strong> {reclamo.mensaje}</p>
              <small><strong>Emitido por:</strong> {reclamo.username}</small>
              <p className="card-text">
                <small>
                  <strong>Estado:</strong> {reclamo.estado}<br />
                  <strong>Fecha:</strong> {reclamo.respuesta}<br />
                  <strong>Atendido por:</strong> {reclamo.usernameAlmacen}
                </small>
              </p>
              <button className="btn btn-danger mt-2" onClick={() => cerrarReclamo(reclamo.id)}>Cerrar Reclamo</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManejadorReclamosVentas;





