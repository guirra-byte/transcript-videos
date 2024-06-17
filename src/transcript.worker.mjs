import { parentPort } from 'node:worker_threads';
import Replicate from 'replicate';
import dotenv from 'dotenv';
import fs from 'node:fs';
import { channel } from './main.mjs';

dotenv.config();
const replicate = new Replicate();
parentPort.on('message', async (incomming_msg) => {
  const data = JSON.parse(incomming_msg);

  if (!incomming_msg) {
    console.log(`Iniciando transcrição do ${data._id}`);

    const MODEL_VERSION = '4f41e90243af171da918f04da3e526b2c247065583ea9b757f2071f573965408'
    const TRANSCRIPTION_MODEL = !process.env.TRANSCRIPTION_MODEL ?
      `turian/insanely-fast-whisper-with-video:${MODEL_VERSION}` :
      process.env.TRANSCRIPTION_MODEL

    Object.assign(data, {
      startTime: new Date().toISOString()
    });

    const { queue } = data;
    await replicate.run(
      TRANSCRIPTION_MODEL,
      {
        webhook: data.webhook_endpoint,
        webhook_events_filter: ['completed', 'start'],
        input: {
          url: data.url
        }
      }).then((reply) => {
        const outDestine = `./output/transcription-${data._id}.txt`;
        const storeReply = fs.createWriteStream(outDestine);

        for (const chunk of reply.chunks) {
          storeReply.write(chunk.text);
        }

        const successMsg = JSON.stringify(
          {
            ...data,
            endTime: new Date().toISOString(),
            topic: queue.topic.success
          });

        parentPort.postMessage(successMsg);
        channel.publish(
          queue.exchange,
          queue.topic.success,
          Buffer.from(successMsg)
        );
      }).catch(() => {
        const failMsg = JSON.stringify(
          {
            ...data,
            endTime: new Date().toISOString(),
            topic: queue.topic.fail
          });

        channel.publish(
          queue.exchange,
          queue.topic.fail,
          Buffer.from(failMsg)
        );
      });
  }
});