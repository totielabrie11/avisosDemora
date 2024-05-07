import React, { useEffect, useState } from 'react';
import axios from 'axios';
import moment from 'moment';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Leyenda from './component/Leyenda';
import Estadisticas from './component/Estadisticas';

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

  const fetchCSV = () => {
    axios.get(`http://localhost:3000/api/v1/exportar-csv?diasPrevios=${diasPrevios}&cliente=${cliente}`, {
      responseType: 'blob'
    })
      .then(response => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'pedidos.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch(error => {
        console.error('Error exportando CSV:', error.message);
        alert('Error exportando CSV. Verifique los logs para más detalles.');
      });
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
    } else if (diffInDays <= -30) {
      return 'item-rojo';
    } else {
      return '';
    }
  };

  const shouldShowDemoraAlert = (fechaVencida) => {
    const diffInDays = moment(fechaVencida, 'DD/MM/YYYY').diff(moment(), 'days');
    return diffInDays < 0; // Mostrar "Alerta Demora" si el pedido ya está vencido
  };

  const shouldShowProximoVencimientoAlert = (fechaVencida) => {
    const diffInDays = moment(fechaVencida, 'DD/MM/YYYY').diff(moment(), 'days');
    return diffInDays > 0 && diffInDays <= 10; // Mostrar "Vencimiento Próximo" si el pedido está próximo a vencer
  };

  return (
    <div className="container">
      <h1>Pedidos Próximos a Vencer o Vencidos</h1>
      <h2>Fecha de actualización: {fechaActualizacion}</h2>

      <form onSubmit={handleSubmit} className="form-inline mb-3">
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

        <label className="ml-4">
          Cliente:
          <input
            type="text"
            value={cliente}
            onChange={handleClienteChange}
            placeholder="Nombre del cliente"
            className="form-control ml-2 mr-2"
          />
        </label>

        <button type="submit" className="btn btn-primary ml-2">Filtrar</button>
        <button type="button" onClick={fetchCSV} className="btn btn-success ml-2">Exportar CSV</button>
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
                  {item.Descripcion} - Cantidad: {item.Cantidad} - Vence: {item.Fecha_vencida}
                </li>
              ))}
            </ul>
            {pedido.Items.some(item => shouldShowDemoraAlert(item.Fecha_vencida)) && (
              <button className="btn btn-alerta-demora mt-2">Alerta Demora</button>
            )}
            {pedido.Items.some(item => shouldShowProximoVencimientoAlert(item.Fecha_vencida)) && (
              <button className="btn btn-vencimiento-proximo mt-2">Vencimiento Próximo</button>
            )}
          </li>
        ))}
      </ul>

      <Leyenda />
      <Estadisticas />
    </div>
  );
};

export default App;
