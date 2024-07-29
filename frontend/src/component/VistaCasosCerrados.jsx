import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import HistorialReclamos from './HistorialReclamos';
import VistaDetalleAlmacen from './VistaDetalleAlmacen';
import { BACKEND_URL } from '../config'; // Importa la URL del backend desde config

const VistaCasosCerrados = ({ token, role }) => {
  const [casosCerrados, setCasosCerrados] = useState([]);
  const [filteredCasos, setFilteredCasos] = useState([]);
  const [error, setError] = useState('');
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [selectedCaso, setSelectedCaso] = useState(null);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroPedido, setFiltroPedido] = useState('');

  const fetchCasosCerrados = useCallback(() => {
    axios
      .get(`${BACKEND_URL}/api/v1/reclamos`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        const data = response.data.filter((reclamo) => reclamo.estado === 'cerrado');
        setCasosCerrados(data);
        setFilteredCasos(data);
      })
      .catch((error) => setError('Error fetching closed cases'));
  }, [token]);

  useEffect(() => {
    fetchCasosCerrados();
  }, [fetchCasosCerrados]);

  const handleShowDetalle = (caso) => {
    setSelectedCaso(caso);
    setShowDetalleModal(true);
  };

  const handleCloseDetalle = () => {
    setShowDetalleModal(false);
    setSelectedCaso(null);
  };

  const handleVerHistorial = (pedidoId) => {
    setPedidoSeleccionado(pedidoId);
    setMostrarHistorial(true);
  };

  const handleCloseHistorial = () => {
    setMostrarHistorial(false);
    setPedidoSeleccionado(null);
  };

  const handleFiltroClienteChange = (e) => {
    const value = e.target.value;
    setFiltroCliente(value);
    filtrarCasos(value, filtroPedido);
  };

  const handleFiltroPedidoChange = (e) => {
    const value = e.target.value;
    setFiltroPedido(value);
    filtrarCasos(filtroCliente, value);
  };

  const filtrarCasos = (cliente, pedido) => {
    const filtrados = casosCerrados.filter(
      (caso) =>
        String(caso.cliente).toLowerCase().includes(cliente.toLowerCase()) &&
        String(caso.pedido).toLowerCase().includes(pedido.toLowerCase())
    );
    setFilteredCasos(filtrados);
  };

  if (role !== 'administrador' && role !== 'vendedor') {
    return <div className="alert alert-danger">No tienes acceso a esta sección</div>;
  }

  return (
    <div className="container mt-5">
      <h1>Casos Cerrados</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="row mb-4">
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Filtrar por Cliente"
            value={filtroCliente}
            onChange={handleFiltroClienteChange}
          />
        </div>
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Filtrar por Pedido"
            value={filtroPedido}
            onChange={handleFiltroPedidoChange}
          />
        </div>
      </div>
      <div className="row">
        {filteredCasos.map((caso, idx) => (
          <div key={idx} className="col-md-4 mb-4">
            <div className="card">
              <div className="card-body">
                <h3 className="card-title">{caso.cliente}</h3>
                <h4 className="card-subtitle mb-2 text-muted">Pedido: {caso.pedido}</h4>
                <p className="card-text">Mensaje: {caso.mensaje}</p>
                <p className="card-text">Fecha: {caso.fecha}</p>
                <p className="card-text">Usuario: {caso.username}</p>
                <button className="btn btn-primary w-100 mb-2" onClick={() => handleShowDetalle(caso)}>
                  Ver Detalle
                </button>
                <button className="btn btn-info w-100" onClick={() => handleVerHistorial(caso.pedido)}>
                  Ver Historial
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedCaso && (
        <VistaDetalleAlmacen
          show={showDetalleModal}
          onHide={handleCloseDetalle}
          reclamo={selectedCaso}
        />
      )}

      {mostrarHistorial && pedidoSeleccionado && (
        <HistorialReclamos
          pedidoId={pedidoSeleccionado}
          token={token}
          showModal={mostrarHistorial}
          handleClose={handleCloseHistorial}
        />
      )}
    </div>
  );
};

export default VistaCasosCerrados;
