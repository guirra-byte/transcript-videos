import { Worker } from 'node:worker_threads';
import { APP_WORKERS, channel, WORKERS } from './main.mjs';
import { nanoid } from 'nanoid';

function roundRoubin(array, index = 0) {
  return function () {
    if (index >= array.length) index = 0;
    return array[index++];
  }
}

channel.consume('transcipt', async (msg) => {
  const videos = JSON.parse(msg.toString());
  const [notifyStatusTopic, notifyExchange] = ['video.transcription', 'notify_status'];

  channel.assertQueue('notify');
  channel.assertExchange(notifyExchange, 'topic');
  channel.bindQueue('notify', notifyExchange, `${notifyStatusTopic}.*`);

  if (APP_WORKERS.length < WORKERS) {
    for (const worker = APP_WORKERS.length; worker < WORKERS; worker++) {
      const videoWorker = new Worker('./transcription.worker.mjs');
      APP_WORKERS.push({
        _worker: videoWorker,
      });
    }
  }

  for (let index = 0; index < videos.length; index++) {
    const video = videos[index];
    const worker = roundRoubin(APP_WORKERS)();
    const transcriptTopic = `${notifyStatusTopic}.toTranscript`;

    channel.assertQueue(transcriptTopic);
    channel.publish(notifyExchange,
      transcriptTopic,
      Buffer.from(JSON.stringify(video))
    );

    worker.postMessage(
      JSON.stringify({
        url: video,
        _id: nanoid(),
        status: 'Initiated',
        webhook_endpoint: '/transcriptions',
        queue: {
          exchange: notifyExchange,
          topics: {
            success: `${notifyStatusTopic}.success`,
            fail: `${notifyStatusTopic}.failed`,
          }
        }
      }
      )
    );

    worker.on('message', (backcomming_msg) => {
      console.log(`Video ${backcomming_msg} foi transcrito.`);
    });
  }
});