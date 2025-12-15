import { Worker } from 'node:worker_threads';
import { APP_WORKERS, WORKERS } from './main.mjs';
import { broker } from './core/libs/rabbitmq/index.mjs';
import { rootDir } from './config/path.config.mjs';
import { rateLimiter as openAiRateLimiter } from './core/utils/rate-limiter.mjs';

const pendingMessages = new Map();
const rateLimiter = openAiRateLimiter();
function loudBalancer(array) {
  let index = 0;
  return () => {
    if (index >= array.length) index = 0;
    return array[index++];
  }
}

function createWorker(_index) {
  const transcriptWorkerFilepath = rootDir().concat("/transcription.worker.mjs");
  const videoWorker = new Worker(transcriptWorkerFilepath);

  videoWorker.on("error", (err) => {
    console.log("[transcript.worker.mjs] throws", err);
    const pending = pendingMessages.get(videoWorker.threadId);
    if (pending) {
      broker.nack(pending.msg, false, false);
      pendingMessages.delete(videoWorker.threadId);
    }
  });

  videoWorker.on('message', (backcomming_msg) => {
    const response = JSON.parse(backcomming_msg);
    const pending = pendingMessages.get(videoWorker.threadId);
    if (pending) {
      if (response.success) {
        broker.ack(pending.msg);
        console.log(`Video ${backcomming_msg} foi transcrito.`);
      } else {
        console.log("[transcript.worker.mjs] error response:", response.error);
        broker.nack(pending.msg, false, false);
      }

      pendingMessages.delete(videoWorker.threadId);
    }
  });

  videoWorker.on('exit', (code) => {
    console.log(`[transcript.worker.mjs] Worker exited with code ${code}, replacing...`);
    const pending = pendingMessages.get(videoWorker.threadId);
    if (pending) {
      broker.nack(pending.msg, false, false);
      pendingMessages.delete(videoWorker.threadId);
    }

    const workerIndex = APP_WORKERS.findIndex(w => w.worker.threadId === videoWorker.threadId);
    if (workerIndex !== -1) {
      APP_WORKERS[workerIndex] = { worker: createWorker(workerIndex) };
    }
  });

  return videoWorker;
}

function loudBalancerConsumer() {
  console.log("[load-balancer.mjs] is running...");

  broker.assertQueue("dispatch");
  broker.consume('dispatch', async (msg) => {
    try {
      const canRun = rateLimiter();
      if (!canRun) {
        console.log("[load-balancer.mjs] Rate limit exceeded, requeuing message...");
        broker.nack(msg, false, true);
        return;
      }

      const s3CreatedObject = JSON.parse(msg.content.toString());

      for (let i = 0; i < WORKERS; i++) {
        const videoWorker = createWorker(i);
        APP_WORKERS.push({ worker: videoWorker });
      }

      console.log(`[load-balancer.mjs] Initialized ${WORKERS} workers`);
      const getNextWorker = loudBalancer(APP_WORKERS);
      const { worker } = getNextWorker();

      pendingMessages.set(worker.threadId, { msg });

      worker.postMessage(
        JSON.stringify({
          msg,
          bucket: s3CreatedObject.detail.bucket.name,
          s3Key: s3CreatedObject.detail.object.key,
          s3ObjectId: s3CreatedObject.id,
          type: s3CreatedObject["detail-type"],
          uploadedAt: s3CreatedObject.time,
          status: 'Initiated',
        })
      );
    }
    catch (err) {
      console.error("[load-balancer.mjs] Error processing message:", err);
      broker.nack(msg, false, false);
    }
  });
}
loudBalancerConsumer();