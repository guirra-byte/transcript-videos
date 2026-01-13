import { createServer } from 'node:http';
import { broker } from './core/libs/rabbitmq/index.mjs';
import "./worker-pool.mjs";
import { PassThrough } from 'node:stream';
import { config } from 'dotenv';
import busboy from "busboy";
import { S3Provider } from './core/libs/aws/index.mjs';

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

  if (request.url === '/ingestion/upload-url' && request.method === "POST") {
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

  if (request.url === "/ingestion/direct-upload" && request.method === "POST") {
    const xUploadAuthorization = request.headers["x-upload-authorization"];
    const unavailableUploadAuthKey = xUploadAuthorization !== process.env.UPLOAD_AUTHORIZATION_KEY;
    if (!xUploadAuthorization || unavailableUploadAuthKey) {
      response.statusCode = 401;
      response.statusMessage = "Unauthorized";
      return response.end();
    }

    const busboyHandler = busboy({ headers: request.headers, limits: { fileSize: 1024 * 1024 * 50 * 10 } });
    const streamUploadCallback = (payload) => {
      console.log(payload);
    };

    busboyHandler.on("file", async (_name, file, info) => {
      const startAt = process.hrtime.bigint();

      const bucket = process.env.AWS_BUCKET_NAME;
      const passThrough = new PassThrough();

      const s3Provider = new S3Provider();
      const uploadPromise = s3Provider.streamUpload(bucket, info.filename, passThrough, streamUploadCallback);
      file.pipe(passThrough);

      file.on("end", async () => {
        try {
          await uploadPromise;
          const endAt = process.hrtime.bigint();
          const executionTimeMs =
            Number(endAt - startAt) / 1_000_000;

          console.log(
            `File: ${info.filename} uploaded in ${executionTimeMs}ms`
          );
        } catch (err) {
          console.error("Upload failed:", err);

          response.statusCode = 500;
          response.statusMessage = "Internal Server Error";
          return response.end();
        }
      });
    });

    request.pipe(busboyHandler);

    response.statusCode = 200;
    response.statusMessage = "File S3 upload succeed!";
    return response.end();
  }

  if (request.url === "/form" && request.method === "GET") {
    response.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      Connection: 'close'
    });

    response.end(`
      <html>
        <head></head>
        <body>
          <form method="POST" action="https://bf6199e72208.ngrok-free.app/ingestion/direct-upload" enctype="multipart/form-data">
            <input type="file" name="filefield"><br />
            <input type="text" name="textfield"><br />
            <input type="submit">
          </form>
        </body>
      </html>
    `);

    return;
  }
});

server.listen(SERVER_PORT, () => {
  console.log(`Server is running on port: ${SERVER_PORT}`)
});

export { WORKERS, APP_WORKERS };