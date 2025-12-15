import { createServer } from 'node:http';
import { broker } from './core/libs/rabbitmq/index.mjs';
import "./worker-pool.mjs";

const WORKERS = 3;
const APP_WORKERS = [];
const SERVER_PORT = 3000;
const server = createServer(async (request, response) => {
  if (request.url === '/callbacks/s3/video-created' && request.method === "POST") {
    const [xApiKey, eventBridgeApiKey] = [
      request.headers["x-api-key"],
      request.headers["x-event-bridge-api-key"]
    ];

    const missingApiKeys = !xApiKey || !eventBridgeApiKey;
    const unavailableApiKeys = xApiKey !== process.env.AWS_S3_X_API_KEY ||
      eventBridgeApiKey !== process.env.AWS_EVENTBRIDGE_API_KEY;

    if (missingApiKeys || unavailableApiKeys) {
      response.statusCode = 401;
      response.statusMessage = "Unauthorized";
      return response.end();
    }

    response.statusCode = 202;
    response.statusMessage = "Processing your request!";
    response.end();

    request.on("data", async (rawData) => {
      broker.assertQueue("dispatch");
      const parsedData = Buffer.from(rawData).toString();
      broker.publish("", "dispatch", Buffer.from(parsedData));
    });
  }
});

server.listen(SERVER_PORT, () => {
  console.log(`Server is running on port: ${SERVER_PORT}`)
});

export { WORKERS, APP_WORKERS };