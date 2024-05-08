// server.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import moment from 'moment';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your_secret_key';

app.use(cors());
app.use(express.json());

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

const readUsers = () => {
  const filePath = path.join(process.cwd(), 'data/us.json');
  if (!fs.existsSync(filePath)) {
    console.warn('Archivo us.json no encontrado');
    return { users: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error('Error leyendo us.json:', error.message, error.stack);
    return { users: [] };
  }
};

const readReclamos = () => {
  const filePath = path.join(process.cwd(), 'data/pedidosReclamos.json');
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error('Error leyendo pedidosReclamos.json:', error.message, error.stack);
    return [];
  }
};

const writeReclamos = (reclamos) => {
  const filePath = path.join(process.cwd(), 'data/pedidosReclamos.json');
  try {
    fs.writeFileSync(filePath, JSON.stringify(reclamos, null, 2), 'utf8');
  } catch (error) {
    console.error('Error escribiendo pedidosReclamos.json:', error.message, error.stack);
  }
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Formatea la fecha al formato "DD/MM/YYYY"
const formatDate = (date) => {
  return moment(date, 'YYYY-MM-DD').format('DD/MM/YYYY');
};

// Endpoint para iniciar sesión
app.post('/api/v1/login', (req, res) => {
  const { username, password } = req.body;
  const data = readUsers();
  const user = data.users.find((u) => u.username === username);

  if (user && user.password === password) {
    const accessToken = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, {
      expiresIn: '1h',
    });
    res.json({ accessToken });
  } else {
    res.status(401).json({ error: 'Credenciales inválidas' });
  }
});

// Endpoint para obtener los pedidos filtrados
app.get('/api/v1/pedidos', authenticateToken, (req, res) => {
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
app.get('/api/v1/estadisticas', authenticateToken, (req, res) => {
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

// Endpoint para recibir reclamos
app.post('/api/v1/reclamos', authenticateToken, (req, res) => {
  try {
    const { id, cliente, prioridad, mensaje, fecha } = req.body;
    if (!id || !cliente || !prioridad || !mensaje || !fecha) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const reclamos = readReclamos();

    // Verifica si el reclamo ya existe
    const reclamoExistente = reclamos.find((reclamo) => reclamo.id === id && reclamo.cliente === cliente);

    if (reclamoExistente) {
      return res.status(409).json({ error: 'El reclamo ya existe para este pedido y cliente' });
    }

    reclamos.push({ id, cliente, prioridad, mensaje, fecha });
    writeReclamos(reclamos);

    res.status(201).json({ message: 'Reclamo recibido' });
  } catch (err) {
    console.error('Error al recibir el reclamo:', err.message, err.stack);
    res.status(500).json({ error: 'Error al recibir el reclamo', message: err.message });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

