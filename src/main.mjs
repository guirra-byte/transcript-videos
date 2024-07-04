import { createServer } from 'node:http';
import dotenv from 'dotenv';
import { connect } from 'amqplib';
import formidable from 'formidable';
import { chunkingOutPath } from './config/path.config.mjs';

let channel;
dotenv.config();
function createConnection() {
  (async () => {
    const rabbitMq = await connect(process.env.RABBITMQ_CONNECT_URL);
    channel = await rabbitMq.createChannel();
  })();
}

const WORKERS = 5;
const TRANSCRIPT_WORKERS = [];
const CHUNK_WORKERS = [];
const SERVER_PORT = 5262;

createConnection();
const server = createServer(async (request, response) => {
  if (request.url === '/transcript') {
    console.log('Receiving request to transcript videos...');

    const { videos } = request.body;
    channel.assertQueue('transcript');
    channel.publish('', 'transcript',
      Buffer.from(JSON.stringify(videos))
    );

    server.close();
    return response.end();
  }

  if (request.url === '/large-videos' && request.method === 'POST') {
    const form = formidable({
      maxTotalFileSize: (200 * 1024 * 1024) * 10,
      multiples: true,
      maxFields: 10,
      uploadDir: chunkingOutPath,
    });

    const [, files] = form.parse(request);
    if (files) {
      channel.assertQueue('large-video');
      channel.publish('', 'large-video',
        Buffer.from(JSON.stringify(files))
      );

      server.close();
      return response.end();
    }
  }
});

server.listen(SERVER_PORT, () =>
  console.log(`Server is running on port: ${SERVER_PORT}`)
);

export { channel, WORKERS, TRANSCRIPT_WORKERS, CHUNK_WORKERS };