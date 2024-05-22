// server.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import moment from 'moment';
import jwt from 'jsonwebtoken';
import bodyParser from 'body-parser';
import multer from 'multer';

const app = express();
const PORT = 3000;
const JWT_SECRET = 'charly';

app.use(cors());
app.use(express.json());

app.use(bodyParser.json());


// Definición de rutas para archivos JSON y carpeta document
const filePaths = {
  reclamos: path.join(process.cwd(), 'data/pedidosReclamos.json'),
  orders: path.join(process.cwd(), 'data/orders.json'),
  users: path.join(process.cwd(), 'data/us.json'),
  document: path.join(process.cwd(), 'data/document'), // Añadimos la ruta de la carpeta document
  historico: path.join(process.cwd(), 'data/datosHistoricos.json'),
};

app.use('/document', express.static(filePaths.document));

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
  if (!fs.existsSync(filePaths.historico)) {
    fs.writeFileSync(filePaths.historico, '[]', 'utf8');
  }
  // Comprobación si no existe la carpeta document
  if (!fs.existsSync(filePaths.document)) {
    fs.mkdirSync(filePaths.document, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, filePaths.document);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

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

// Función para leer reclamos de un archivo JSON de manera sincrónica
const readReclamos = () => {
  try {
    const data = fs.readFileSync(filePaths.reclamos, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error leyendo reclamos:', error.message);
    return [];
  }
};

// Función para escribir reclamos en un archivo JSON de manera asincrónica
const writeReclamos = async (reclamos) => {
  try {
    await fs.promises.writeFile(filePaths.reclamos, JSON.stringify(reclamos, null, 2), 'utf8');
  } catch (error) {
    console.error('Error escribiendo reclamos:', error.message);
    throw error;  // Rethrow the error to be caught by the calling function
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

// Endpoint para enviar remitos a mi servidor
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No se ha subido ningún archivo.');
  }

  const { numeroRemito, id, subId } = req.body;
  const filePath = path.join(filePaths.document, req.file.filename);
  const downloadUrl = `http://localhost:3000/document/${req.file.filename}`;

  try {
    let reclamos = readReclamos();
    let found = false;

    reclamos = reclamos.map(reclamo => {
      if (reclamo.id === parseInt(id)) {
        reclamo.reclamos = reclamo.reclamos.map(subReclamo => {
          if (subReclamo.id === subId) {
            subReclamo.remito = numeroRemito;
            subReclamo.downloadUrl = downloadUrl; // Añadir la URL de descarga
            found = true;
          }
          return subReclamo;
        });
      }
      return reclamo;
    });

    if (!found) {
      return res.status(404).json({ error: 'Reclamo o sub-reclamo no encontrado' });
    }

    await writeReclamos(reclamos);
    res.status(200).json({ message: 'Archivo subido con éxito.', downloadUrl });
  } catch (error) {
    console.error('Error al actualizar el reclamo:', error);
    res.status(500).json({ error: 'Error interno del servidor', message: error.message });
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
    const numeroPedidoQuery = req.query.numeroPedido ? req.query.numeroPedido.toLowerCase() : '';

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
      const matchesNumeroPedido = numeroPedidoQuery ? order.Pedido.toString().toLowerCase().includes(numeroPedidoQuery) : true;

      return hasItemsMatchingDate && matchesCliente && matchesNumeroPedido;
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
    // Solo permitir acceso al rol de "administrador"
    if (req.role !== 'administrador') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const data = readOrders();
    const { Pedidos } = data;
    if (!Pedidos || !Array.isArray(Pedidos)) {
      throw new Error('Pedidos no encontrados o estructura incorrecta en el archivo JSON');
    }

    const pedidosPorCliente = {};
    const pedidosPorMes = {};
    let totalPedidos = 0; // Contador para el total de pedidos

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
      totalPedidos++; // Incrementa el total de pedidos
    });

    res.json({ pedidosPorCliente, pedidosPorMes, totalPedidos });
  } catch (err) {
    console.error('Error generando estadísticas:', err.message, err.stack);
    res.status(500).json({ error: 'Error generando estadísticas', message: err.message });
  }
});

// Endpoint para obtener el histórico
app.get('/api/v1/historico', authenticateToken, (req, res) => {
  try {
    if (req.role !== 'administrador') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const historico = JSON.parse(fs.readFileSync(filePaths.historico, 'utf8'));
    res.json(historico);
  } catch (err) {
    console.error('Error obteniendo el histórico:', err.message, err.stack);
    res.status(500).json({ error: 'Error obteniendo el histórico', message: err.message });
  }
});

// Endpoint para guardar datos en el histórico
app.post('/api/v1/historico', authenticateToken, (req, res) => {
  try {
    if (req.role !== 'administrador') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const historico = JSON.parse(fs.readFileSync(filePaths.historico, 'utf8'));
    const fechaActual = moment().format('DD/MM/YYYY');
    
    // Verificar si ya existe un registro para la fecha actual
    const existeRegistroParaHoy = historico.some(registro => registro.fecha === fechaActual);
    
    if (existeRegistroParaHoy) {
      return res.status(409).json({ error: 'El registro para la fecha actual ya existe.' });
    }

    const nuevoRegistro = {
      fecha: fechaActual,
      datos: req.body
    };
    historico.push(nuevoRegistro);
    fs.writeFileSync(filePaths.historico, JSON.stringify(historico, null, 2), 'utf8');
    res.status(201).json(nuevoRegistro);
  } catch (err) {
    console.error('Error guardando el histórico:', err.message, err.stack);
    res.status(500).json({ error: 'Error guardando el histórico', message: err.message });
  }
});


// Añadir función para obtener el próximo ID
const getNextReclamoID = () => {
  const reclamos = readReclamos();
  return reclamos.length ? Math.max(...reclamos.map(r => r.id)) + 1 : 1;
};

app.post('/api/v1/reclamos', authenticateToken, async (req, res) => {
  try {
    const { pedido, cliente, estado, prioridad, mensaje, material } = req.body;

    if (!pedido || !cliente || !estado || !prioridad || !mensaje || !material || !Array.isArray(material)) {
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
      username,
      material // Añadir el campo material
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

    await writeReclamos(reclamos);

    res.status(201).json({ message: 'Reclamo recibido', reclamo: nuevoSubReclamo });
  } catch (err) {
    console.error('Error al recibir el reclamo:', err.message, err.stack);
    res.status(500).json({ error: 'Error al recibir el reclamo', message: err.message });
  }
});



// Endpoint para obtener todos los reclamos (solo para "deposito")
app.get('/api/v1/reclamos', authenticateToken, (req, res) => {
  try {
    if (req.role !== 'deposito' && req.role !== 'administrador' && req.role !== 'vendedor' ) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const reclamos = readReclamos().flatMap(reclamo =>
      reclamo.reclamos.map(subReclamo => ({
        id: reclamo.id,
        pedido: reclamo.pedido,
        cliente: reclamo.cliente,
        prioridad: subReclamo.prioridad,
        estado: subReclamo.estado,
        mensaje: subReclamo.mensaje,
        fecha: subReclamo.fecha,
        username: subReclamo.username,
        usernameAlmacen: subReclamo.usernameAlmacen,
        respuesta: subReclamo.respuesta,
        subId: subReclamo.id,
        material: subReclamo.material, // Añadir el campo material
        downloadUrl: subReclamo.downloadUrl
      }))
    );
    res.json(reclamos);
  } catch (err) {
    console.error('Error obteniendo reclamos:', err.message, err.stack);
    res.status(500).json({ error: 'Error obteniendo reclamos', message: err.message });
  }
});

app.put('/api/v1/reclamos/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { estado, respuesta, subId, usernameAlmacen, remito } = req.body;

  try {
    let reclamos = await readReclamos();
    let found = false;

    reclamos = reclamos.map(reclamo => {
      if (reclamo.id === parseInt(id)) {
        reclamo.reclamos = reclamo.reclamos.map(subReclamo => {
          if (subReclamo.id === subId) {
            subReclamo.estado = estado || subReclamo.estado;
            subReclamo.respuesta = respuesta || subReclamo.respuesta;
            subReclamo.usernameAlmacen = usernameAlmacen || subReclamo.usernameAlmacen;
            subReclamo.remito = remito
            // No actualizar el material aquí
            found = true;
          }
          return subReclamo;
        });
      }
      return reclamo;
    });

    if (!found) {
      return res.status(404).json({ error: 'Reclamo o sub-reclamo no encontrado' });
    }

    await writeReclamos(reclamos);
    res.status(200).json({ message: 'Reclamo actualizado exitosamente!' });
  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    res.status(500).json({ error: 'Error interno del servidor', message: error.message });
  }
});




app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
