import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import UserState from './UserState';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { parse, isBefore, startOfDay } from 'date-fns';
import VistaDetalleAlmacen from './VistaDetalleAlmacen';
import EnvioDeRemito from './EnvioDeRemito';

const GestorAlmacenes = ({ token, username, role, onLogout }) => {
  const [reclamos, setReclamos] = useState([]);
  const [urgenteCount, setUrgenteCount] = useState(0);
  const [regularCount, setRegularCount] = useState(0);
  const [vencidoCount, setVencidoCount] = useState(0);
  const [abiertosCount, setAbiertosCount] = useState(0);
  const [noVencidoCount, setNoVencidoCount] = useState(0);
  const [fechaVencidaCount, setFechaVencidaCount] = useState(0);
  const [conRemitoCount, setConRemitoCount] = useState(0); // Nuevo estado para contar los reclamos con remito
  const [selectedReclamo, setSelectedReclamo] = useState(null);
  const [fechaEntrega, setFechaEntrega] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todos');
  const [showEnvioModal, setShowEnvioModal] = useState(false);
  
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

        setReclamos(reclamosConId);
        actualizarContadores(reclamosConId);
      } catch (error) {
        console.error('Error fetching reclamos:', error);
      }
    };

    fetchReclamos();
  }, [token]);

  const actualizarContadores = (reclamos) => {
    const urgenteReclamos = reclamos.filter(r => r.prioridad === 'Urgente');
    const regularReclamos = reclamos.filter(r => r.prioridad === 'Regular');
    const vencidoReclamos = reclamos.filter(r => r.estado === 'vencido');
    const noVencidoReclamos = reclamos.filter(r => r.estado === 'no vencido');
    const abiertosReclamos = reclamos.filter(r => r.estado !== 'respondido' && r.estado !== 'remito enviado');
    const fechaVencidaReclamos = reclamos.filter(r => validarFecha(r.respuesta));
    const conRemitoReclamos = reclamos.filter(r => r.estado === 'remito enviado');

    setUrgenteCount(urgenteReclamos.length);
    setRegularCount(regularReclamos.length);
    setVencidoCount(vencidoReclamos.length);
    setNoVencidoCount(noVencidoReclamos.length);
    setAbiertosCount(abiertosReclamos.length);
    setFechaVencidaCount(fechaVencidaReclamos.length);
    setConRemitoCount(conRemitoReclamos.length);
  };

  

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
          const updatedReclamos = reclamos.map(r => (r.id === selectedReclamo.id ? { ...r, ...updatedReclamo } : r));
          setReclamos(updatedReclamos);
          actualizarContadores(updatedReclamos);
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

  const handleCategoriaClick = categoria => {
    setCategoriaSeleccionada(categoria);
  };

  const filtrarReclamos = () => {
    switch (categoriaSeleccionada) {
        case 'urgente':
            return reclamos.filter(r => r.prioridad === 'Urgente');
        case 'regular':
            return reclamos.filter(r => r.prioridad === 'Regular');
        case 'vencido':
            return reclamos.filter(r => r.estado === 'vencido');
        case 'noVencido':
            return reclamos.filter(r => r.estado === 'no vencido');
        case 'sinResponder':
            return reclamos.filter(r => r.estado !== 'respondido' && r.estado !== 'remito enviado');
        case 'fechaVencida':
            return reclamos.filter(r => validarFecha(r.respuesta));
        case 'conRemito':
            return reclamos.filter(r => r.estado === 'remito enviado');
        case 'todos':
        default:
            return reclamos;
    }
};


  const handleRemitoSubmitSuccess = async (numeroRemito) => {
    if (selectedReclamo) {
      try {
        const response = await axios.put(`http://localhost:3000/api/v1/reclamos/${selectedReclamo.id}`, {
          estado: 'remito enviado',
          respuesta: `Remito enviado con número ${numeroRemito}`,
          subId: selectedReclamo.subId,
          usernameAlmacen: username,
          remito: numeroRemito
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 200) {
          const updatedReclamos = reclamos.map(r => 
            r.id === selectedReclamo.id 
              ? { 
                  ...r, 
                  estado: 'remito enviado', 
                  respuesta: `Remito enviado con número ${numeroRemito}`, 
                  remito: numeroRemito 
                } 
              : r
          );
          setReclamos(updatedReclamos);
          actualizarContadores(updatedReclamos);
          setSelectedReclamo(null);
          setShowEnvioModal(false);
        }
      } catch (error) {
        console.error('Error actualizando el reclamo:', error);
        alert('No se pudo actualizar el reclamo. Por favor, intente de nuevo.');
      }
    }
  };

  return (
    <div className="container mt-5">
      <UserState username={username} role={role} onLogout={onLogout} />
      <h1 className="mb-4">Gestor de Reclamos - Almacenes</h1>
      <div className="mb-4">
        <h3>Prioridad:</h3>
        <div className="row text-center">
          <div className="col-md-2" onClick={() => handleCategoriaClick('todos')} style={{ cursor: 'pointer' }}>
            <div className="card bg-primary text-white">
              <div className="card-body">
                <h5 className="card-title">Total Reclamos</h5>
                <p className="card-text">{reclamos.length}</p>
              </div>
            </div>
          </div>
          <div className="col-md-2" onClick={() => handleCategoriaClick('urgente')} style={{ cursor: 'pointer' }}>
            <div className="card bg-danger text-white">
              <div className="card-body">
                <h5 className="card-title">Urgente</h5>
                <p className="card-text">{urgenteCount}</p>
              </div>
            </div>
          </div>
          <div className="col-md-2" onClick={() => handleCategoriaClick('regular')} style={{ cursor: 'pointer' }}>
            <div className="card bg-warning text-white">
              <div className="card-body">
                <h5 className="card-title">Regular</h5>
                <p className="card-text">{regularCount}</p>
              </div>
            </div>
          </div>
          <div className="col-md-2" onClick={() => handleCategoriaClick('noVencido')} style={{ cursor: 'pointer' }}>
            <div className="card text-white" style={{ backgroundColor: '#1FE81F' }} >
              <div className="card-body">
                <h5 className="card-title">No Vencido</h5>
                <p className="card-text">{noVencidoCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h3>Estado del Pedido:</h3>
        <div className="row text-center">
          <div className="col-md-2" onClick={() => handleCategoriaClick('vencido')} style={{ cursor: 'pointer' }}>
            <div className="card bg-dark text-white">
              <div className="card-body">
                <h5 className="card-title">Vencido</h5>
                <p className="card-text">{vencidoCount}</p>
              </div>
            </div>
          </div>
          <div className="col-md-2" onClick={() => handleCategoriaClick('sinResponder')} style={{ cursor: 'pointer' }}>
            <div className="card bg-info text-white">
              <div className="card-body">
                <h5 className="card-title">Sin Responder</h5>
                <p className="card-text">{abiertosCount}</p>
              </div>
            </div>
          </div>
          <div className="col-md-2" onClick={() => handleCategoriaClick('conRemito')} style={{ cursor: 'pointer' }}>
            <div className="card bg-success text-white">
              <div className="card-body">
                <h5 className="card-title">Con Remito</h5>
                <p className="card-text">{conRemitoCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h3>Fecha Prometida:</h3>
        <div className="row text-center">
          <div className="col-md-2" onClick={() => handleCategoriaClick('fechaVencida')} style={{ cursor: 'pointer' }}>
            <div className="card bg-danger text-white">
              <div className="card-body">
                <h5 className="card-title">Fecha Vencida</h5>
                <p className="card-text">{fechaVencidaCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {filtrarReclamos().map((reclamo, idx) => (
          <div
            key={idx}
            className={`col-md-4 mb-4 card ${
              reclamo.estado === 'respondido' ? 'bg-success' :
              reclamo.estado === 'no vencido' ? '' :
              reclamo.prioridad === 'Urgente' ? 'bg-danger' :
              'bg-warning'
            } text-white`}
            style={reclamo.estado === 'no vencido' ? { backgroundColor: '#1FE81F' } : {}}
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
              <div className="d-flex flex-column">
                  {!reclamo.respuesta && reclamo.estado !== 'remito enviado' && (
                      <button className="btn btn-primary mb-2" onClick={() => handleResponder(reclamo)}>
                          Responder
                      </button>
                  )}
                  <button className="btn btn-secondary mb-2" onClick={() => handleVerDetalle(reclamo)}>
                      Ver Detalle
                  </button>
                  {reclamo.estado !== 'remito enviado' && (
                      <button className="btn btn-primary" onClick={() => { setSelectedReclamo(reclamo); setShowEnvioModal(true); }}>
                          Enviar Remito
                      </button>
                  )}
              </div>
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

      <Modal show={showEnvioModal} onHide={() => setShowEnvioModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Enviar Remito</Modal.Title>
        </Modal.Header>
        <Modal.Body>
        <EnvioDeRemito
             id={selectedReclamo?.id}
             subId={selectedReclamo?.subId}
             onRemitoEnviado={handleRemitoSubmitSuccess}
             token={token}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEnvioModal(false)}>
            Cerrar
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
