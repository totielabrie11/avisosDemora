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

// Definición de rutas para archivos JSON
const filePaths = {
  reclamos: path.join(process.cwd(), 'data/pedidosReclamos.json'),
  orders: path.join(process.cwd(), 'data/orders.json'),
  users: path.join(process.cwd(), 'data/us.json'),
};

// Inicializa archivos si no existen
const initializeFiles = () => {
  if (!fs.existsSync(filePaths.reclamos)) {
    fs.writeFileSync(filePaths.reclamos, '[]', 'utf8');
  }
  if (!fs.existsSync(filePaths.orders)) {
    fs.writeFileSync(filePaths.orders, JSON.stringify({ Pedidos: [], Fecha_actualizacion: '' }), 'utf8');
  }
  if (!fs.existsSync(filePaths.users)) {
    fs.writeFileSync(filePaths.users, JSON.stringify({ users: [] }), 'utf8');
  }
};

const readOrders = () => {
  try {
    return JSON.parse(fs.readFileSync(filePaths.orders, 'utf8'));
  } catch (error) {
    console.error('Error leyendo orders.json:', error.message, error.stack);
    return { Pedidos: [], Fecha_actualizacion: '' };
  }
};

const readUsers = () => {
  try {
    return JSON.parse(fs.readFileSync(filePaths.users, 'utf8'));
  } catch (error) {
    console.error('Error leyendo us.json:', error.message, error.stack);
    return { users: [] };
  }
};

// Función para leer reclamos desde un archivo JSON
const readReclamos = () => {
  try {
    return JSON.parse(fs.readFileSync(filePaths.reclamos, 'utf8'));
  } catch (error) {
    console.error('Error leyendo pedidosReclamos.json:', error.message, error.stack);
    return [];
  }
};

const writeReclamos = (reclamos) => {
  try {
    fs.writeFileSync(filePaths.reclamos, JSON.stringify(reclamos, null, 2), 'utf8');
  } catch (error) {
    console.error('Error escribiendo pedidosReclamos.json:', error.message, error.stack);
  }
};

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    req.role = user.role;
    next();
  });
};

// Formatea la fecha al formato "DD/MM/YYYY"
const formatDate = (date) => {
  return moment(date, 'YYYY-MM-DD').format('DD/MM/YYYY');
};

// Inicializa los archivos necesarios
initializeFiles();

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


// Añadir función para obtener el próximo ID
const getNextReclamoID = () => {
  const reclamos = readReclamos();
  return reclamos.length ? Math.max(...reclamos.map(r => r.id)) + 1 : 1;
};

app.post('/api/v1/reclamos', authenticateToken, (req, res) => {
  try {
    const { pedido, cliente, estado, prioridad, mensaje } = req.body;
    if (!pedido || !cliente || !estado || !prioridad || !mensaje) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const reclamos = readReclamos();
    const username = req.user.username;

    // Formatear la fecha
    const fecha = moment().format('DD-MM-YYYY [a las] HH:mm [hs]');

    // Crear nuevo sub-reclamo
    const nuevoSubReclamo = {
      id: `sub-${new Date().getTime()}`,
      estado,
      prioridad,
      mensaje,
      fecha,
      username
    };

    // Encuentra el reclamo existente para el mismo pedido
    let reclamoExistente = reclamos.find((reclamo) => reclamo.pedido === pedido);

    if (reclamoExistente) {
      reclamoExistente.reclamos.push(nuevoSubReclamo);
    } else {
      const nuevoReclamo = {
        id: getNextReclamoID(),
        pedido,
        cliente,
        reclamos: [nuevoSubReclamo]
      };

      reclamos.push(nuevoReclamo);
    }

    writeReclamos(reclamos);

    res.status(201).json({ message: 'Reclamo recibido', reclamo: nuevoSubReclamo });
  } catch (err) {
    console.error('Error al recibir el reclamo:', err.message, err.stack);
    res.status(500).json({ error: 'Error al recibir el reclamo', message: err.message });
  }
});


// Endpoint para obtener todos los reclamos (solo para "deposito")
app.get('/api/v1/reclamos', authenticateToken, (req, res) => {
  try {
    if (req.role !== 'deposito') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const reclamos = readReclamos().flatMap(reclamo =>
      reclamo.reclamos.map(subReclamo => ({
        pedido: reclamo.pedido,
        cliente: reclamo.cliente,
        prioridad: subReclamo.prioridad,
        mensaje: subReclamo.mensaje,
        fecha: subReclamo.fecha,
        username: subReclamo.username
      }))
    );
    res.json(reclamos);
  } catch (err) {
    console.error('Error obteniendo reclamos:', err.message, err.stack);
    res.status(500).json({ error: 'Error obteniendo reclamos', message: err.message });
  }
});



app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
