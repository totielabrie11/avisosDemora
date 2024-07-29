import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Registrar los componentes necesarios
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Graficos = ({ datos }) => {
  const dataPedidosPorCliente = {
    labels: Object.keys(datos.pedidosPorCliente),
    datasets: [
      {
        label: 'Pedidos por Cliente',
        data: Object.values(datos.pedidosPorCliente),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const dataPedidosPorMes = {
    labels: Object.keys(datos.pedidosPorMes),
    datasets: [
      {
        label: 'Pedidos por Mes',
        data: Object.values(datos.pedidosPorMes),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="graficos-container">
      <div className="grafico mb-5">
        <h3>Pedidos por Cliente</h3>
        <Bar data={dataPedidosPorCliente} />
      </div>
      <div className="grafico">
        <h3>Pedidos por Mes</h3>
        <Bar data={dataPedidosPorMes} />
      </div>
    </div>
  );
};

export default Graficos;
