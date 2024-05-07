const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const moment = require('moment');
const { json2csv } = require('json-2-csv');

const app = express();
const PORT = 3000;

app.use(cors());

// Función que formatea cualquier fecha a "DD/MM/YYYY"
const formatDate = (dateString) => moment(dateString, "YYYY-MM-DD").format("DD/MM/YYYY");

const readOrders = () => {
  const filePath = path.join(process.cwd(), 'data/orders.json');
  if (!fs.existsSync(filePath)) {
    console.warn('Archivo orders.json no encontrado');
    return { Pedidos: [], Fecha_actualizacion: "" };
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error('Error leyendo orders.json:', error.message, error.stack);
    return { Pedidos: [], Fecha_actualizacion: "" };
  }
};

// Endpoint para exportar pedidos a CSV
app.get('/api/v1/exportar-csv', async (req, res) => {
  try {
    const data = readOrders();
    const { Pedidos } = data;
    if (!Pedidos || !Array.isArray(Pedidos)) {
      throw new Error('Pedidos no encontrados o estructura incorrecta en el archivo JSON');
    }

    const currentDate = moment();
    const diasPrevios = parseInt(req.query.diasPrevios) || 1;
    const clienteQuery = req.query.cliente ? req.query.cliente.toLowerCase() : '';

    console.log(`Exportando pedidos con diasPrevios=${diasPrevios} y cliente=${clienteQuery}`);

    const filteredPedidos = Pedidos.filter(order => {
      const hasItemsMatchingDate = order.Items.some(item => {
        const fechaVencida = moment(item.Fecha_vencida, "YYYY-MM-DD");
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

    if (filteredPedidos.length === 0) {
      console.warn('No se encontraron pedidos que coincidan con los filtros.');
      return res.status(404).json({ error: 'No se encontraron pedidos que coincidan con los filtros.' });
    }

    const flatData = filteredPedidos.flatMap(order =>
      order.Items.map(item => ({
        Pedido: order.Pedido,
        Cliente: order.Cliente,
        Inicio: formatDate(order.Inicio),
        Descripcion: item.Descripcion,
        Cantidad: item.Cantidad,
        Fecha_vencida: formatDate(item.Fecha_vencida),
        Inicio_Item: item.hasOwnProperty('Inicio') ? formatDate(item.Inicio) : undefined
      }))
    );

    console.log('Datos para exportar:', flatData);

    // Usar json2csv para convertir los datos a CSV
    const csv = await new Promise((resolve, reject) => {
      json2csv(flatData, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('pedidos.csv');
    res.send(csv);
  } catch (err) {
    console.error('Error generando CSV:', err.message, err.stack);
    res.status(500).json({ error: "Error generando CSV", message: err.message });
  }
});

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

    const filteredPedidos = Pedidos.filter(order => {
      const hasItemsMatchingDate = order.Items.some(item => {
        const fechaVencida = moment(item.Fecha_vencida, "YYYY-MM-DD");
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

    filteredPedidos.forEach(order => {
      if (order.hasOwnProperty('Inicio')) {
        order.Inicio = formatDate(order.Inicio);
      }
      order.Items.forEach(item => {
        item.Fecha_vencida = formatDate(item.Fecha_vencida);
        if (item.hasOwnProperty('Inicio')) {
          item.Inicio = formatDate(item.Inicio);
        }
      });
    });

    res.json({ Fecha_actualizacion, Pedidos: filteredPedidos });
  } catch (err) {
    console.error('Error obteniendo pedidos:', err.message, err.stack);
    res.status(500).json({ error: "Error obteniendo pedidos", message: err.message });
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

    Pedidos.forEach(order => {
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
    res.status(500).json({ error: "Error generando estadísticas", message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
