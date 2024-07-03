import path from 'node:path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const filePath = (pattern, file_id) => {
  return path.join(__dirname, `../output/tmp/${pattern}-${file_id}`);
}

const chunkingOutPath = path.join(__dirname, '../output/tmp/videos/chunks');

export { filePath, chunkingOutPath }