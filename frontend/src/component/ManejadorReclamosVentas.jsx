import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { parse, isBefore, startOfDay } from 'date-fns';
import 'bootstrap/dist/css/bootstrap.min.css';

const ManejadorReclamosVentas = ({ token, username, role }) => {
  const [reclamos, setReclamos] = useState([]);
  const [selectedReclamo, setSelectedReclamo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReclamos = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/v1/reclamos', {
          headers: { Authorization: `Bearer ${token}` },
        });

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
  }, [token, username, role]);

  const cerrarReclamo = async (reclamo) => {
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

    const updatedReclamo = {
      estado: 'cerrado',
      respuesta: `Reclamo cerrado con remito número: ${remitoNumero}`,
      subId: reclamo.subId // Asegurarnos de que el subId esté presente
    };

    try {
      const response = await axios.put(`http://localhost:3000/api/v1/reclamos/${reclamo.id}`, updatedReclamo, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 200) {
        setReclamos(prev =>
          prev.map(r => (r.id === reclamo.id ? { ...r, ...updatedReclamo } : r))
        );
        setSelectedReclamo(null);
        alert("Reclamo cerrado exitosamente");
      }
    } catch (error) {
      console.error('Error cerrando el reclamo:', error);
      alert('No se pudo cerrar el reclamo. Por favor, intente de nuevo.');
    }
  };

  if (error) {
    return <div className="alert alert-danger" role="alert">{error}</div>;
  }

  const validarFecha = (reclamo) => {
    const fechaActual = startOfDay(new Date());
    const fechaMatch = reclamo.respuesta.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    if (fechaMatch) {
      const fechaRespuesta = parse(fechaMatch[0], 'd/M/yyyy', new Date());
      const fechaRespuestaStartOfDay = startOfDay(fechaRespuesta);
      if (isBefore(fechaRespuestaStartOfDay, fechaActual)) {
        alert(`Tienes la fecha del PV ${reclamo.pedido} vencida - requiere su atención`);
        return 'text-danger'; // Clases de Bootstrap para texto rojo
      }
    }
    return '';
  };

  return (
    <div className="container mt-5">
      <h1>En situación de Reclamo</h1>
      <div className="row">
        {reclamos.map((reclamo, index) => (
          <div key={index} className="col-md-4 mb-4 card bg-secondary text-white">
            <div className="card-body">
              <h5 className="card-title">{reclamo.pedido} - {reclamo.cliente}</h5>
              <p className="card-text"><strong>Reclamo:</strong> {reclamo.mensaje}</p>
              <small><strong>Emitido por:</strong> {reclamo.username}</small>
              <p className='card-text'>
              <small>
                <strong>Estado:</strong> {reclamo.estado}<br />
                <strong>Fecha:</strong> {reclamo.fecha}<br />
                <strong>Atendido por:</strong> {reclamo.usernameAlmacen}<br />
                <strong>
                  Respuesta:
                  <span className={`card-text ${validarFecha(reclamo)}`}>{reclamo.respuesta}</span>
                </strong>
              </small>
              </p>
              <button className="btn btn-danger mt-2" onClick={() => cerrarReclamo(reclamo)}>Cerrar Reclamo</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManejadorReclamosVentas;





