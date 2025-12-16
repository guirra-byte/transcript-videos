import { createServer } from 'node:http';
import { broker } from './core/libs/rabbitmq/index.mjs';
import "./worker-pool.mjs";
import { presignedUrlIssuerService } from './services/presigned-urls-issuer-service.mjs';
import { config } from 'dotenv';

const WORKERS = 3;
const APP_WORKERS = [];
const SERVER_PORT = 3000;

config();
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

  if (request.url === '/ingestion/upload-url' && request.method === 'POST') {
    const xUploadAuthorization = request.headers["x-upload-authorization"];
    const unavailableUploadAuthKey = xUploadAuthorization !== process.env.UPLOAD_AUTHORIZATION_KEY;
    if (!xUploadAuthorization || unavailableUploadAuthKey) {
      response.statusCode = 401;
      response.statusMessage = "Unauthorized";
      return response.end();
    }

    request.on("data", async (rawData) => {
      try {
        const data = Buffer.from(rawData).toString();
        const parsedData = JSON.parse(data);

        const result = await presignedUrlIssuerService.execute(parsedData.filename);
        const reply = Buffer.from(JSON.stringify(result));

        response.statusCode = 201;
        response.write(reply);
        return response.end();
      }
      catch (err) {
        response.statusCode = 500;
        console.log(err);

        response.statusMessage = "Internal Server Error";
        return response.end();
      }
    });
  }
});

server.listen(SERVER_PORT, () => {
  console.log(`Server is running on port: ${SERVER_PORT}`)
});

export { WORKERS, APP_WORKERS };