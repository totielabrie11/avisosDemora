import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import UserState from './UserState';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { parse, isBefore, startOfDay } from 'date-fns';
import VistaDetalleAlmacen from './VistaDetalleAlmacen'; // Importar el nuevo componente

const GestorAlmacenes = ({ token, username, role, onLogout }) => {
  const [reclamos, setReclamos] = useState([]);
  const [urgenteCount, setUrgenteCount] = useState(0);
  const [regularCount, setRegularCount] = useState(0);
  const [vencidoCount, setVencidoCount] = useState(0);
  const [abiertosCount, setAbiertosCount] = useState(0);
  const [noVencidoCount, setNoVencidoCount] = useState(0);
  const [selectedReclamo, setSelectedReclamo] = useState(null);
  const [fechaEntrega, setFechaEntrega] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false); // Estado para el modal de detalles

  function generateId() {
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    return `${randomNumber}${randomLetter}`;
  }

  useEffect(() => {
    const fetchReclamos = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/v1/reclamos', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data;

        const reclamosConId = data
          .filter(reclamo => reclamo.estado !== 'cerrado')
          .map(reclamo => ({
            ...reclamo,
            id: reclamo.id || generateId()
          }));

        const urgenteReclamos = reclamosConId.filter(r => r.prioridad === 'Urgente');
        const regularReclamos = reclamosConId.filter(r => r.prioridad === 'Regular');
        const vencidoReclamos = reclamosConId.filter(r => r.estado === 'vencido');
        const noVencidoReclamos = reclamosConId.filter(r => r.estado === 'no vencido');
        const abiertosReclamos = reclamosConId.filter(r => r.estado !== 'respondido');

        setReclamos(reclamosConId);
        setUrgenteCount(urgenteReclamos.length);
        setRegularCount(regularReclamos.length);
        setVencidoCount(vencidoReclamos.length);
        setNoVencidoCount(noVencidoReclamos.length);
        setAbiertosCount(abiertosReclamos.length);
      } catch (error) {
        console.error('Error fetching reclamos:', error);
      }
    };

    fetchReclamos();
  }, [token]);

  const handleResponder = reclamo => {
    setSelectedReclamo(reclamo);
    setShowModal(true);
  };

  const handleFechaEntregaChange = date => {
    setFechaEntrega(date);
  };

  const handleEnviarRespuesta = async () => {
    setShowModal(false);
    if (selectedReclamo && fechaEntrega) {
      const updatedReclamo = {
        estado: 'respondido',
        respuesta: `Se entregará en la fecha ${fechaEntrega.toLocaleDateString()}`,
        usernameAlmacen: username
      };

      try {
        const response = await axios.put(`http://localhost:3000/api/v1/reclamos/${selectedReclamo.id}`, {
          ...updatedReclamo,
          subId: selectedReclamo.subId
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 200) {
          setReclamos(prev => 
            prev.map(r => (r.id === selectedReclamo.id ? { ...r, ...updatedReclamo } : r))
          );
          setSelectedReclamo(null);
          setFechaEntrega(null);
        }
      } catch (error) {
        console.error('Error enviando la respuesta:', error);
        alert('No se pudo actualizar el reclamo. Por favor, intente de nuevo.');
      }
    }
  };

  const validarFecha = (respuesta) => {
    const fechaActual = startOfDay(new Date());
    const fechaMatch = respuesta ? respuesta.match(/(\d{1,2}\/\d{1,2}\/\d{4})/) : null;
    if (fechaMatch) {
      const fechaRespuesta = parse(fechaMatch[0], 'd/M/yyyy', new Date());
      const fechaRespuestaStartOfDay = startOfDay(fechaRespuesta);
      return isBefore(fechaRespuestaStartOfDay, fechaActual);
    }
    return false;
  };

  const handleVerDetalle = reclamo => {
    console.log('Reclamo seleccionado para ver detalle:', reclamo);
    setSelectedReclamo(reclamo);
    setShowDetalleModal(true);
  };

  return (
    <div className="container mt-5">
      <UserState username={username} role={role} onLogout={onLogout} />
      <h1>Gestor de Reclamos - Almacenes</h1>
      <h2>Total Reclamos: {reclamos.length}</h2>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Urgente: {urgenteCount}</h2>
        <h2>Regular: {regularCount}</h2>
        <h2>Vencido: {vencidoCount}</h2>
        <h2>No Vencido: {noVencidoCount}</h2>
        <h2>Sin Responder: {abiertosCount}</h2>
      </div>
        <div className="row">
          {reclamos.map((reclamo, idx) => (
            <div
              key={idx}
              className={`col-md-4 mb-4 card ${
                reclamo.estado === 'respondido' ? 'bg-success' :
                reclamo.prioridad === 'Urgente' ? 'bg-danger' :
                'bg-warning'
              } text-white`}
            >
            <div className="card-body">
              <h5 className="card-title">{reclamo.pedido} - {reclamo.cliente}</h5>
              <p className="card-text"><strong>Reclamo: </strong>{reclamo.mensaje}</p>
              <p className="card-text">
                <small>
                  <strong>Estado:</strong> {reclamo.estado}<br />
                  <strong>Prioridad:</strong> {reclamo.prioridad}<br />
                  <strong>Fecha:</strong> {reclamo.fecha}<br />
                  <strong>Reportado por:</strong> {reclamo.username}<br />
                  <strong>Respuesta:</strong> 
                  <span className={`card-text ${validarFecha(reclamo.respuesta) ? 'text-danger' : ''}`}>
                    {reclamo.respuesta || 'No hay respuesta aún'}
                  </span>
                </small>
              </p>
              {validarFecha(reclamo.respuesta) && (
                <p className="text-danger">La respuesta enviada se encuentra vencida</p>
              )}
              {!reclamo.respuesta && (
                <button className="btn btn-primary" onClick={() => handleResponder(reclamo)}>
                  Responder
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => handleVerDetalle(reclamo)}>
                Ver Detalle
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Responder a Reclamo: {selectedReclamo?.pedido}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <DatePicker
            selected={fechaEntrega}
            onChange={handleFechaEntregaChange}
            minDate={new Date()}
            placeholderText="Selecciona una fecha de entrega"
            dateFormat="dd-MM-yyyy"
            className="form-control mb-2"
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cerrar
          </Button>
          <Button variant="success" onClick={handleEnviarRespuesta}>
            Enviar Respuesta
          </Button>
        </Modal.Footer>
      </Modal>

      <VistaDetalleAlmacen
        show={showDetalleModal}
        onHide={() => setShowDetalleModal(false)}
        reclamo={selectedReclamo}
      />
    </div>
  );
};

export default GestorAlmacenes;
