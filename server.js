import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import moment from 'moment';
import jwt from 'jsonwebtoken';
import bodyParser from 'body-parser';
import multer from 'multer';
import nodemailer from 'nodemailer';

const app = express();
const PORT = 3000;
const JWT_SECRET = 'charly';

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: 'cotizaciones@dosivac.com',
    pass: 'kzsu mdmt tkrl ngzr',
  },
});

const sendEmail = (to, subject, text, html, attachments) => {
  const mailOptions = {
    from: 'cotizaciones@dosivac.com',
    to,
    subject,
    text,
    html,
    attachments,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error enviando el correo:', error);
    } else {
      console.log('Correo enviado:', info.response);
    }
  });
};

const filePaths = {
  reclamos: path.join(process.cwd(), 'data/pedidosReclamos.json'),
  orders: path.join(process.cwd(), 'data/orders.json'),
  users: path.join(process.cwd(), 'data/us.json'),
  document: path.join(process.cwd(), 'data/document'),
  historico: path.join(process.cwd(), 'data/datosHistoricos.json'),
  historicoReclamos: path.join(process.cwd(), 'data/historicoReclamos.json'),
  mails: path.join(process.cwd(), 'data/dbMails.json'),
};

app.use('/document', express.static(filePaths.document));

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
};

initializeFiles();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, filePaths.document);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);  // Asegura nombres de archivo únicos
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

  sendEmail(to, subject, text);
  res.status(200).json({ message: 'Correo enviado con éxito' });
});

app.post('/api/v1/sendEmailWithAttachment', authenticateToken, upload.single('file'), (req, res) => {
  const { to, subject, text } = req.body;
  const file = req.file;

  if (!to || !subject || !text) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const attachments = file ? [{ path: file.path }] : [];

  sendEmail(to, subject, text, null, attachments);
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
  const filePath = path.join(filePaths.document, req.file.filename);
  const downloadUrl = `http://localhost:3000/document/${req.file.filename}`;

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
    const diasPrevios = parseInt(req.query.diasPrevios) || 1;
    const clienteQuery = req.query.cliente ? req.query.cliente.toLowerCase() : '';
    const numeroPedidoQuery = req.query.numeroPedido ? req.query.numeroPedido.toLowerCase() : '';
    const materialQuery = req.query.material ? req.query.material.toLowerCase() : '';

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
      const matchesMaterial = materialQuery ? order.Items.some(item => item.Descripcion.toLowerCase().includes(materialQuery)) : true;

      return hasItemsMatchingDate && matchesCliente && matchesNumeroPedido && matchesMaterial;
    });

    const mails = readMails();

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

      const cliente = order.Cliente;
      const mailEntry = mails.find(mail => mail.Cliente === cliente);
      if (!mailEntry) {
        mails.push({ Cliente: cliente, mail: '' });
        order.needsEmail = true;
      } else if (!mailEntry.mail) {
        order.needsEmail = true;
      } else {
        order.email = mailEntry.mail;
      }
    });

    writeMails(mails);

    res.json({ Fecha_actualizacion, Pedidos: filteredPedidos });
  } catch (err) {
    console.error('Error obteniendo pedidos:', err.message, err.stack);
    res.status(500).json({ error: 'Error obteniendo pedidos', message: err.message });
  }
});

app.post('/api/v1/saveEmail', authenticateToken, async (req, res) => {
  const { cliente, email } = req.body;

  if (!cliente || !email) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const mails = readMails();
    const mailEntry = mails.find(mail => mail.Cliente === cliente);

    if (mailEntry) {
      mailEntry.mail = email;
    } else {
      mails.push({ Cliente: cliente, mail: email });
    }

    await writeMails(mails);
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
    const { pedido, cliente, estado, prioridad, mensaje, material, estadoRemito, problemaRemito, pedidoEstado, codigoInterno, cantidad, codigoAnterior, codigoPosterior } = req.body;

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
      material,
      estadoRemito,
      problemaRemito,
      pedidoEstado,
      codigoInterno,
      cantidad,
      codigoAnterior,
      codigoPosterior
    };

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

    // Agregar al historial de reclamos
    const historicoReclamos = readHistoricoReclamos();
    const nuevoHistoricoReclamo = {
      id: nuevoSubReclamo.id,
      pedido,
      cliente,
      estado,
      mensaje,
      fecha,
      timestamp: nuevoSubReclamo.fecha
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
        pedidoEstado: subReclamo.pedidoEstado, // Asegurarse de incluir este campo
        codigoInterno: subReclamo.codigoInterno, // Asegurarse de incluir este campo
        cantidad: subReclamo.cantidad, // Asegurarse de incluir este campo
        codigoAnterior: subReclamo.codigoAnterior, // Asegurarse de incluir este campo
        codigoPosterior: subReclamo.codigoPosterior // Asegurarse de incluir este campo
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
              } else if (estadoRemito === 'resuelto') {
                nuevoMensaje = `Administración ha informado que el pedido quedó desbloqueado para poder avanzar con el proceso de impresión de remito.`;
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
                fecha: subReclamo.fecha,
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

  try {
    const historico = JSON.parse(fs.readFileSync(filePaths.historicoReclamos, 'utf8'));
    historico.forEach(entry => {
      if (entry.pedido == pedidoId && entry.respuesta && /Se entregará en la fecha \d{1,2}\/\d{1,2}\/\d{4}/.test(entry.respuesta)) {
        cantidadFechas++;
      }
    });
  } catch (error) {
    console.error('Error leyendo el archivo historicoReclamos.json:', error.message);
  }

  return cantidadFechas;
};

app.get('/api/v1/cantidadFechasEntrega/:pedidoId', (req, res) => {
  const { pedidoId } = req.params;

  try {
    const cantidadFechas = contarFechasDeEntregaPorPedido(pedidoId);
    res.json({ cantidadFechas });
  } catch (error) {
    console.error('Error obteniendo la cantidad de fechas de entrega:', error.message);
    res.status(500).json({ error: 'Error obteniendo la cantidad de fechas de entrega', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
