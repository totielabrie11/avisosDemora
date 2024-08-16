import React, { useEffect, useState, useCallback } from 'react';
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
import ProblemaRemitoButton from './ProblemaRemitoButton';
import LiberarPedidoButton from './LiberarPedidoButton';
import MostrarTareasPendientes from './MostrarTareasPendientes';
import HistorialReclamos from './HistorialReclamos';
import ContadorFechasEntregaPorPedido from './ContadorFechasEntregaPorPedido';
import LeyendaAlmacen from './leyendas/LeyendaAlmacen';
import RespuestaContenidoParcial from './RespuestaContenidoParcial';
import { BACKEND_URL } from '../config';

const GestorAlmacenes = ({ token, username, role, onLogout }) => {
  const [reclamos, setReclamos] = useState([]);
  const [urgenteCount, setUrgenteCount] = useState(0);
  const [regularCount, setRegularCount] = useState(0);
  const [vencidoCount, setVencidoCount] = useState(0);
  const [abiertosCount, setAbiertosCount] = useState(0);
  const [noVencidoCount, setNoVencidoCount] = useState(0);
  const [fechaVencidaCount, setFechaVencidaCount] = useState(0);
  const [conRemitoCount, setConRemitoCount] = useState(0);
  const [selectedReclamo, setSelectedReclamo] = useState(null);
  const [fechaEntrega, setFechaEntrega] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todos');
  const [showEnvioModal, setShowEnvioModal] = useState(false);
  const [tareasPendientes, setTareasPendientes] = useState([]);
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [pedidoId, setPedidoId] = useState(null);
  const [tipoRespuesta, setTipoRespuesta] = useState('fecha'); 
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const generateId = () => {
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    return `${randomNumber}${randomLetter}`;
  };

  const actualizarContadores = useCallback((reclamos) => {
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
  }, []);

  useEffect(() => {
    const fetchReclamos = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/v1/reclamos`, {
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
        const tareas = reclamosConId.filter(r => r.pedidoEstado === '' && r.respuesta);
        setTareasPendientes(tareas);
      } catch (error) {
        console.error('Error fetching reclamos:', error);
        setReclamos([]);
      }
    };

    fetchReclamos();
  }, [token, actualizarContadores]);

  const handleResponder = reclamo => {
    setSelectedReclamo(reclamo);
    setShowModal(true);
  };

  const handleFechaEntregaChange = date => {
    setFechaEntrega(date);
  };

  const handleEnviarRespuesta = async () => {
    setSuccessMessage('');
    setErrorMessage('');
    setShowModal(false);

    if (selectedReclamo) {
      let updatedReclamo;

      if (tipoRespuesta === 'fecha' && fechaEntrega) {
        updatedReclamo = {
          estado: 'respondido',
          respuesta: `Se entregará en la fecha ${fechaEntrega.toLocaleDateString()}`,
          usernameAlmacen: username
        };
      } else if (tipoRespuesta === 'material_sin_remito') {
        updatedReclamo = {
          estado: 'respondido',
          respuesta: 'Material preparado pero sin remito',
          usernameAlmacen: username
        };
      } else if (tipoRespuesta === 'contenido_parcial') {
        // Aquí se maneja la lógica para el tipo de respuesta "contenido_parcial"
        updatedReclamo = {
          estado: 'respondido',
          respuesta: 'Contenido parcial enviado',
          usernameAlmacen: username,
        };
      } else {
        return;
      }

      try {
        const response = await axios.put(
          `${BACKEND_URL}/api/v1/reclamos/${selectedReclamo.id}`,
          { ...updatedReclamo, subId: selectedReclamo.subId },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.status === 200) {
          setSuccessMessage('Respuesta enviada exitosamente.');
          setReclamos((prev) =>
            prev.map((r) =>
              r.id === selectedReclamo.id ? { ...r, ...updatedReclamo } : r
            )
          );
        }
      } catch (error) {
        console.error('Error enviando la respuesta:', error);
        setErrorMessage(`Error al enviar la respuesta: ${error.message}`);
      }
    }
  };

  const handleEnviarRespuestaParcial = async (selectedItems) => {
    setSuccessMessage('');
    setErrorMessage('');
    setShowModal(false);

    if (selectedReclamo) {
      try {
        const response = await axios.put(
          `${BACKEND_URL}/api/v1/reclamos/${selectedReclamo.id}`,
          {
            estado: 'respondido',
            respuesta: selectedItems.map(
              item => `Item: ${item.descripcion}, Fecha Entrega: ${item.fechaEntrega.toLocaleDateString()}`
            ).join(' | '),
            usernameAlmacen: username,
            subId: selectedReclamo.subId,
            material: selectedItems.map(item => ({
              codigo: item.codigo,
              cantidad: item.cantidad,
              descripcion: item.descripcion,
              fechaVencimiento: item.fechaEntrega.toLocaleDateString(),
            }))
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.status === 200) {
          const updatedReclamos = reclamos.map(r =>
            r.id === selectedReclamo.id
              ? {
                ...r,
                estado: 'respondido',
                respuesta: selectedItems.map(
                  item => `Item: ${item.descripcion}, Fecha Entrega: ${item.fechaEntrega.toLocaleDateString()}`
                ).join(' | '),
                material: selectedItems.map(item => ({
                  codigo: item.codigo,
                  cantidad: item.cantidad,
                  descripcion: item.descripcion,
                  fechaVencimiento: item.fechaEntrega.toLocaleDateString(),
                }))
              }
              : r
          );
          setReclamos(updatedReclamos);
          actualizarContadores(updatedReclamos);
          setSelectedReclamo(null);
          setFechaEntrega(null);
          const tareas = updatedReclamos.filter(r => r.pedidoEstado === '' && r.respuesta);
          setTareasPendientes(tareas);

          setSuccessMessage('Respuesta parcial enviada exitosamente.');
        }
      } catch (error) {
        console.error('Error enviando la respuesta parcial:', error);
        setErrorMessage(`Error al enviar la respuesta parcial: ${error.message}`);
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
    setSelectedReclamo(reclamo);
    setShowDetalleModal(true);
  };

  const handleCategoriaClick = categoria => {
    setCategoriaSeleccionada(categoria);
  };

  const filtrarReclamos = () => {
    const reclamosFiltrados = reclamos ? reclamos : [];
    switch (categoriaSeleccionada) {
      case 'urgente':
        return reclamosFiltrados.filter(r => r.prioridad === 'Urgente');
      case 'regular':
        return reclamosFiltrados.filter(r => r.prioridad === 'Regular');
      case 'vencido':
        return reclamosFiltrados.filter(r => r.estado === 'vencido');
      case 'noVencido':
        return reclamosFiltrados.filter(r => r.estado === 'no vencido');
      case 'sinResponder':
        return reclamosFiltrados.filter(r => r.estado !== 'respondido' && r.estado !== 'remito enviado');
      case 'fechaVencida':
        return reclamosFiltrados.filter(r => validarFecha(r.respuesta));
      case 'conRemito':
        return reclamosFiltrados.filter(r => r.estado === 'remito enviado');
      case 'todos':
      default:
        return reclamosFiltrados;
    }
  };

  const handleRemitoSubmitSuccess = async (numeroRemito) => {
    setSuccessMessage('');
    setErrorMessage('');

    if (selectedReclamo) {
      try {
        const response = await axios.put(`${BACKEND_URL}/api/v1/reclamos/${selectedReclamo.id}`, {
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
          const tareas = updatedReclamos.filter(r => r.pedidoEstado === '' && r.respuesta);
          setTareasPendientes(tareas);

          setSuccessMessage('Remito enviado exitosamente.');
        }
      } catch (error) {
        console.error('Error enviando el remito:', error);
        setErrorMessage(`Error al enviar el remito: ${error.message}`);
      }
    }
  };

  const handleProblemaReportado = (updatedReclamo) => {
    const updatedReclamos = reclamos.map(r =>
      r.id === updatedReclamo.id ? updatedReclamo : r
    );
    setReclamos(updatedReclamos);
    actualizarContadores(updatedReclamos);
    const tareas = updatedReclamos.filter(r => r.pedidoEstado === '' && r.respuesta);
    setTareasPendientes(tareas);
  };

  const ReclamoCard = ({ reclamo }) => (
    <div
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
          <strong>Respuesta: </strong>
          <strong><span className={`card-text ${validarFecha(reclamo.respuesta) ? 'text-danger' : ''}`}>
            {reclamo.respuesta || 'No hay respuesta aún'}
          </span></strong>
        </p>
  
        {validarFecha(reclamo.respuesta) && (
          <strong><p className="text-danger">La respuesta enviada se encuentra vencida</p></strong>
        )}
        <div className="card-text">
          {reclamo.estado === 'no vencido' && reclamo.material.some(m => new Date(m.fechaVencimiento) > new Date()) && (
            <div className="text-dark">La fecha de entrega vence pronto: {reclamo.material.find(m => new Date(m.fechaVencimiento) > new Date()).fechaVencimiento}</div>
          )}
          {reclamo.estado === 'vencido' && (
            <div className="text-dark">La fecha de entrega ha vencido: {reclamo.material.map(m => m.fechaVencimiento).join(', ')}</div>
          )}
          {reclamo.estadoRemito === 'conflicto' && (
            <div className="text-dark">Ha reportado inconveniente en la confección del remito, espere mientras administración lo libere.</div>
          )}
          {reclamo.bloqueado === 'crédito' && (
            <div className="text-dark">Ha reportado un problema de liberación de elementos dentro de este pedido, aguarde mientras ventas lo resuelve.</div>
          )}
          {reclamo.pedidoEstado === 'activacionTotal' && (
            <div className="text-dark">Ha solicitado a ventas la liberación del pedido completo, aguarde hasta que se resuelva para avanzar.</div>
          )}
          {reclamo.pedidoEstado === 'activacionParcial' && (
            <div className="text-dark">Ha solicitado a ventas la activación parcial del pedido, aguarde hasta que se resuelva para avanzar.</div>
          )}
          {reclamo.pedidoEstado === 'cambioCodigoInterno' && (
            <div className="text-dark">Ha solicitado a ventas la corrección del código interno, aguarde hasta que se resuelva para avanzar.</div>
          )}
          {reclamo.estadoRemito === 'resuelto' && (
            <div className="text-dark">Tarea finalizada por administración</div>
          )}
          {reclamo.pedidoEstado === '' && (
            <div className="text-dark">Tarea finalizada por ventas</div>
          )}
        </div>
        <div className="d-flex flex-column">
          <button className="btn btn-primary mb-2" onClick={() => handleResponder(reclamo)}>
            Responder
          </button>
          <button className="btn btn-secondary mb-2" onClick={() => handleVerDetalle(reclamo)}>
            Ver Detalle
          </button>
          {reclamo.estado !== 'remito enviado' && (
            <button className="btn btn-primary mb-2" onClick={() => { setSelectedReclamo(reclamo); setShowEnvioModal(true); }}>
              Enviar Remito
            </button>
          )}
          <ProblemaRemitoButton
            reclamo={reclamo}
            token={token}
            onProblemaReportado={handleProblemaReportado}
            username={username}  
          />

          <LiberarPedidoButton
            reclamo={reclamo}
            token={token}
            onProblemaReportado={handleProblemaReportado}
          />
          <button className="btn btn-info mb-2" onClick={() => { setPedidoId(reclamo.pedido); setShowHistorialModal(true); }}>
            Ver Historial
          </button>
          <ContadorFechasEntregaPorPedido token={token} pedidoId={reclamo.pedido} /> 
        </div>
      </div>
    </div>
  );

  const reclamosFiltrados = filtrarReclamos();

  return (
    <div className="container mt-5">
      <UserState username={username} role={role} onLogout={onLogout} />
      <MostrarTareasPendientes tareasPendientes={tareasPendientes} />
      <h1 className="mb-4">Gestor de Reclamos - Almacenes</h1>
      <LeyendaAlmacen /> 
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

      {successMessage && <div className="alert alert-success">{successMessage}</div>}
      {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

      <div className="row">
        {reclamosFiltrados.map((reclamo, idx) => (
          <ReclamoCard
            key={`${idx}`}
            reclamo={reclamo}
            handleResponder={handleResponder}
            handleVerDetalle={handleVerDetalle}
            validarFecha={validarFecha}
            setSelectedReclamo={setSelectedReclamo}
            setShowEnvioModal={setShowEnvioModal}
            token={token}
            handleProblemaReportado={handleProblemaReportado}
          />
        ))}
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Responder a Reclamo: {selectedReclamo?.pedido}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="form-group mb-2">
            <label htmlFor="tipoRespuesta">Tipo de Respuesta:</label>
            <select
              id="tipoRespuesta"
              className="form-control"
              value={tipoRespuesta}
              onChange={e => setTipoRespuesta(e.target.value)}
            >
              <option value="fecha">Fecha de Entrega</option>
              <option value="material_sin_remito">Material preparado pero sin remito</option>
              <option value="contenido_parcial">Contenido Parcial</option>
            </select>
          </div>
          {tipoRespuesta === 'fecha' && (
            <DatePicker
              selected={fechaEntrega}
              onChange={handleFechaEntregaChange}
              minDate={new Date()}
              placeholderText="Selecciona una fecha de entrega"
              dateFormat="dd-MM-yyyy"
              className="form-control mb-2"
            />
          )}
          {tipoRespuesta === 'contenido_parcial' && (
            <RespuestaContenidoParcial
              reclamo={selectedReclamo}
              onConfirm={handleEnviarRespuestaParcial}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cerrar
          </Button>
          {tipoRespuesta !== 'contenido_parcial' && (
            <Button variant="success" onClick={handleEnviarRespuesta}>
              Enviar Respuesta
            </Button>
          )}
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

      <HistorialReclamos pedidoId={pedidoId} token={token} showModal={showHistorialModal} handleClose={() => setShowHistorialModal(false)} />

      <VistaDetalleAlmacen
        show={showDetalleModal}
        onHide={() => setShowDetalleModal(false)}
        reclamo={selectedReclamo}
      />
    </div>
  );
};

export default GestorAlmacenes;
