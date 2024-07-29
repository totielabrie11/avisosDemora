import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaPencilAlt } from 'react-icons/fa';
import ExportClientes from './ExportClientes';
import SubirDatosClientes from './SubirDatosClientes';
import EliminarCliente from './EliminarCliente';

const isLocalhost = window.location.hostname === 'localhost';

const BACKEND_URL = isLocalhost 
  ? 'http://localhost:43000'
  : 'http://dosivac.homeip.net:43000';

console.log("🚀 ~ BACKEND_URL:", BACKEND_URL);

const GestionClientes = ({ token }) => {
  const [clientes, setClientes] = useState([]);
  const [filtros, setFiltros] = useState({
    nombre: '',
    codigo: '',
    ubicacion: '',
    barrio: '',
    zona: ''
  });
  const [datosAd, setDatosAd] = useState('');
  const [caracteresRestantes, setCaracteresRestantes] = useState(500);
  const [barrios, setBarrios] = useState([]);
  const [editCodigo, setEditCodigo] = useState({});
  const [isEditing, setIsEditing] = useState({});
  
  const apiURL = `${BACKEND_URL}/api/v1/clientes`;

  const fetchClientes = useCallback(async () => {
    try {
      const response = await axios.get(apiURL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const clientesData = response.data.clientes;
      setClientes(clientesData);
      
      const uniqueBarrios = [...new Set(clientesData.map(cliente => cliente.barrio).filter(barrio => barrio))];
      setBarrios(uniqueBarrios);

    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  }, [apiURL, token]);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  const handleDatosAdChange = (e) => {
    const newDatosAd = e.target.value;
    if (newDatosAd.length <= 500) {
      setDatosAd(newDatosAd);
      setCaracteresRestantes(500 - newDatosAd.length);
    }
  };

  const handleAgregarDatos = async (codigoCliente) => {
    try {
      await axios.put(apiURL, {
        codigo: codigoCliente,
        field: 'DatosAd',
        value: datosAd
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsEditing(prev => ({ ...prev, [codigoCliente]: false }));
      fetchClientes();
    } catch (error) {
      console.error('Error updating client:', error);
    }
  };

  const handleEditClick = async (field, value, codigoCliente) => {
    const newValue = prompt(`Editar ${field}:`, value);
    if (newValue !== null) {
      try {
        await axios.put(apiURL, {
          codigo: codigoCliente,
          field,
          value: newValue
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchClientes();
      } catch (error) {
        console.error('Error updating client:', error);
      }
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prevFiltros => ({
      ...prevFiltros,
      [name]: value
    }));
  };

  const handleCodigoChange = async (codigoActual, nuevoCodigo) => {
    const updatedCodigo = nuevoCodigo + codigoActual.slice(1);
    try {
      await axios.put(`${apiURL}/codigo`, {
        codigoActual,
        nuevoCodigo: updatedCodigo
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchClientes();
    } catch (error) {
      console.error('Error updating client code:', error);
    }
  };

  const handleEditDatosAd = (codigoCliente, datos) => {
    setDatosAd(datos);
    setCaracteresRestantes(500 - datos.length);
    setIsEditing(prev => ({ ...prev, [codigoCliente]: true }));
  };

  const handleClienteEliminado = (codigoEliminado) => {
    setClientes(prevClientes => prevClientes.filter(cliente => cliente.Codigo !== codigoEliminado));
  };

  const filteredClientes = clientes.filter(cliente => 
    (!filtros.nombre || (cliente.Nombre && cliente.Nombre.toLowerCase().includes(filtros.nombre.toLowerCase()))) &&
    (!filtros.codigo || (cliente.Codigo && cliente.Codigo.toLowerCase().includes(filtros.codigo.toLowerCase()))) &&
    (!filtros.ubicacion || (filtros.ubicacion === 'CABA' && cliente.caba === 'si') || (filtros.ubicacion === 'PROVINCIA' && cliente.provincia === 'si')) &&
    (!filtros.barrio || (cliente.barrio && cliente.barrio.toLowerCase() === filtros.barrio.toLowerCase())) &&
    (!filtros.zona || (cliente.zona && cliente.zona.toLowerCase() === filtros.zona.toLowerCase()))
  );

  const zonasProvincia = ["zona sur", "zona oeste", "zona norte", "interior bsas"];
  const zonasCABA = ["caba norte", "caba sur", "caba este", "caba oeste"];

  return (
    <div className="container mt-4">
      <h1>Consulta y Gestión de Clientes</h1>
      <div className="mb-4">
        <ExportClientes clientes={filteredClientes} /> {/* Botón para exportar a PDF y Excel */}
      </div>
      <div className="mb-4">
        <SubirDatosClientes token={token} /> {/* Botón para subir datos desde Excel */}
      </div>
      <form className="mb-4">
        <div className="form-group">
          <label>Nombre del Cliente:</label>
          <input 
            type="text" 
            className="form-control"
            name="nombre"
            value={filtros.nombre}
            onChange={handleFilterChange}
          />
        </div>
        <div className="form-group">
          <label>Código del Cliente:</label>
          <input 
            type="text" 
            className="form-control"
            name="codigo"
            value={filtros.codigo}
            onChange={handleFilterChange}
          />
        </div>
        <div className="form-group">
          <label>Ubicación:</label>
          <select 
            className="form-control"
            name="ubicacion"
            value={filtros.ubicacion}
            onChange={handleFilterChange}
          >
            <option value="">Seleccionar Ubicación</option>
            <option value="CABA">CABA</option>
            <option value="PROVINCIA">PROVINCIA</option>
          </select>
        </div>
        <div className="form-group">
          <label>Zona:</label>
          <select 
            className="form-control"
            name="zona"
            value={filtros.zona}
            onChange={handleFilterChange}
          >
            <option value="">Seleccionar Zona</option>
            {filtros.ubicacion === 'CABA' 
              ? zonasCABA.map((zona, index) => (
                  <option key={index} value={zona}>{zona}</option>
                )) 
              : zonasProvincia.map((zona, index) => (
                  <option key={index} value={zona}>{zona}</option>
                ))
            }
          </select>
        </div>
        {filtros.ubicacion === 'CABA' && (
          <div className="form-group">
            <label>Barrio:</label>
            <select 
              className="form-control"
              name="barrio"
              value={filtros.barrio}
              onChange={handleFilterChange}
            >
              <option value="">Seleccionar Barrio</option>
              {barrios.map((barrio, index) => (
                <option key={index} value={barrio}>{barrio}</option>
              ))}
            </select>
          </div>
        )}
      </form>
      <div>
        {filteredClientes.length === 0 && (
          <p className="text-muted">No se encontraron clientes con los criterios de búsqueda.</p>
        )}
        {filteredClientes.map((cliente, index) => (
          <div key={cliente.Codigo + index} className="card mb-3">
            <div className="card-body">
              <h5 className="card-title">{cliente.Nombre}</h5>
              <p className="card-text">
                Código del Cliente: {editCodigo[cliente.Codigo] ? (
                  <select 
                    value={cliente.Codigo[0]} 
                    onChange={(e) => handleCodigoChange(cliente.Codigo, e.target.value)}
                    onBlur={() => setEditCodigo(prev => ({ ...prev, [cliente.Codigo]: false }))}
                  >
                    <option value="I">I</option>
                    <option value="P">P</option>
                    <option value="R">R</option>
                    <option value="C">C</option>
                    <option value="A">A</option>
                    <option value="D">D</option>
                    <option value="0">00</option>
                  </select>
                ) : (
                  <>
                    {cliente.Codigo}
                    <button 
                      className="btn btn-sm btn-light ms-2" 
                      onClick={() => setEditCodigo(prev => ({ ...prev, [cliente.Codigo]: true }))}
                    >
                      ✏️
                    </button>
                  </>
                )}
                <EliminarCliente codigo={cliente.Codigo} token={token} BACKEND_URL={BACKEND_URL} onClienteEliminado={handleClienteEliminado} />
              </p>
              <p className="card-text">
                Dirección de Entrega: {cliente["Dir. Entrega"] || <span className="text-muted">No especificada</span>}
                <button 
                  className="btn btn-sm btn-light ms-2" 
                  onClick={() => handleEditClick('Dir. Entrega', cliente["Dir. Entrega"], cliente.Codigo)}
                >
                  ✏️
                </button>
              </p>
              <p className="card-text">
                Dirección de Visita: {cliente["Direccion de visita"] || <span className="text-muted">No especificada</span>}
                <button 
                  className="btn btn-sm btn-light ms-2" 
                  onClick={() => handleEditClick('Direccion de visita', cliente["Direccion de visita"], cliente.Codigo)}
                >
                  ✏️
                </button>
              </p>
              <p className="card-text">
                Teléfono: {cliente.telefono || <span className="text-muted">No especificado</span>}
                <button 
                  className="btn btn-sm btn-light ms-2" 
                  onClick={() => handleEditClick('telefono', cliente.telefono, cliente.Codigo)}
                >
                  ✏️
                </button>
              </p>
              <p className="card-text">
                Email: {cliente.mail || <span className="text-muted">No especificado</span>}
                <button 
                  className="btn btn-sm btn-light ms-2" 
                  onClick={() => handleEditClick('mail', cliente.mail, cliente.Codigo)}
                >
                  ✏️
                </button>
              </p>
              {cliente.provincia === 'si' && (
                <p className="card-text">
                  Provincia: {cliente['nombre de provincia'] || <span className="text-muted">Indique el nombre de la Provincia</span>}
                  <button 
                    className="btn btn-sm btn-light ms-2" 
                    onClick={() => handleEditClick('nombre de provincia', cliente['nombre de provincia'], cliente.Codigo)}
                  >
                    ✏️
                  </button>
                </p>
              )}
              {cliente.caba === 'si' && (
                <p className="card-text">
                  Barrio: {cliente.barrio || <span className="text-muted">Indique el nombre del Barrio</span>}
                  <button 
                    className="btn btn-sm btn-light ms-2" 
                    onClick={() => handleEditClick('barrio', cliente.barrio, cliente.Codigo)}
                  >
                    ✏️
                  </button>
                </p>
              )}
              <div className="form-group">
                <label>Zona:</label>
                <select 
                  className="form-control"
                  name="zona"
                  value={cliente.zona || ''}
                  onChange={(e) => handleEditClick('zona', e.target.value, cliente.Codigo)}
                >
                  <option value="">Seleccionar Zona</option>
                  {cliente.caba === 'si' ? zonasCABA.map((zona, index) => (
                    <option key={index} value={zona}>{zona}</option>
                  )) : zonasProvincia.map((zona, index) => (
                    <option key={index} value={zona}>{zona}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Datos Adicionales:</label>
                <div className="d-flex align-items-center">
                  <textarea 
                    className="form-control"
                    value={isEditing[cliente.Codigo] ? datosAd : cliente.DatosAd}
                    onChange={handleDatosAdChange}
                    disabled={!isEditing[cliente.Codigo]}
                    style={{ backgroundColor: isEditing[cliente.Codigo] ? 'white' : '#e9ecef', flex: 1 }}
                  />
                  <button 
                    className="btn btn-sm btn-light ms-2" 
                    onClick={() => handleEditDatosAd(cliente.Codigo, cliente.DatosAd)}
                  >
                    <FaPencilAlt />
                  </button>
                </div>
                <small className="form-text text-muted">
                  {caracteresRestantes} caracteres restantes.
                </small>
                {caracteresRestantes === 0 && <div className="text-danger">Has alcanzado el límite de caracteres.</div>}
                {isEditing[cliente.Codigo] && (
                  <button 
                    className="btn btn-primary mt-2"
                    onClick={() => handleAgregarDatos(cliente.Codigo)}
                  >
                    Agregar Datos
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GestionClientes;
