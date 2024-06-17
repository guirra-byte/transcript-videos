import { createServer } from 'node:http';
import dotenv from 'dotenv';
import { connect } from 'amqplib';

let channel;
dotenv.config();
function createConnection() {
  (async () => {
    const rabbitMq = await connect(process.env.RABBITMQ_CONNECT_URL);
    channel = await rabbitMq.createChannel();
  })();
}

const WORKERS = 5;
const APP_WORKERS = [];
const SERVER_PORT = 5262;

createConnection();
const server = createServer((request, response) => {
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
});

server.listen(SERVER_PORT, () =>
  console.log(`Server is running on port: ${SERVER_PORT}`)
);

export { channel, WORKERS, APP_WORKERS };