import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'orders.json');

export function readPedidos() {
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

export function writePedidos(data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
