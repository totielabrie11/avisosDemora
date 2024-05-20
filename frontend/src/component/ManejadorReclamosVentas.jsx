import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { parse, isBefore, startOfDay } from 'date-fns';
import 'bootstrap/dist/css/bootstrap.min.css';
import VistaDetalleAlmacen from './VistaDetalleAlmacen';

const ManejadorReclamosVentas = ({ token, username, role }) => {
  const [reclamos, setReclamos] = useState([]);
  const [selectedReclamo, setSelectedReclamo] = useState(null);
  const [error, setError] = useState(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todos');
  const [vencidosCount, setVencidosCount] = useState(0);
  const [todosCount, setTodosCount] = useState(0);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchReclamos = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/v1/reclamos', {
          headers: { Authorization: `Bearer ${token}` },
        });

        let reclamosFiltrados = response.data.filter(r => r.estado === 'respondido' || 'remito enviado');
        if (role !== 'administrador') {
          reclamosFiltrados = reclamosFiltrados.filter(r => r.username === username);
        }
        setReclamos(reclamosFiltrados);
        setTodosCount(reclamosFiltrados.length);
        setVencidosCount(reclamosFiltrados.filter(r => validarFecha(r)).length);
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

  const validarFecha = (reclamo) => {
    const fechaActual = startOfDay(new Date());
    const fechaMatch = reclamo.respuesta.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    if (fechaMatch) {
      const fechaRespuesta = parse(fechaMatch[0], 'd/M/yyyy', new Date());
      const fechaRespuestaStartOfDay = startOfDay(fechaRespuesta);
      return isBefore(fechaRespuestaStartOfDay, fechaActual);
    }
    return false;
  };

  const handleCategoriaClick = (categoria) => {
    setCategoriaSeleccionada(categoria);
  };

  const filtrarReclamos = () => {
    switch (categoriaSeleccionada) {
      case 'vencidos':
        return reclamos.filter(r => validarFecha(r));
      case 'todos':
      default:
        return reclamos;
    }
  };

  const handleShowModal = (reclamo) => {
    setSelectedReclamo(reclamo);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedReclamo(null);
    setShowModal(false);
  };

  if (error) {
    return <div className="alert alert-danger" role="alert">{error}</div>;
  }

  return (
    <div className="container mt-5">
      <h1>En situación de Reclamo</h1>
      <div className="mb-4">
        <div className="row text-center">
          <div className="col-md-2" onClick={() => handleCategoriaClick('todos')} style={{ cursor: 'pointer' }}>
            <div className="card bg-primary text-white">
              <div className="card-body">
                <h5 className="card-title">Todos</h5>
                <p className="card-text">{todosCount}</p>
              </div>
            </div>
          </div>
          <div className="col-md-2" onClick={() => handleCategoriaClick('vencidos')} style={{ cursor: 'pointer' }}>
            <div className="card bg-danger text-white">
              <div className="card-body">
                <h5 className="card-title">Vencidos</h5>
                <p className="card-text">{vencidosCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        {filtrarReclamos().map((reclamo, index) => (
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
                    <span className={`card-text ${validarFecha(reclamo) ? 'text-danger' : ''}`}> {reclamo.respuesta}</span>
                  </strong>
                </small>
              </p>
              <button className="btn btn-primary mt-2" onClick={() => handleShowModal(reclamo)}>Ver Detalle</button>
              <button className="btn btn-danger mt-2" onClick={() => cerrarReclamo(reclamo)}>Cerrar Reclamo</button>
            </div>
          </div>
        ))}
      </div>

      {selectedReclamo && (
        <VistaDetalleAlmacen
          show={showModal}
          onHide={handleCloseModal}
          reclamo={selectedReclamo}
        />
      )}
    </div>
  );
};

export default ManejadorReclamosVentas;
