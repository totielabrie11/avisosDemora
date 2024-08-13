import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import moment from 'moment';
import jwt from 'jsonwebtoken';
import bodyParser from 'body-parser';
import multer from 'multer';
import nodemailer from 'nodemailer';
import XLSX from 'xlsx';
import { readPedidos, writePedidos } from './utils/pedidosUtils.js';

const app = express();
const PORT = 43000;
const JWT_SECRET = 'charly';

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);


const defaultTransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: 'cotizaciones@dosivac.com',
    pass: 'kzsu mdmt tkrl ngzr',
  },
});

const filePaths = {
  reclamos: path.join(process.cwd(), 'data/pedidosReclamos.json'),
  orders: path.join(process.cwd(), 'data/orders.json'),
  users: path.join(process.cwd(), 'data/us.json'),
  document: path.join(process.cwd(), 'data/document'),
  historico: path.join(process.cwd(), 'data/datosHistoricos.json'),
  historicoReclamos: path.join(process.cwd(), 'data/historicoReclamos.json'),
  mails: path.join(process.cwd(), 'data/dbMails.json'),
  clientes: path.join(process.cwd(), 'data/clientes.json'), // Asegúrate de tener esta línea
  uploads: path.join(process.cwd(), 'uploads') // Nueva línea para la carpeta 'uploads'
};

app.use('/data/document', express.static(path.join(process.cwd(), 'data/document')));

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
  if (!fs.existsSync(filePaths.historicoReclamos)) {
    fs.writeFileSync(filePaths.historicoReclamos, '[]', 'utf8');
  }
  if (!fs.existsSync(filePaths.mails)) {
    fs.writeFileSync(filePaths.mails, '[]', 'utf8');
  }
  if (!fs.existsSync(filePaths.document)) {
    fs.mkdirSync(filePaths.document, { recursive: true });
  }
  if (!fs.existsSync(filePaths.uploads)) {
    fs.mkdirSync(filePaths.uploads, { recursive: true }); // Crear la carpeta 'uploads'
  }
};

initializeFiles();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'data/document');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
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

const getOrderOC = (pedidoId) => {
  const orders = readOrders();
  const order = orders.Pedidos.find(order => order.Pedido === pedidoId);
  return order ? order.oc : null;
};


const readUsers = () => {
  try {
    return JSON.parse(fs.readFileSync(filePaths.users, 'utf8'));
  } catch (error) {
    console.error('Error leyendo us.json:', error.message, error.stack);
    return { users: [] };
  }
};

const readReclamos = () => {
  try {
    const data = fs.readFileSync(filePaths.reclamos, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error leyendo reclamos:', error.message);
    return [];
  }
};

const writeReclamos = async (reclamos) => {
  try {
    await fs.promises.writeFile(filePaths.reclamos, JSON.stringify(reclamos, null, 2), 'utf8');
  } catch (error) {
    console.error('Error escribiendo reclamos:', error.message);
    throw error;
  }
};

const readMails = () => {
  try {
    return JSON.parse(fs.readFileSync(filePaths.mails, 'utf8'));
  } catch (error) {
    console.error('Error leyendo dbMails.json:', error.message, error.stack);
    return [];
  }
};

const writeMails = async (mails) => {
  try {
    console.log('Escribiendo mails:', JSON.stringify(mails, null, 2)); // Log de depuración
    await fs.promises.writeFile(filePaths.mails, JSON.stringify(mails, null, 2), 'utf8');
  } catch (error) {
    console.error('Error escribiendo dbMails.json:', error.message);
    throw error;
  }
};

// Función para agregar o actualizar un correo
const addOrUpdateMail = async (newMailEntry) => {
  const mails = readMails();
  const existingMailIndex = mails.findIndex(mail => mail.Cliente === newMailEntry.Cliente);

  if (existingMailIndex !== -1) {
    mails[existingMailIndex].mail = newMailEntry.mail;
  } else {
    mails.push(newMailEntry);
  }

  await writeMails(mails);
};


const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);

    // Buscar el usuario en la base de datos
    const users = readUsers().users;
    const authenticatedUser = users.find(u => u.username === user.username);

    if (!authenticatedUser) return res.sendStatus(404);

    req.user = authenticatedUser;
    req.role = user.role;
    next();
  });
};

const sendEmail = (req, to, subject, text, html, attachments) => {
  const user = req.user; // asegúrate de que 'user' tiene 'email' y 'smtpPassword'
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: user.email, // Usa el correo electrónico del usuario
      pass: user.smtpPassword, // Usa la contraseña SMTP del usuario
    },
  });

  const mailOptions = {
    from: user.email, // El correo del usuario autenticado como remitente
    to,
    subject,
    text,
    html,
    attachments,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error enviando el correo:', error);
      return { success: false, message: 'Error enviando el correo' };
    } else {
      console.log('Correo enviado:', info.response);
      return { success: true, message: 'Correo enviado con éxito' };
    }
  });
};


app.post('/api/v1/saveEmail', authenticateToken, async (req, res) => {
  const { cliente, email } = req.body;

  if (!cliente || !email) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const newMailEntry = { Cliente: cliente, mail: email };
    await addOrUpdateMail(newMailEntry);
    res.status(200).json({ message: 'Correo guardado con éxito' });
  } catch (error) {
    console.error('Error guardando el correo:', error.message);
    res.status(500).json({ error: 'Error guardando el correo', message: error.message });
  }
});

// Rutas para el historial de reclamos
const readHistoricoReclamos = () => {
  try {
    return JSON.parse(fs.readFileSync(filePaths.historicoReclamos, 'utf8'));
  } catch (error) {
    console.error('Error leyendo historicoReclamos.json:', error.message, error.stack);
    return [];
  }
};

const writeHistoricoReclamos = async (historico) => {
  try {
    await fs.promises.writeFile(filePaths.historicoReclamos, JSON.stringify(historico, null, 2), 'utf8');
  } catch (error) {
    console.error('Error escribiendo historicoReclamos.json:', error.message);
    throw error;
  }
};

app.get('/api/v1/historicoReclamos', authenticateToken, (req, res) => {
  try {
    const pedidoId = req.query.pedidoId;
    const historico = readHistoricoReclamos();
    const historialFiltrado = historico.filter(entry => entry.pedido == pedidoId);
    res.json(historialFiltrado);
  } catch (error) {
    console.error('Error obteniendo el historial de reclamos:', error.message);
    res.status(500).json({ error: 'Error obteniendo el historial de reclamos', message: error.message });
  }
});


app.post('/api/v1/historicoReclamos', authenticateToken, async (req, res) => {
  try {
    const { id, pedido, cliente, estado, mensaje, fecha, tipoMensaje } = req.body;

    if (!id || !pedido || !cliente || !estado || !mensaje || !fecha || !tipoMensaje) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const historico = readHistoricoReclamos();

    const nuevoRegistro = {
      id,
      pedido,
      cliente,
      estado,
      mensaje,
      fecha,
      tipoMensaje, // Incluye el tipo de mensaje
      timestamp: moment().format('DD-MM-YYYY HH:mm:ss')
    };

    historico.push(nuevoRegistro);
    await writeHistoricoReclamos(historico);

    res.status(201).json(nuevoRegistro);
  } catch (error) {
    console.error('Error guardando el historial de reclamos:', error.message, error.stack);
    res.status(500).json({ error: 'Error guardando el historial de reclamos', message: error.message });
  }
});


app.post('/api/v1/sendEmail', authenticateToken, (req, res) => {
  const { to, subject, text } = req.body;

  if (!to || !subject || !text) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  sendEmail(req, to, subject, text);
  res.status(200).json({ message: 'Correo enviado con éxito' });
});

app.post('/api/v1/sendEmailWithAttachment', authenticateToken, upload.single('file'), (req, res) => {
  const { to, subject, text } = req.body;
  const file = req.file;

  if (!to || !subject || !text) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const attachments = file ? [{ path: file.path }] : [];

  sendEmail(req, to, subject, text, null, attachments);
  res.status(200).json({ message: 'Correo enviado con éxito' });
});

const formatDate = (date) => {
  return moment(date, 'YYYY-MM-DD').format('DD/MM/YYYY');
};

app.get('/api/v1/getEmail', authenticateToken, (req, res) => {
  const cliente = req.query.cliente;

  if (!cliente) {
    return res.status(400).json({ error: 'Cliente no especificado' });
  }

  try {
    const mails = readMails();
    const mailEntry = mails.find(mail => mail.Cliente === cliente);

    if (!mailEntry) {
      return res.status(404).json({ error: 'Correo no encontrado' });
    }

    res.json({ email: mailEntry.mail });
  } catch (error) {
    console.error('Error obteniendo el correo:', error.message);
    res.status(500).json({ error: 'Error obteniendo el correo', message: error.message });
  }
});

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

app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No se ha subido ningún archivo.');
  }

  const { numeroRemito, id, subId } = req.body;
  const uploadFileName = req.file.filename;
  const downloadUrl = `http://localhost:43000/data/document/${uploadFileName}`;

  try {
    let reclamos = await readReclamos();
    let found = false;

    reclamos = reclamos.map(reclamo => {
      if (reclamo.id === parseInt(id)) {
        reclamo.reclamos = reclamo.reclamos.map(subReclamo => {
          if (subReclamo.id === subId) {
            subReclamo.remito = numeroRemito;
            subReclamo.downloadUrl = downloadUrl;
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

app.get('/api/v1/pedidos', authenticateToken, (req, res) => {
  try {
    const data = readOrders();
    const { Pedidos, Fecha_actualizacion } = data;
    if (!Pedidos || !Array.isArray(Pedidos)) {
      throw new Error('Pedidos no encontrados o estructura incorrecta en el archivo JSON');
    }

    const currentDate = moment();
    const diasPrevios = req.query.diasPrevios ? parseInt(req.query.diasPrevios) : null;
    const clienteQuery = req.query.cliente ? req.query.cliente.toLowerCase() : '';
    const numeroPedidoQuery = req.query.numeroPedido ? req.query.numeroPedido.toLowerCase() : '';
    const materialQuery = req.query.material ? req.query.material.toLowerCase() : '';

    // Filtrar por días solo si diasPrevios está presente
    const filteredPedidos = Pedidos.filter((order) => {
      const hasItemsMatchingDate = diasPrevios !== null
        ? order.Items.some((item) => {
            const fechaVencida = moment(item.Fecha_vencida, 'YYYY-MM-DD');
            const diffInDays = fechaVencida.diff(currentDate, 'days');

            if (diasPrevios >= 0) {
              return diffInDays <= diasPrevios && diffInDays >= 0;
            } else {
              return diffInDays >= diasPrevios && diffInDays < 0;
            }
          })
        : true; // Si diasPrevios es null, no filtra por fechas

      const matchesCliente = clienteQuery ? order.Cliente.toLowerCase().includes(clienteQuery) : true;
      const matchesNumeroPedido = numeroPedidoQuery ? order.Pedido.toString().toLowerCase().includes(numeroPedidoQuery) : true;
      const matchesMaterial = materialQuery ? order.Items.some(item => item.Descripcion.toLowerCase().includes(materialQuery)) : true;

      return hasItemsMatchingDate && matchesCliente && matchesNumeroPedido && matchesMaterial;
    });

    res.json({ Fecha_actualizacion, Pedidos: filteredPedidos });
  } catch (err) {
    console.error('Error obteniendo pedidos:', err.message, err.stack);
    res.status(500).json({ error: 'Error obteniendo pedidos', message: err.message });
  }
});

// Ruta para guardar o actualizar correos electrónicos
app.post('/api/v1/saveEmail', authenticateToken, async (req, res) => {
  const { cliente, email } = req.body;

  if (!cliente || !email) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const newMailEntry = { Cliente: cliente, mail: email };
    await addOrUpdateMail(newMailEntry);
    res.status(200).json({ message: 'Correo guardado con éxito' });
  } catch (error) {
    console.error('Error guardando el correo:', error.message);
    res.status(500).json({ error: 'Error guardando el correo', message: error.message });
  }
});

app.get('/api/v1/estadisticas', authenticateToken, (req, res) => {
  try {
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
    let totalPedidos = 0;

    Pedidos.forEach((order) => {
      const cliente = order.Cliente;
      const mes = moment(order.Inicio, 'YYYY-MM-DD').format('MM/YYYY');

      if (!pedidosPorCliente[cliente]) {
        pedidosPorCliente[cliente] = [];
      }
      pedidosPorCliente[cliente].push(order.Pedido);

      if (!pedidosPorMes[mes]) {
        pedidosPorMes[mes] = {};
      }
      if (!pedidosPorMes[mes][cliente]) {
        pedidosPorMes[mes][cliente] = [];
      }
      pedidosPorMes[mes][cliente].push(order.Pedido);

      totalPedidos++;
    });

    res.json({ pedidosPorCliente, pedidosPorMes, totalPedidos });
  } catch (err) {
    console.error('Error generando estadísticas:', err.message, err.stack);
    res.status(500).json({ error: 'Error generando estadísticas', message: err.message });
  }
});

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

app.post('/api/v1/historico', authenticateToken, (req, res) => {
  try {
    if (req.role !== 'administrador') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const historico = JSON.parse(fs.readFileSync(filePaths.historico, 'utf8'));
    const fechaActual = moment().format('DD/MM/YYYY');
    
    const existeRegistroParaHoy = historico.some(registro => registro.fecha === fechaActual);
    
    if (existeRegistroParaHoy) {
      return res.status(409).json({ error: 'El registro para la fecha actual ya existe.' });
    }

    // Transformar los datos al formato del 24/05/2024
    const { pedidosPorCliente, pedidosPorMes, totalPedidos } = req.body;
    const transformedData = {
      pedidosPorCliente: {},
      pedidosPorMes: {},
      totalPedidos
    };

    // Transformar pedidosPorCliente
    for (const cliente in pedidosPorCliente) {
      if (Array.isArray(pedidosPorCliente[cliente])) {
        transformedData.pedidosPorCliente[cliente] = pedidosPorCliente[cliente].length;
      } else {
        transformedData.pedidosPorCliente[cliente] = pedidosPorCliente[cliente];
      }
    }

    // Transformar pedidosPorMes
    for (const mes in pedidosPorMes) {
      if (typeof pedidosPorMes[mes] === 'object') {
        transformedData.pedidosPorMes[mes] = Object.keys(pedidosPorMes[mes]).length;
      } else {
        transformedData.pedidosPorMes[mes] = pedidosPorMes[mes];
      }
    }

    const nuevoRegistro = {
      fecha: fechaActual,
      datos: transformedData
    };
    historico.push(nuevoRegistro);
    fs.writeFileSync(filePaths.historico, JSON.stringify(historico, null, 2), 'utf8');
    res.status(201).json(nuevoRegistro);
  } catch (err) {
    console.error('Error guardando el histórico:', err.message, err.stack);
    res.status(500).json({ error: 'Error guardando el histórico', message: err.message });
  }
});

const getNextReclamoID = () => {
  const reclamos = readReclamos();
  return reclamos.length ? Math.max(...reclamos.map(r => r.id)) + 1 : 1;
};

app.post('/api/v1/reclamos', authenticateToken, async (req, res) => {
  try {
    const { pedido, cliente, estado, prioridad, mensaje, material, oc } = req.body;

    if (!pedido || !cliente || !estado || !prioridad || !mensaje || !material || !Array.isArray(material)) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const reclamos = readReclamos();
    const username = req.user.username;
    const fecha = moment().format('DD-MM-YYYY [a las] HH:mm [hs]');

    const nuevoSubReclamo = {
      id: `sub-${new Date().getTime()}`,
      estado,
      prioridad,
      mensaje,
      fecha,
      username,
      material
    };

    let reclamoExistente = reclamos.find((reclamo) => reclamo.pedido === pedido);

    if (reclamoExistente) {
      reclamoExistente.reclamos.push(nuevoSubReclamo);
    } else {
      const nuevoReclamo = {
        id: getNextReclamoID(),
        pedido,
        cliente,
        oc,  // Incluye el valor de OC en el nuevo reclamo
        reclamos: [nuevoSubReclamo]
      };

      reclamos.push(nuevoReclamo);
    }

    await writeReclamos(reclamos);

    // Agregar entrada al historial de reclamos
    const historicoReclamos = readHistoricoReclamos();
    const nuevoHistoricoReclamo = {
      id: nuevoSubReclamo.id,
      pedido,
      cliente,
      estado,
      mensaje,
      fecha,
      tipoMensaje: estado === 'no vencido' ? 'vencimiento proximo' : 'alerta demora',
      timestamp: moment().format('DD-MM-YYYY HH:mm:ss')
    };
    historicoReclamos.push(nuevoHistoricoReclamo);
    await writeHistoricoReclamos(historicoReclamos);

    res.status(201).json({ message: 'Reclamo recibido', reclamo: nuevoSubReclamo });
  } catch (err) {
    console.error('Error al recibir el reclamo:', err.message, err.stack);
    res.status(500).json({ error: 'Error al recibir el reclamo', message: err.message });
  }
});



app.get('/api/v1/reclamos', authenticateToken, (req, res) => {
  try {
    if (req.role !== 'deposito' && req.role !== 'administrador' && req.role !== 'vendedor' && req.role !== 'administrativo') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const reclamos = readReclamos().flatMap(reclamo =>
      reclamo.reclamos.map(subReclamo => ({
        id: reclamo.id,
        pedido: reclamo.pedido,
        oc: reclamo.oc,
        cliente: reclamo.cliente,
        prioridad: subReclamo.prioridad,
        estado: subReclamo.estado,
        mensaje: subReclamo.mensaje,
        fecha: subReclamo.fecha,
        username: subReclamo.username,
        usernameAlmacen: subReclamo.usernameAlmacen,
        respuesta: subReclamo.respuesta,
        subId: subReclamo.id,
        material: subReclamo.material,
        downloadUrl: subReclamo.downloadUrl,
        estadoRemito: subReclamo.estadoRemito,
        problemaRemito: subReclamo.problemaRemito,
        pedidoEstado: subReclamo.pedidoEstado,
        codigoInterno: subReclamo.codigoInterno,
        cantidad: subReclamo.cantidad,
        codigoAnterior: subReclamo.codigoAnterior,
        codigoPosterior: subReclamo.codigoPosterior,
        remito: subReclamo.remito // Asegúrate de incluir este campo
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
  const { estado, respuesta, subId, usernameAlmacen, remito, problemaRemito, estadoRemito, pedidoEstado, codigoInterno, cantidad, codigoAnterior, codigoPosterior } = req.body;

  try {
    let reclamos = await readReclamos();
    let found = false;
    let pedido, cliente, mensaje, fecha;

    reclamos = reclamos.map(reclamo => {
      if (reclamo.id === parseInt(id)) {
        pedido = reclamo.pedido;
        cliente = reclamo.cliente;

        reclamo.reclamos = reclamo.reclamos.map(subReclamo => {
          if (subReclamo.id === subId) {
            subReclamo.estado = estado || subReclamo.estado;
            subReclamo.respuesta = respuesta || subReclamo.respuesta;
            subReclamo.usernameAlmacen = usernameAlmacen || subReclamo.usernameAlmacen;
            subReclamo.remito = remito || subReclamo.remito;
            subReclamo.problemaRemito = problemaRemito || subReclamo.problemaRemito;
            subReclamo.estadoRemito = estadoRemito || subReclamo.estadoRemito;
            subReclamo.pedidoEstado = pedidoEstado !== undefined ? pedidoEstado : subReclamo.pedidoEstado;
            subReclamo.codigoInterno = codigoInterno !== undefined ? codigoInterno : subReclamo.codigoInterno;
            subReclamo.cantidad = cantidad !== undefined ? cantidad : subReclamo.cantidad;
            subReclamo.codigoAnterior = codigoAnterior !== undefined ? codigoAnterior : subReclamo.codigoAnterior;
            subReclamo.codigoPosterior = codigoPosterior !== undefined ? codigoPosterior : subReclamo.codigoPosterior;
            mensaje = subReclamo.mensaje;
            fecha = subReclamo.fecha;
            found = true;

            // Agregar al historial de reclamos
            (async () => {
              const historicoReclamos = await readHistoricoReclamos();
              let nuevoMensaje = '';

              if (pedidoEstado === 'activacionTotal') {
                nuevoMensaje = `${usernameAlmacen} ha solicitado a ventas la liberación del pedido completo, aguarde hasta que se resuelva para avanzar.`;
              } else if (pedidoEstado === 'activacionParcial') {
                nuevoMensaje = `${usernameAlmacen} ha solicitado a ventas la activación parcial del pedido, aguarde hasta que se resuelva para avanzar.`;
              } else if (pedidoEstado === 'cambioCodigoInterno') {
                nuevoMensaje = `${usernameAlmacen} ha solicitado a ventas la corrección del código interno, aguarde hasta que se resuelva para avanzar.`;
              } else if (estado === 'respondido' && respuesta) {
                nuevoMensaje = `El operador de almacén ${usernameAlmacen} informa que podrá preparar el pedido para la fecha ${respuesta}.`;
              } else if (estado === 'material preparado') {
                nuevoMensaje = `El operador de almacén ${usernameAlmacen} informa que el material está preparado pero sin remito.`;
              } else if (estadoRemito === 'resuelto' && estado === 'remito enviado') {
                nuevoMensaje = `Almacenes ha enviado el remito con el material en reclamo.`;
              } else if (estadoRemito === 'resuelto') {
                nuevoMensaje = `Administración ha informado que el pedido quedó desbloqueado para poder avanzar con el proceso de impresión de remito.`;
              } else if (estadoRemito === 'retenido deuda') {
                nuevoMensaje = `Administración ha retenido el remito ${remito} por deuda.`;
              } else if (estadoRemito === 'desbloqueado') {
                nuevoMensaje = `Administración ha procedido al desbloqueo del remito, mercancía pasa a despacho.`;
              } else if (problemaRemito) {
                nuevoMensaje = `El operador ${usernameAlmacen} informa que existe un inconveniente al preparar el remito. Tipo de problema: ${problemaRemito}.`;
              } else if (estado === 'cerrado') {
                nuevoMensaje = `El usuario ${usernameAlmacen} ha dado por cerrado el reclamo.`;
              } else if (pedidoEstado === '') {
                nuevoMensaje = `El operador ${usernameAlmacen} ha procedido con la solicitud de almacenes.`;
              }

              const nuevoHistoricoReclamo = {
                id: subId,
                pedido,
                cliente,
                estado: subReclamo.estado,
                mensaje: nuevoMensaje,
                fecha,
                timestamp: moment().format('DD-MM-YYYY HH:mm:ss'),
                respuesta: subReclamo.respuesta,
                usernameAlmacen: subReclamo.usernameAlmacen,
                remito: subReclamo.remito,
                problemaRemito: subReclamo.problemaRemito,
                estadoRemito: subReclamo.estadoRemito,
                pedidoEstado: subReclamo.pedidoEstado,
                codigoInterno: subReclamo.codigoInterno,
                cantidad: subReclamo.cantidad,
                codigoAnterior: subReclamo.codigoAnterior,
                codigoPosterior: subReclamo.codigoPosterior
              };
              historicoReclamos.push(nuevoHistoricoReclamo);
              await writeHistoricoReclamos(historicoReclamos);
            })();
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



// Función para contar fechas de entrega por pedido
const contarFechasDeEntregaPorPedido = (pedidoId) => {
  let cantidadFechas = 0;
  const fechasEntrega = [];

  try {
    const historico = readHistoricoReclamos();
    historico.forEach(entry => {
      if (entry.pedido == pedidoId && entry.respuesta) {
        const fechaMatch = entry.respuesta.match(/Se entregará en la fecha (\d{1,2}\/\d{1,2}\/\d{4})/);
        if (fechaMatch) {
          const fechaEntrega = moment(fechaMatch[1], 'D/M/YYYY');
          if (fechasEntrega.length === 0 || fechaEntrega.isAfter(fechasEntrega[fechasEntrega.length - 1])) {
            fechasEntrega.push(fechaEntrega);
            cantidadFechas++;
          }
        }
      }
    });
  } catch (error) {
    console.error('Error leyendo el archivo historicoReclamos.json:', error.message);
  }
  return cantidadFechas;
};

app.get('/api/v1/cantidadFechasEntrega/:pedidoId', authenticateToken, (req, res) => {
  const { pedidoId } = req.params;
  try {
    const cantidadFechas = contarFechasDeEntregaPorPedido(pedidoId);
    res.json({ cantidadFechas });
  } catch (error) {
    console.error('Error obteniendo la cantidad de fechas de entrega:', error.message);
    res.status(500).json({ error: 'Error obteniendo la cantidad de fechas de entrega', message: error.message });
  }
});

// Ruta para subir y reemplazar orders.json
app.post('/api/v1/uploadOrders', authenticateToken, upload.single('file'), async (req, res) => {
  if (req.role !== 'administrador') {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (!req.file) {
    return res.status(400).send('No se ha subido ningún archivo.');
  }

  const newFilePath = path.join(filePaths.document, req.file.filename);
  const ordersFilePath = filePaths.orders;

  try {
    // Leer el archivo subido como texto
    let fileContent = fs.readFileSync(newFilePath, 'utf8');

    // Reemplazar todos los NaN con "NaN"
    fileContent = fileContent.replace(/NaN/g, '"NaN"');

    // Parsear el archivo JSON corregido
    let newOrdersData = JSON.parse(fileContent);

    // Verificar y corregir la fecha de actualización
    if (newOrdersData.Fecha_actualizacion) {
      const fecha = moment(newOrdersData.Fecha_actualizacion, ['DD-MM-YYYY', 'YYYY-MM-DD']);
      newOrdersData.Fecha_actualizacion = fecha.format('DD-MM-YYYY');
    }

    // Escribir el archivo corregido en orders.json
    await fs.promises.writeFile(ordersFilePath, JSON.stringify(newOrdersData, null, 2), 'utf8');

    res.status(200).json({ message: 'Archivo orders.json reemplazado y verificado con éxito.' });
  } catch (error) {
    console.error('Error procesando el archivo subido:', error.message);
    res.status(500).json({ error: 'Error procesando el archivo subido', message: error.message });
  }
});

// Función para contar correos por tipo de mensaje para un pedido específico
const contarCorreosPorTipoParaPedido = (pedidoId) => {
  try {
    const historicoReclamos = readHistoricoReclamos();
    const conteoPorTipo = historicoReclamos
      .filter(entry => entry.pedido == pedidoId && entry.tipoMensaje) // Asegúrate de comparar correctamente
      .reduce((acc, curr) => {
        const tipoMensaje = curr.tipoMensaje;
        if (!acc[tipoMensaje]) {
          acc[tipoMensaje] = 0;
        }
        acc[tipoMensaje]++;
        return acc;
      }, {});
    return conteoPorTipo;
  } catch (error) {
    console.error('Error contando correos por tipo para el pedido:', error.message);
    return {};
  }
};

app.get('/api/v1/contarCorreosPorTipo/:pedidoId', authenticateToken, (req, res) => {
  const { pedidoId } = req.params;
  try {
    const conteoPorTipo = contarCorreosPorTipoParaPedido(pedidoId);
    res.json(conteoPorTipo);
  } catch (error) {
    console.error('Error al contar correos por tipo para el pedido:', error.message);
    res.status(500).json({ error: 'Error al contar correos por tipo para el pedido', message: error.message });
  }
});


// Ruta para obtener los clientes
app.get('/api/v1/clientes', authenticateToken, (req, res) => {
  const { role } = req;

  if (role !== 'vendedor' && role !== 'administrador') {
    return res.status(403).json({ error: 'Access denied' });
  }

  fs.readFile(filePaths.clientes, 'utf8', (err, data) => {
    if (err) {
      console.error('Error leyendo clientes.json:', err);
      return res.status(500).json({ error: 'Error leyendo la base de datos de clientes' });
    }
    res.json(JSON.parse(data));
  });
});

app.put('/api/v1/clientes', authenticateToken, async (req, res) => {
  const { codigo, field, value } = req.body;

  try {
    const clientesData = JSON.parse(fs.readFileSync(filePaths.clientes, 'utf8'));

    const clienteIndex = clientesData.clientes.findIndex(cliente => cliente.Codigo === codigo);
    if (clienteIndex === -1) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Actualizar el campo correspondiente
    if (field) {
      if (field === 'telefono' || field === 'mail') {
        clientesData.clientes[clienteIndex][field] = value;
      } else {
        // Mantén el resto de la lógica de actualización para otros campos
        if (field === 'nombre de provincia') {
          if (['caba', 'capital federal'].includes(value.toLowerCase())) {
            clientesData.clientes[clienteIndex].provincia = '';
            clientesData.clientes[clienteIndex].caba = 'si';
          } else {
            clientesData.clientes[clienteIndex][field] = value;
          }
        } else if (field === 'barrio' || field === 'nombre de barrio') {
          clientesData.clientes[clienteIndex].barrio = value.toLowerCase();
          if (value.toLowerCase() === 'buenos aires') {
            clientesData.clientes[clienteIndex].provincia = 'si';
            clientesData.clientes[clienteIndex].caba = '';
          }
        } else {
          clientesData.clientes[clienteIndex][field] = value;
        }
      }
    } else {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Guardar los cambios en el archivo
    fs.writeFileSync(filePaths.clientes, JSON.stringify(clientesData, null, 2), 'utf8');

    res.json({ message: 'Cliente actualizado exitosamente' });
  } catch (error) {
    console.error('Error actualizando cliente:', error);
    res.status(500).json({ error: 'Error actualizando cliente' });
  }
});


app.put('/api/v1/clientes/codigo', authenticateToken, async (req, res) => {
  const { codigoActual, nuevoCodigo } = req.body;

  try {
    const clientesData = JSON.parse(fs.readFileSync(filePaths.clientes, 'utf8'));

    const clienteIndex = clientesData.clientes.findIndex(cliente => cliente.Codigo === codigoActual);
    if (clienteIndex === -1) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Atualizar o código do cliente
    clientesData.clientes[clienteIndex].Codigo = nuevoCodigo;

    // Guardar as mudanças no arquivo
    fs.writeFileSync(filePaths.clientes, JSON.stringify(clientesData, null, 2), 'utf8');

    res.json({ message: 'Código del cliente actualizado exitosamente' });
  } catch (error) {
    console.error('Error actualizando el código del cliente:', error);
    res.status(500).json({ error: 'Error actualizando el código del cliente' });
  }
});

const readClientes = () => {
  try {
    return JSON.parse(fs.readFileSync(filePaths.clientes, 'utf8'));
  } catch (error) {
    console.error('Error leyendo clientes.json:', error.message);
    return { clientes: [] };
  }
};

const writeClientes = async (clientes) => {
  try {
    await fs.promises.writeFile(filePaths.clientes, JSON.stringify(clientes, null, 2), 'utf8');
  } catch (error) {
    console.error('Error escribiendo clientes.json:', error.message);
    throw error;
  }
};

// Ruta para eliminar un cliente
app.delete('/api/v1/clientes/:codigo', authenticateToken, async (req, res) => {
  const codigo = req.params.codigo;

  try {
    const clientesData = readClientes();
    const clienteIndex = clientesData.clientes.findIndex(cliente => cliente.Codigo === codigo);

    if (clienteIndex === -1) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    clientesData.clientes.splice(clienteIndex, 1);
    await writeClientes(clientesData);

    res.status(200).json({ message: 'Cliente eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando cliente:', error);
    res.status(500).json({ error: 'Error eliminando cliente', message: error.message });
  }
});

const validateAndCorrectLocationFields = (cliente, excelCliente) => {
  let modified = false;

  // Actualizar caba y provincia basándose en los datos del Excel
  if (excelCliente.Ciudad_Provisorio && excelCliente.Ciudad_Provisorio.toLowerCase() === 'caba') {
    if (cliente.caba !== 'si' || cliente.provincia !== '') {
      cliente.caba = 'si';
      cliente.provincia = '';
      modified = true;
    }
  } else {
    if (cliente.caba !== '' || cliente.provincia !== 'si') {
      cliente.caba = '';
      cliente.provincia = 'si';
      modified = true;
    }
  }

  return modified;
};

app.post('/api/v1/uploadClientes', authenticateToken, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No se ha subido ningún archivo.');
  }

  const filePath = path.join(filePaths.document, req.file.filename);

  try {
    // Leer y parsear el archivo Excel
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    // Leer los clientes existentes
    const clientesData = readClientes();
    let modifiedCount = 0;
    let newClientsCount = 0;

    // Actualizar los clientes existentes con los nuevos datos
    data.forEach(excelCliente => {
      const index = clientesData.clientes.findIndex(cliente => cliente.Codigo === excelCliente.Codigo);
      let modified = false;
      let isNewClient = false;
      if (index !== -1) {
        const currentCliente = clientesData.clientes[index];

        // Actualiza los demás campos del cliente
        const updatedFields = { ...currentCliente, ...excelCliente };

        // Validar y corregir los campos caba y provincia
        if (validateAndCorrectLocationFields(updatedFields, excelCliente)) {
          modified = true;
        }

        if (JSON.stringify(currentCliente) !== JSON.stringify(updatedFields)) {
          clientesData.clientes[index] = updatedFields;
          modified = true;
        }

        if (modified) {
          modifiedCount++;
        }
      } else {
        // Si es un nuevo cliente, aplica las mismas reglas
        if (validateAndCorrectLocationFields(excelCliente, excelCliente)) {
          modified = true;
        }

        // Añadir el nuevo cliente a la lista
        clientesData.clientes.push(excelCliente);
        newClientsCount++;
      }
    });

    // Guardar los clientes actualizados
    await writeClientes(clientesData);

    res.status(200).json({ 
      message: `Datos de clientes actualizados con éxito. Clientes modificados: ${modifiedCount}`,
      newClientsMessage: newClientsCount > 0 ? `${newClientsCount} clientes inyectados con éxito.` : ''
    });
  } catch (error) {
    console.error('Error procesando el archivo subido:', error.message);
    res.status(500).json({ error: 'Error procesando el archivo subido', message: error.message });
  }
});

const validateAndFormatDate = (date) => {
  if (!isNaN(date)) {
    // Convertir número de fecha de Excel a fecha
    const excelDate = XLSX.SSF.parse_date_code(date);
    return moment(new Date(excelDate.y, excelDate.m - 1, excelDate.d)).format('YYYY-MM-DD HH:mm:ss');
  } else {
    // Verificar múltiples formatos
    const formats = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'YYYY/MM/DD'];
    for (const format of formats) {
      if (moment(date, format, true).isValid()) {
        return moment(date, format).format('YYYY-MM-DD HH:mm:ss');
      }
    }
  }
  return date;
};

const validateAndFormatPedido = (pedido) => {
  return {
    Pedido: pedido.Pedido ? String(pedido.Pedido).trim() : "",
    Cliente: pedido.Cliente ? String(pedido.Cliente).trim() : "",
    oc: pedido.oc ? String(pedido.oc).trim() : "falta oc",
    Items: pedido.Items.map(item => ({
      Item: item.Item ? String(item.Item).trim() : "",
      Codigo: item.Codigo ? String(item.Codigo).trim() : "",
      Descripcion: item.Descripcion ? String(item.Descripcion).trim() : "",
      Cantidad: item.Cantidad ? Number(item.Cantidad) : 0,
      Fecha_vencida: item.Fecha_vencida ? validateAndFormatDate(item.Fecha_vencida) : "",
      Inicio: item.Inicio ? validateAndFormatDate(item.Inicio) : ""
    })),
    Inicio: pedido.Inicio ? validateAndFormatDate(pedido.Inicio) : ""
  };
};


app.post('/api/v1/uploadPedidos', authenticateToken, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No se ha subido ningún archivo.');
  }

  const filePath = path.join(filePaths.document, req.file.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(400).send(`No se encontró el archivo subido: ${filePath}`);
  }

  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    const pedidosData = readPedidos();
    const newDate = moment().format('DD-MM-YYYY HH:mm:ss');

    // Agrupar ítems por pedido
    const pedidosMap = new Map();

    data.forEach(excelRow => {
      const pedidoKey = excelRow.Pedido;
      const item = {
        Item: excelRow.Item,
        Codigo: excelRow.Codigo,
        Descripcion: excelRow['Descripción Producto'],
        Cantidad: excelRow.Cantidad,
        Fecha_vencida: validateAndFormatDate(excelRow.Fecha),
        Inicio: validateAndFormatDate(excelRow.Inicio)
      };

      if (pedidosMap.has(pedidoKey)) {
        pedidosMap.get(pedidoKey).Items.push(item);
      } else {
        pedidosMap.set(pedidoKey, {
          Pedido: excelRow.Pedido,
          Cliente: excelRow['Nombre Cliente'],
          oc: excelRow.OC,
          Items: [item],
          Inicio: validateAndFormatDate(excelRow.Inicio)
        });
      }
    });

    // Procesar y actualizar pedidos
    const newPedidos = [];

    pedidosMap.forEach((excelPedido, pedidoKey) => {
      const validatedPedido = validateAndFormatPedido(excelPedido);
      const existingIndex = pedidosData.Pedidos.findIndex(pedido => pedido.Pedido === pedidoKey);

      if (existingIndex !== -1) {
        // Pedido existente, actualizar ítems
        pedidosData.Pedidos[existingIndex] = validatedPedido;
      } else {
        // Nuevo pedido
        pedidosData.Pedidos.push(validatedPedido);
      }
    });

    // Eliminar pedidos que no existen en el nuevo archivo Excel
    const newPedidoKeys = Array.from(pedidosMap.keys());
    pedidosData.Pedidos = pedidosData.Pedidos.filter(pedido => newPedidoKeys.includes(pedido.Pedido));

    pedidosData.Fecha_actualizacion = newDate;
    await writePedidos(pedidosData);

    res.status(200).json({ 
      message: `Datos de pedidos actualizados con éxito. Pedidos modificados: ${pedidosData.Pedidos.length}`,
      newOrdersMessage: `${pedidosData.Pedidos.length} pedidos inyectados con éxito.`
    });
  } catch (error) {
    console.error('Error procesando el archivo subido:', error.message);
    res.status(500).json({ error: 'Error procesando el archivo subido', message: error.message });
  }
});



app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
