// index.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import moment from 'moment';

const app = express();
const PORT = 3000;

app.use(cors());

// Función que formatea cualquier fecha a "DD/MM/YYYY"
const formatDate = (dateString) => moment(dateString, 'YYYY-MM-DD').format('DD/MM/YYYY');

const readOrders = () => {
  const filePath = path.join(process.cwd(), 'data/orders.json');
  if (!fs.existsSync(filePath)) {
    console.warn('Archivo orders.json no encontrado');
    return { Pedidos: [], Fecha_actualizacion: '' };
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error('Error leyendo orders.json:', error.message, error.stack);
    return { Pedidos: [], Fecha_actualizacion: '' };
  }
};



// Endpoint para obtener los pedidos filtrados
app.get('/api/v1/pedidos', (req, res) => {
  try {
    const data = readOrders();
    const { Pedidos, Fecha_actualizacion } = data;
    if (!Pedidos || !Array.isArray(Pedidos)) {
      throw new Error('Pedidos no encontrados o estructura incorrecta en el archivo JSON');
    }
    const currentDate = moment();
    const diasPrevios = parseInt(req.query.diasPrevios) || 1;
    const clienteQuery = req.query.cliente ? req.query.cliente.toLowerCase() : '';

    const filteredPedidos = Pedidos.filter((order) => {
      const hasItemsMatchingDate = order.Items.some((item) => {
        const fechaVencida = moment(item.Fecha_vencida, 'YYYY-MM-DD');
        const diffInDays = fechaVencida.diff(currentDate, 'days');

        if (diasPrevios >= 0) {
          return diffInDays <= diasPrevios && diffInDays >= 0;
        } else {
          return diffInDays >= diasPrevios && diffInDays < 0;
        }
        });
        
        const matchesCliente = clienteQuery ? order.Cliente.toLowerCase().includes(clienteQuery) : true;
        return hasItemsMatchingDate && matchesCliente;
        });
        
        filteredPedidos.forEach((order) => {
        if (order.hasOwnProperty('Inicio')) {
        order.Inicio = formatDate(order.Inicio);
        }
        order.Items.forEach((item) => {
        item.Fecha_vencida = formatDate(item.Fecha_vencida);
        if (item.hasOwnProperty('Inicio')) {
        item.Inicio = formatDate(item.Inicio);
        }
        });
        });
        
        res.json({ Fecha_actualizacion, Pedidos: filteredPedidos });
        } catch (err) {
        console.error('Error obteniendo pedidos:', err.message, err.stack);
        res.status(500).json({ error: 'Error obteniendo pedidos', message: err.message });
        }
        });
        
        // Endpoint para estadísticas de pedidos
        app.get('/api/v1/estadisticas', (req, res) => {
        try {
        const data = readOrders();
        const { Pedidos } = data;
        if (!Pedidos || !Array.isArray(Pedidos)) {
        throw new Error('Pedidos no encontrados o estructura incorrecta en el archivo JSON');
        }
        
        const pedidosPorCliente = {};
        const pedidosPorMes = {};
        
        Pedidos.forEach((order) => {
        const cliente = order.Cliente;
        const mes = moment(order.Inicio, 'YYYY-MM-DD').format('MM/YYYY');
        
        if (!pedidosPorCliente[cliente]) {
        pedidosPorCliente[cliente] = 0;
        }
        pedidosPorCliente[cliente]++;
        
        if (!pedidosPorMes[mes]) {
        pedidosPorMes[mes] = 0;
        }
        pedidosPorMes[mes]++;
        });
        
        res.json({ pedidosPorCliente, pedidosPorMes });
        } catch (err) {
        console.error('Error generando estadísticas:', err.message, err.stack);
        res.status(500).json({ error: 'Error generando estadísticas', message: err.message });
        }
        });
        
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  