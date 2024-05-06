const express = require('express');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());

// Función que formatea cualquier fecha a "DD/MM/YYYY"
function formatDate(dateString) {
  return moment(dateString).format("DD/MM/YYYY");
}

app.get('/api/v1/pedidos', (req, res) => {
  const filePath = path.join(__dirname, 'data/orders.json');

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "Archivo orders.json no encontrado" });
    return;
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const { Pedidos, Fecha_actualizacion } = data;
  const currentDate = moment();
  const diasPrevios = parseInt(req.query.diasPrevios) || 1;
  const clienteQuery = req.query.cliente ? req.query.cliente.toLowerCase() : '';

  const filteredPedidos = Pedidos.filter(order => {
    const hasItemsMatchingDate = order.Items.some(item => {
      const fechaVencida = moment(item.Fecha_vencida);
      const diffInDays = fechaVencida.diff(currentDate, 'days');

      if (diasPrevios >= 0) {
        // Pedidos próximos a vencer (días positivos)
        return diffInDays <= diasPrevios && diffInDays >= 0;
      } else {
        // Pedidos ya vencidos (días negativos)
        return diffInDays >= diasPrevios && diffInDays < 0;
      }
    });

    // Asegura la coincidencia con el nombre del cliente, si el parámetro está presente
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
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
