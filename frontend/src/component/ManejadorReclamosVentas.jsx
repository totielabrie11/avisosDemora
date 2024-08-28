import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import HistorialReclamos from './HistorialReclamos';
import VistaDetalleAlmacen from './VistaDetalleAlmacen';
import EnvioDeEmail from './EnvioDeEmail';
import EnvioDeEmailVentasContraReclamo from './EnvioDeEmailVentasContraReclamo';
import MostrarTareasPendientes from './MostrarTareasPendientes';
import CerrarReclamoButton from './CerrarReclamoButton';
import ContadorFechasEntregaPorPedido from './ContadorFechasEntregaPorPedido';
import ContadorCorreosPorTipo from './ContadorCorreosPorTipo';
import MostrarDemoras from './MostrarDemoras'; // Importar el componente MostrarDemoras
import { FaEdit } from 'react-icons/fa';
import { BACKEND_URL } from '../config';

const ManejadorReclamosVentas = ({ token, username, role }) => {
  const [reclamos, setReclamos] = useState([]);
  const [reclamosConRespuesta, setReclamosConRespuesta] = useState([]);
  const [selectedReclamo, setSelectedReclamo] = useState(null);
  const [error, setError] = useState(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todos');
  const [fechaPrometidaVencidaCount, setFechaPrometidaVencidaCount] = useState(0);
  const [todosCount, setTodosCount] = useState(0);
  const [remitoCount, setRemitoCount] = useState(0);
  const [cursoCount, setCursoCount] = useState(0);
  const [preparadoCount, setPreparadoCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [editingEmailReclamoId, setEditingEmailReclamoId] = useState(null);
  const [newEmail, setNewEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [noData, setNoData] = useState(false);

  const fetchEmail = async (cliente) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/v1/getEmail?cliente=${cliente}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.email || '';
    } catch (error) {
      console.error('Error fetching email:', error);
      return '';
    }
  };

  useEffect(() => {
    const fetchReclamos = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/v1/reclamos`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        let reclamosFiltrados = response.data.filter(r => r.estado !== 'cerrado');
        let reclamosConResp = reclamosFiltrados.filter(r => r.respuesta && r.respuesta.trim() !== '');

        if (role !== 'administrador') {
          reclamosFiltrados = reclamosFiltrados.filter(r => r.username === username);
          reclamosConResp = reclamosConResp.filter(r => r.username === username);
        }

        const fechaActual = new Date().setHours(0, 0, 0, 0);
        const vencidosPrometida = reclamosFiltrados.filter(r => {
          if (!r.respuesta) return false;
          const fechaMatch = r.respuesta.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
          if (fechaMatch) {
            const fechaRespuesta = new Date(fechaMatch[0].split('/').reverse().join('-')).setHours(0, 0, 0, 0);
            return fechaRespuesta < fechaActual;
          }
          return false;
        });

        const preparados = reclamosFiltrados.filter(r => r.respuesta === 'Material preparado pero sin remito');

        setReclamos(reclamosFiltrados);
        setReclamosConRespuesta(reclamosConResp);
        setTodosCount(reclamosFiltrados.length);
        setFechaPrometidaVencidaCount(vencidosPrometida.length);
        setRemitoCount(reclamosFiltrados.filter(r => r.estado === 'remito enviado').length);
        setCursoCount(reclamosFiltrados.filter(r => r.estado === 'en curso' || r.estado === 'respondido' || r.estado === 'no vencido' || r.estado === 'vencido').length);
        setPreparadoCount(preparados.length);
        setIsLoading(false);
        setNoData(reclamosFiltrados.length === 0);
      } catch (error) {
        if (error.response && error.response.status === 403) {
          setError('Acceso denegado. No tiene permiso para ver esta información.');
        } else {
          console.error('Error al obtener reclamos:', error);
          setError('Error al obtener reclamos.');
        }
        setIsLoading(false);
      }
    };

    fetchReclamos();
  }, [token, username, role]);

  const handleCategoriaClick = (categoria) => {
    setCategoriaSeleccionada(categoria);
  };

  const filtrarReclamos = () => {
    switch (categoriaSeleccionada) {
      case 'vencidos':
        return reclamos.filter(r => r.estado === 'vencido');
      case 'promesa vencida':
        return reclamos.filter(r => validarFechaPrometida(r));
      case 'con remito':
        return reclamos.filter(r => r.estado === 'remito enviado');
      case 'en curso':
        return reclamos.filter(r => r.estado === 'en curso' || r.estado === 'respondido' || r.estado === 'no vencido' || r.estado === 'vencido');
      case 'preparado':
        return reclamos.filter(r => r.respuesta === 'Material preparado pero sin remito');
      case 'con respuesta':
        return reclamosConRespuesta;
      case 'todos':
      default:
        return reclamos;
    }
  };

  const validarFechaPrometida = (reclamo) => {
    if (!reclamo.respuesta) {
      return false;
    }
    const fechaActual = new Date().setHours(0, 0, 0, 0);
    const fechaMatch = reclamo.respuesta.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    if (fechaMatch) {
      const fechaRespuesta = new Date(fechaMatch[0].split('/').reverse().join('-')).setHours(0, 0, 0, 0);
      return fechaRespuesta < fechaActual;
    }
    return false;
  };

  const handleShowModal = (reclamo) => {
    setSelectedReclamo(reclamo);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedReclamo(null);
    setShowModal(false);
  };

  const handleSaveEmail = async (reclamoId, newEmail) => {
    try {
      const reclamo = reclamos.find(r => r.id === reclamoId);
      const response = await axios.post(`${BACKEND_URL}/api/v1/saveEmail`, { cliente: reclamo.cliente, email: newEmail }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        setReclamos(prevReclamos =>
          prevReclamos.map(r => {
            if (r.id === reclamoId) {
              return { ...r, email: newEmail };
            }
            return r;
          })
        );
        setEditingEmailReclamoId(null);
      }
    } catch (error) {
      console.error('Error guardando el correo:', error);
      alert('No se pudo guardar el correo. Por favor, intente de nuevo.');
    }
  };

  const handleHecho = async (reclamo) => {
    const updatedReclamo = {
      ...reclamo,
      pedidoEstado: '',
      codigoAnterior: '',
      codigoPosterior: '',
      codigoInterno: '',
      cantidad: '',
      respuesta: `El operador ${username} ha procedido con la solicitud de almacenes.`,
      usernameAlmacen: username
    };

    try {
      const response = await axios.put(`${BACKEND_URL}/api/v1/reclamos/${reclamo.id}`, updatedReclamo, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 200) {
        setReclamos(prev =>
          prev.map(r => (r.id === reclamo.id ? { ...r, ...updatedReclamo } : r))
        );
        setSelectedReclamo(null);
      }
    } catch (error) {
      console.error('Error actualizando el reclamo:', error);
      alert('No se pudo actualizar el reclamo. Por favor, intente de nuevo.');
    }
  };

  const handleVerHistorial = (pedidoId) => {
    setPedidoSeleccionado(pedidoId);
    setMostrarHistorial(true);
  };

  const handleCloseHistorial = () => {
    setMostrarHistorial(false);
    setPedidoSeleccionado(null);
  };

  // Función para formatear la respuesta y agregar saltos de línea
  const formatRespuesta = (respuesta) => {
    if (!respuesta) return '';
    return respuesta.split(' | ').map((line, idx) => (
      <span key={idx} style={{ display: 'block' }}>{line}</span>
    ));
  };

  if (error) {
    return <div className="alert alert-danger" role="alert">{error}</div>;
  }

  if (isLoading) {
    return <div className="text-center">Cargando...</div>;
  }

  if (noData) {
    return <h2 className="text-center">No hay reclamos abiertos para mostrar</h2>;
  }

  return (
    <div className="container mt-5">
      <MostrarTareasPendientes token={token} username={username} role={role} />
      <MostrarDemoras token={token} username={username} role={role} /> {/* Mostrar aviso de demoras */}
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
          <div className="col-md-2" onClick={() => handleCategoriaClick('promesa vencida')} style={{ cursor: 'pointer' }}>
            <div className="card bg-danger text-white">
              <div className="card-body">
                <h5 className="card-title">Promesa vencida</h5>
                <p className="card-text">{fechaPrometidaVencidaCount}</p>
              </div>
            </div>
          </div>
          <div className="col-md-2" onClick={() => handleCategoriaClick('con remito')} style={{ cursor: 'pointer' }}>
            <div className="card bg-success text-white">
              <div className="card-body">
                <h5 className="card-title">Con Remito</h5>
                <p className="card-text">{remitoCount}</p>
              </div>
            </div>
          </div>
          <div className="col-md-2" onClick={() => handleCategoriaClick('en curso')} style={{ cursor: 'pointer' }}>
            <div className="card bg-warning text-white">
              <div className="card-body">
                <h5 className="card-title">En Curso</h5>
                <p className="card-text">{cursoCount}</p>
              </div>
            </div>
          </div>
          <div className="col-md-2" onClick={() => handleCategoriaClick('preparado')} style={{ cursor: 'pointer' }}>
            <div className="card bg-success text-white">
              <div className="card-body">
                <h5 className="card-title">Pedido Preparado</h5>
                <p className="card-text">{preparadoCount}</p>
              </div>
            </div>
          </div>
          <div className="col-md-2" onClick={() => handleCategoriaClick('con respuesta')} style={{ cursor: 'pointer' }}>
            <div className="card bg-info text-white">
              <div className="card-body">
                <h5 className="card-title">Con Respuesta</h5>
                <p className="card-text">{reclamosConRespuesta.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        {filtrarReclamos().map((reclamo, index) => (
          <div key={index} className="col-md-4 mb-4">
            <div className={`card ${reclamo.respuesta === 'Material preparado pero sin remito' ? 'bg-success' : 'bg-secondary'} text-white`}>
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
                      <div>{formatRespuesta(reclamo.respuesta)}</div>
                      {validarFechaPrometida(reclamo) && (
                        <div className="text-danger" style={{ fontSize: 'larger' }}>
                          La fecha prometida se encuentra vencida
                        </div>
                      )}
                    </strong>
                  </small>
                </p>
                {reclamo.estadoRemito === 'conflicto' && (
                  <div className="text-warning">La generación del remito está en conflicto. Comuníquese con almacenes y administracion para conocer la situación.</div>
                )}
                {reclamo.estadoRemito === 'retenido deuda' && (
                  <div className="text-warning">Este remito está retenido por deuda. Comuníquese con administración para resolver.</div>
                )}
                {reclamo.pedidoEstado === 'cambioCodigoInterno' && (
                  <div className="text-warning">
                    Han solicitado desde almacenes, la corrección del código {reclamo.codigoAnterior} a el siguiente código {reclamo.codigoPosterior}
                    <button className="btn btn-sm btn-light ms-2" onClick={() => handleHecho(reclamo)}>Hecho</button>
                  </div>
                )}
                {reclamo.pedidoEstado === 'activacionTotal' && (
                  <div className="text-warning">
                    Han solicitado desde almacenes, la activación del pedido total
                    <button className="btn btn-sm btn-light ms-2" onClick={() => handleHecho(reclamo)}>Hecho</button>
                  </div>
                )}
                {reclamo.pedidoEstado === 'activacionParcial' && (
                  <div className="text-warning">
                    Han solicitado desde almacenes, la activación del pedido parcial {reclamo.codigoInterno} {reclamo.cantidad}
                    <button className="btn btn-sm btn-light ms-2" onClick={() => handleHecho(reclamo)}>Hecho</button>
                  </div>
                )}
                {reclamo.estado === 'remito enviado' && (
                  <>
                    <a href={reclamo.downloadUrl} className="btn btn-success w-100 d-block mt-2" target="_blank" rel="noopener noreferrer" download>Descargar Remito</a>
                  </>
                )}
                <button className="btn btn-primary w-100 d-block mt-2" onClick={() => handleShowModal(reclamo)}>Ver Detalle</button>
                <CerrarReclamoButton
                  reclamo={reclamo}
                  token={token}
                  onReclamoCerrado={(updatedReclamo) => {
                    setReclamos(prev => prev.map(r => (r.id === updatedReclamo.id ? updatedReclamo : r)));
                    // También actualizamos reclamosConRespuesta si es necesario
                    if (updatedReclamo.respuesta && updatedReclamo.respuesta.trim() !== '') {
                      setReclamosConRespuesta(prev => prev.map(r => (r.id === updatedReclamo.id ? updatedReclamo : r)));
                    }
                  }}
                  username={username}
                />
                <button className="btn btn-info w-100 d-block mt-2" onClick={() => handleVerHistorial(reclamo.pedido)}>Ver Historial</button>
                {(reclamo.estadoRemito === 'conflicto' || reclamo.estadoRemito === 'retenido deuda') ? (
                  <EnvioDeEmailVentasContraReclamo
                    reclamo={reclamo}
                    token={token}
                    onSaveEmail={(newEmail) => handleSaveEmail(reclamo.id, newEmail)}
                    fetchEmail={fetchEmail}
                  />
                ) : (
                  <EnvioDeEmail
                    reclamo={reclamo}
                    token={token}
                    onSaveEmail={(newEmail) => handleSaveEmail(reclamo.id, newEmail)}
                    fetchEmail={fetchEmail}
                  />
                )}
                <div className="email-section mt-2">
                  <span>{reclamo.email}</span>
                  <FaEdit className="mb-2" onClick={() => { setEditingEmailReclamoId(reclamo.id); setNewEmail(reclamo.email || ''); }} style={{ cursor: 'pointer', marginLeft: '10px' }} />
                </div>
                {editingEmailReclamoId === reclamo.id && (
                  <div className="mt-2">
                    <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="form-control" />
                    <button className="btn btn-primary mt-2 mb-2" onClick={() => handleSaveEmail(reclamo.id, newEmail)}>Guardar</button>
                  </div>
                )}
                <ContadorFechasEntregaPorPedido token={token} pedidoId={reclamo.pedido} />
                <ContadorCorreosPorTipo token={token} pedidoId={reclamo.pedido} />
              </div>
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

      {mostrarHistorial && pedidoSeleccionado && (
        <HistorialReclamos pedidoId={pedidoSeleccionado} token={token} showModal={mostrarHistorial} handleClose={handleCloseHistorial} />
      )}
    </div>
  );
};

export default ManejadorReclamosVentas;
