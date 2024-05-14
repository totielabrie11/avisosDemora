import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import UserState from './UserState';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

const GestorAlmacenes = ({ token, username, role, onLogout }) => {
  const [reclamos, setReclamos] = useState([]);
  const [urgenteCount, setUrgenteCount] = useState(0);
  const [regularCount, setRegularCount] = useState(0);
  const [vencidoCount, setVencidoCount] = useState(0);
  const [noVencidoCount, setNoVencidoCount] = useState(0);
  const [selectedReclamo, setSelectedReclamo] = useState(null);
  const [fechaEntrega, setFechaEntrega] = useState(null);
  const [showModal, setShowModal] = useState(false);

  function generateId() {
    // Generar un número aleatorio de cuatro cifras
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    
    // Generar una letra aleatoria
    const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  
    // Combinar el número y la letra para formar el ID
    return `${randomNumber}${randomLetter}`;
  }
  

  useEffect(() => {
    const fetchReclamos = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/v1/reclamos', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data;
  
        // Asegurarse de que cada reclamo tiene un ID y otros datos necesarios antes de procesarlos
        const reclamosConId = data.map(reclamo => ({
          ...reclamo,
          id: reclamo.id || generateId()  // Generar un ID si falta, aunque lo ideal es que siempre venga desde la API
        }));
  
        const urgenteReclamos = reclamosConId.filter(r => r.prioridad === 'Urgente');
        const regularReclamos = reclamosConId.filter(r => r.prioridad === 'Regular');
        const vencidoReclamos = reclamosConId.filter(r => r.estado === 'vencido');
        const noVencidoReclamos = reclamosConId.filter(r => r.estado === 'no vencido');
  
        setReclamos(reclamosConId);
        setUrgenteCount(urgenteReclamos.length);
        setRegularCount(regularReclamos.length);
        setVencidoCount(vencidoReclamos.length);
        setNoVencidoCount(noVencidoReclamos.length);
      } catch (error) {
        console.error('Error fetching reclamos:', error);
      }
    };
  
    fetchReclamos();
  }, [token]);  // Dependencia en token para re-ejecutar cuando el token cambie
  

  const handleResponder = reclamo => {
    setSelectedReclamo(reclamo);
    setShowModal(true);
  };

  const handleFechaEntregaChange = date => {
    setFechaEntrega(date);
  };

  const handleEnviarRespuesta = async () => {
    console.log("Selected Reclamo:", selectedReclamo);  // Esto mostrará el objeto seleccionado
    setShowModal(false);
    if (selectedReclamo && fechaEntrega) {
      const updatedReclamo = {
        estado: 'respondido',
        respuesta: `Se entregará en la fecha ${fechaEntrega.toLocaleDateString()}`
      };
  
      // Asegurarse de usar el `id` correcto y también enviar `subId` si necesario
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
  
  return (
    <div className="container mt-5">
      <UserState username={username} role={role} onLogout={onLogout} />
      <h1>Gestor de Reclamos - Almacenes</h1>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Urgente: {urgenteCount}</h2>
        <h2>Regular: {regularCount}</h2>
        <h2>Vencido: {vencidoCount}</h2>
        <h2>No Vencido: {noVencidoCount}</h2>
      </div>
      <div className="row">
        {reclamos.map((reclamo, idx) => (
          <div
            key={idx}
            className={`col-md-4 mb-4 card ${
              reclamo.prioridad === 'Urgente' ? 'bg-danger' : 'bg-warning'
            } text-white`}
          >
            <div className="card-body">
              <h5 className="card-title">{reclamo.pedido} - {reclamo.cliente}</h5>
              <p className="card-text">{reclamo.mensaje}</p>
              <p className="card-text">
                <small>
                  <strong>Estado:</strong> {reclamo.estado}<br />
                  <strong>Prioridad:</strong> {reclamo.prioridad}<br />
                  <strong>Fecha:</strong> {reclamo.fecha}<br />
                  <strong>Reportado por:</strong> {reclamo.username}
                </small>
              </p>
              <button className="btn btn-primary" onClick={() => handleResponder(reclamo)}>
                Responder
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
    </div>
  );
};

export default GestorAlmacenes;