import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import moment from 'moment';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Leyenda from './component/Leyenda';
import Estadisticas from './component/Estadisticas';
import Login from './component/Login';
import UserState from './component/UserState';
import ModalText from './component/ModalText';
import GestorAlmacenes from './component/GestorAlmacenes';
import ManejadorReclamosVentas from './component/ManejadorReclamosVentas';
import VistaAdministracion from './component/VistaAdministracion';
import AdminFileUpload from './component/AdminFileUpload';
import VistaCasosCerrados from './component/VistaCasosCerrados';
import GestionClientes from './component/GestionClientes'; // Importar el nuevo componente
import ExportPDF from './component/Export';
import SubirDatosPedidos from './component/SubirDatosPedidos';

// Detectar si estamos en localhost o accediendo desde internet
const isLocalhost = window.location.hostname === 'localhost';

// Configurar la URL del backend en consecuencia
const BACKEND_URL = isLocalhost 
  ? 'http://localhost:43000'
  : 'http://dosivac.homeip.net:43000';

console.log("🚀 ~ BACKEND_URL:", BACKEND_URL);

const App = () => {
  const [pedidos, setPedidos] = useState([]);
  const [fechaActualizacion, setFechaActualizacion] = useState('');
  const [diasPrevios, setDiasPrevios] = useState(1);
  const [cliente, setCliente] = useState('');
  const [numeroPedido, setNumeroPedido] = useState('');
  const [material, setMaterial] = useState('');
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [estadoReclamo, setEstadoReclamo] = useState('');
  const [showEstadisticas, setShowEstadisticas] = useState(false);
  const [showManejadorReclamos, setShowManejadorReclamos] = useState(false);
  const [showCasosCerrados, setShowCasosCerrados] = useState(false);
  const [showGestionClientes, setShowGestionClientes] = useState(false); // Estado para mostrar el componente de clientes
  const [showSubirDatosPedidos, setShowSubirDatosPedidos] = useState(false);

  const apiURL = `${BACKEND_URL}/api/v1`;

  console.log('Environment:', process.env.NODE_ENV);
  console.log('API URL:', apiURL);

  const handleShowSubirDatosPedidos = () => {
    setShowSubirDatosPedidos(true);
  };
  
  const handleHideSubirDatosPedidos = () => {
    setShowSubirDatosPedidos(false);
  };

  const handleShowGestionClientes = () => {
    setShowGestionClientes(true);
  };

  const handleHideGestionClientes = () => {
    setShowGestionClientes(false);
  };

  const handleShowManejadorReclamos = () => {
    setShowManejadorReclamos(true);
  };

  const handleHideManejadorReclamos = () => {
    setShowManejadorReclamos(false);
  };

  const handleVencimientoProximoClick = (pedido) => {
    setPedidoSeleccionado(pedido);
    setEstadoReclamo('no vencido');
    setShowModal(true);
  };

  const handleAlertaDemoraClick = (pedido) => {
    setPedidoSeleccionado(pedido);
    setEstadoReclamo('vencido');
    setShowModal(true);
  };

  const handleShowEstadisticas = () => {
    setShowEstadisticas(true);
  };

  const handleHideEstadisticas = () => {
    setShowEstadisticas(false);
  };

  const handleShowCasosCerrados = () => {
    setShowCasosCerrados(true);
  };

  const handleHideCasosCerrados = () => {
    setShowCasosCerrados(false);
  };

  const fetchPedidos = useCallback(() => {
    axios
      .get(`${apiURL}/pedidos?diasPrevios=${diasPrevios}&cliente=${cliente}&numeroPedido=${numeroPedido}&material=${material}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        const data = response.data;
        setPedidos(data.Pedidos || []);
        setFechaActualizacion(data.Fecha_actualizacion || '');
      })
      .catch((error) => console.error('Error fetching pedidos:', error));
  }, [diasPrevios, cliente, numeroPedido, material, token, apiURL]);

  const handleLogin = (accessToken) => {
    setToken(accessToken);
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    setUsername(payload.username);
    setRole(payload.role);
  };

  const handleLogout = () => {
    setToken('');
    setUsername('');
    setRole('');
  };

  useEffect(() => {
    if (token) {
      fetchPedidos();
    }
  }, [fetchPedidos, token]);

  const handleDiasPreviosChange = (e) => {
    setDiasPrevios(Number(e.target.value) || 0);
  };

  const handleClienteChange = (e) => {
    setCliente(e.target.value);
  };

  const handleNumeroPedidoChange = (e) => {
    setNumeroPedido(e.target.value);
  };

  const handleMaterialChange = (e) => {
    setMaterial(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchPedidos();
  };

  const getItemClass = (fechaVencida) => {
    const diffInDays = moment(fechaVencida, 'DD/MM/YYYY').diff(moment(), 'days');

    if (diffInDays > -1 && diffInDays <= 10) {
      return 'item-verde';
    } else if (diffInDays < 0 && diffInDays > -15) {
      return 'item-amarillo';
    } else if (diffInDays <= -15 && diffInDays > -30) {
      return 'item-naranja';
    } else if (diffInDays <= -30) {
      return 'item-rojo';
    } else {
      return '';
    }
  };

  const shouldShowDemoraAlert = (fechaVencida) => {
    const diffInDays = moment(fechaVencida, 'DD/MM/YYYY').diff(moment(), 'days');
    return diffInDays < 0;
  };

  const shouldShowProximoVencimientoAlert = (fechaVencida) => {
    const diffInDays = moment(fechaVencida, 'DD/MM/YYYY').diff(moment(), 'days');
    return diffInDays > -1 && diffInDays <= 10;
  };

  const handleModalSubmit = (reclamo) => {
    fetchPedidos();
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  if (role === 'administrativo') {
    return <VistaAdministracion token={token} username={username} role={role} onLogout={handleLogout} />;
  }

  if (role === 'deposito') {
    return <GestorAlmacenes token={token} username={username} role={role} onLogout={handleLogout} />;
  }

  if (showManejadorReclamos) {
    return (
      <div>
        <button className="btn btn-secondary" onClick={handleHideManejadorReclamos}>Volver al Menú Principal</button>
        <ManejadorReclamosVentas token={token} username={username} role={role} />
      </div>
    );
  }

  if (showEstadisticas) {
    return (
      <div>
        <button className="btn btn-secondary" onClick={handleHideEstadisticas}>Volver al Menú Principal</button>
        <Estadisticas token={token} />
      </div>
    );
  }

  if (showCasosCerrados) {
    return (
      <div>
        <button className="btn btn-secondary" onClick={handleHideCasosCerrados}>Volver al Menú Principal</button>
        <VistaCasosCerrados token={token} role={role} />
      </div>
    );
  }

  if (showGestionClientes) {
    return (
      <div>
        <button className="btn btn-secondary" onClick={handleHideGestionClientes}>Volver al Menú Principal</button>
        <GestionClientes token={token} /> {/* Pasar el token como prop */}
      </div>
    );
  }

  if (showSubirDatosPedidos) {
    return (
      <div>
        <button className="btn btn-secondary" onClick={handleHideSubirDatosPedidos}>Volver al Menú Principal</button>
        <SubirDatosPedidos token={token} /> {/* Pasar el token como prop */}
      </div>
    );
  }

 return (
  <div className="container">
    <div className="d-flex justify-content-between align-items-center mt-3 mb-3">
      <UserState username={username} role={role} onLogout={handleLogout} />
      <button className="btn btn-info" onClick={handleShowEstadisticas}>Estadísticas</button>
      <button className="btn btn-success" onClick={handleShowManejadorReclamos}>Administrar Reclamos</button>
      <button className="btn btn-warning" onClick={handleShowCasosCerrados}>Ver Casos Cerrados</button>
      <button className="btn btn-primary" onClick={handleShowGestionClientes}>Clientes</button>
      <button className="btn btn-secondary" onClick={handleShowSubirDatosPedidos}>Actuaizar Db</button> {/* Nuevo botón para mostrar el componente de subir datos de pedidos */}
    </div>
      {role === 'administrador' && <AdminFileUpload token={token} />} {/* Componente para subir archivo solo visible para administradores */}
      <h1>Pedidos Próximos a Vencer o Vencidos</h1>
      <h2>Fecha de actualización: {fechaActualizacion}</h2>

      <form onSubmit={handleSubmit} className="form-inline mb-3">
        <div className='container d-flex'>
          <label>
            Mostrar pedidos en los próximos o últimos:
            <input
              type="number"
              value={diasPrevios}
              onChange={handleDiasPreviosChange}
              className="form-control ml-2 mr-2"
            />
            días
          </label>

          <label className="ms-4">
            Cliente:
            <input
              type="text"
              value={cliente}
              onChange={handleClienteChange}
              placeholder="Nombre del cliente"
              className="form-control ml-2 mr-2"
            />
          </label>

          <label className="ms-4">
            Número de Pedido:
            <input
              type="text"
              value={numeroPedido}
              onChange={handleNumeroPedidoChange}
              placeholder="Número de Pedido"
              className="form-control ml-2 mr-2"
            />
          </label>

          <label className="ms-4">
            Material:
            <input
              type="text"
              value={material}
              onChange={handleMaterialChange}
              placeholder="Descripción del Material"
              className="form-control ml-2 mr-2"
            />
          </label>
        </div>
        <button type="submit" className="btn btn-primary me-2">Buscar</button>
        <ExportPDF pedidos={pedidos} />
      </form>

      <ul className="list-group mt-3">
        {pedidos.map((pedido, idx) => (
          <li key={idx} className="list-group-item">
            <h3>{pedido.Cliente}</h3>
            <h4>Pedido interno: {pedido.Pedido}</h4>
            <h4>Orden de compra: {pedido.oc}</h4>
            <h4>Fecha de carga: {pedido.Inicio}</h4>
            <ul>
              {pedido.Items.map((item, itemIdx) => (
                <li key={itemIdx} className={`item ${getItemClass(item.Fecha_vencida)}`}>
                  {item.Descripcion} - Cantidad: {item.Cantidad} - Vence: {item.Fecha_vencida}
                </li>
              ))}
            </ul>
            {pedido.Items.some((item) => shouldShowDemoraAlert(item.Fecha_vencida)) && (
              <button
                className="btn btn-alerta-demora mt-2"
                onClick={() => handleAlertaDemoraClick(pedido)}
              >
                Alerta Demora
              </button>
            )}

            {pedido.Items.some((item) => shouldShowProximoVencimientoAlert(item.Fecha_vencida)) && (
              <button
                className="btn btn-vencimiento-proximo mt-2"
                onClick={() => handleVencimientoProximoClick(pedido)}
              >
                Vencimiento Próximo
              </button>
            )}
          </li>
        ))}
      </ul>

      <Leyenda />

      {pedidoSeleccionado && (
        <ModalText
          show={showModal}
          onHide={() => setShowModal(false)}
          pedido={pedidoSeleccionado}
          estado={estadoReclamo}
          onSubmit={handleModalSubmit}
          token={token}
          usuario={username} // Añadir el nombre de usuario como prop
        />
      )}
    </div>
  );
};

export default App;
