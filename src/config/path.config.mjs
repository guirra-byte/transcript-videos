import path from 'node:path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const filePath = (pattern, file_id) => { 
  return path.join(__dirname, `../output/${pattern}-${file_id}`);
}