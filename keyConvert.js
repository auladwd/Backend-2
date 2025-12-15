import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(
  __dirname,
  'firebase',
  'firebase-service-account.json'
);
const key = fs.readFileSync(filePath, 'utf8');

// convert to base64
const base64 = Buffer.from(key).toString('base64');

console.log(base64);
