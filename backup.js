import fs from 'fs';
import path from 'path';

// Ruta a los archivos y directorios de la aplicación
const filePaths = {
  reclamos: path.join(process.cwd(), 'data/pedidosReclamos.json'),
  orders: path.join(process.cwd(), 'data/orders.json'),
  users: path.join(process.cwd(), 'data/us.json'),
  document: path.join(process.cwd(), 'data/document'),
  historico: path.join(process.cwd(), 'data/datosHistoricos.json'),
  historicoReclamos: path.join(process.cwd(), 'data/historicoReclamos.json'),
  mails: path.join(process.cwd(), 'data/dbMails.json'),
  clientes: path.join(process.cwd(), 'data/clientes.json'), // Añadido clientes.json
};

// Ruta al directorio de backup en la unidad D:
const backupDir = path.join('D:', '_Backup', 'BackupReclamosVentas');

// Crear el directorio de backup si no existe
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Función para copiar archivos
const copyFile = (src, dest) => {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(src);
    const writeStream = fs.createWriteStream(dest);

    readStream.on('error', reject);
    writeStream.on('error', reject);
    writeStream.on('finish', resolve);

    readStream.pipe(writeStream);
  });
};

// Función para copiar directorios
const copyDirectory = async (src, dest) => {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
};

// Función para realizar el backup
const performBackup = async () => {
  try {
    console.log('Iniciando backup...');

    // Copiar archivos JSON
    for (let [key, filePath] of Object.entries(filePaths)) {
      if (key !== 'document') {
        const destPath = path.join(backupDir, path.basename(filePath));
        console.log(`Copiando archivo: ${filePath} a ${destPath}`);
        await copyFile(filePath, destPath);
      }
    }

    // Copiar directorio "document"
    const destDirPath = path.join(backupDir, 'document');
    console.log(`Copiando directorio: ${filePaths.document} a ${destDirPath}`);
    await copyDirectory(filePaths.document, destDirPath);

    console.log('Backup completado con éxito');
  } catch (error) {
    console.error('Error realizando el backup:', error.message);
  }
};

// Ejecutar el backup inmediatamente
performBackup();
