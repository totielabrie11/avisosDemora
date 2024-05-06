import React, { useEffect, useState } from 'react';
import axios from 'axios';
import moment from 'moment';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Leyenda from './component/Leyenda';

const App = () => {
  const [pedidos, setPedidos] = useState([]);
  const [fechaActualizacion, setFechaActualizacion] = useState('');
  const [diasPrevios, setDiasPrevios] = useState(1);
  const [cliente, setCliente] = useState('');

  const fetchPedidos = () => {
    axios.get(`http://localhost:3000/api/v1/pedidos?diasPrevios=${diasPrevios}&cliente=${cliente}`)
      .then(response => {
        const data = response.data;
        setPedidos(data.Pedidos || []);
        setFechaActualizacion(data.Fecha_actualizacion || '');
      })
      .catch(error => console.error(error));
  };

  useEffect(fetchPedidos, [diasPrevios, cliente]);

  const handleDiasPreviosChange = (e) => {
    setDiasPrevios(e.target.value);
  };

  const handleClienteChange = (e) => {
    setCliente(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchPedidos();
  };

  const getItemClass = (fechaVencida) => {
    const diffInDays = moment(fechaVencida, 'DD/MM/YYYY').diff(moment(), 'days');

    if (diffInDays > 0 && diffInDays <= 10) {
      return 'item-verde';
    } else if (diffInDays < 0 && diffInDays > -15) {
      return 'item-amarillo';
    } else if (diffInDays <= -15 && diffInDays > -30) {
      return 'item-naranja';
    } else if (diffInDays <= -45) {
      return 'item-rojo';
    } else {
      return '';
    }
  };

  return (
    <div className="container">
      <h1>Pedidos Próximos a Vencer o Vencidos</h1>
      <h2>Fecha de actualización: {fechaActualizacion}</h2>

      <form onSubmit={handleSubmit} className="form-inline mb-3 d-flex">
        <label>
          Mostrar pedidos en los próximos o últimos:
          <input
            type="number"
            value={diasPrevios}
            onChange={handleDiasPreviosChange}
            placeholder="Días"
            className="form-control ml-2 mr-2"
          />
        
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
      </form>

      <ul className="list-group mt-3">
        {pedidos.map((pedido, idx) => (
          <li key={idx} className="list-group-item">
            <h3>{pedido.Cliente}</h3>
            <h4>Pedido interno: {pedido.Pedido}</h4>
            <h4>Fecha de carga: {pedido.Inicio}</h4>
            <ul>
              {pedido.Items.map((item, itemIdx) => (
                <li key={itemIdx} className={`item ${getItemClass(item.Fecha_vencida)}`}>
                  {item.Descripcion} - Cantidad: {item.Cantidad} -  Vence: {item.Fecha_vencida}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <Leyenda />
    </div>
  );
};

export default App;
