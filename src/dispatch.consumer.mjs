import { Worker } from 'node:worker_threads';
import { CHUNK_WORKERS, TRANSCRIPT_WORKERS, channel, WORKERS } from './main.mjs';
import { nanoid } from 'nanoid';

function roundRoubin(array, index = 0) {
  return function () {
    if (index >= array.length) index = 0;
    return array[index++];
  }
}

function workerFactory(copies, pathname, dest) {
  for (let instance = 0; instance < copies; instance++) {
    const worker = new Worker(pathname);
    dest.push(worker);
  }
}

// Large videos chunking service;
channel.consume('large-video', async (msg) => {
  const largeVideos = JSON.parse(msg);
  if (CHUNK_WORKERS.length < WORKERS) {
    workerFactory(
      WORKERS,
      './video-chunking.worker.mjs',
      CHUNK_WORKERS
    );
  }

  for (const video of largeVideos) {
    const worker = roundRoubin(CHUNK_WORKERS)();
    const videosDir = `${chunkingOutPath}/${video}`;
    worker.postMessage(JSON.stringify(videosDir));
  }
});

//Transcript videos service;
channel.consume('transcript', async (msg) => {
  const videos = JSON.parse(msg.toString());
  const [notifyStatusTopic, notifyExchange] = ['video.transcription', 'notify_status'];

  channel.assertQueue('notify');
  channel.assertExchange(notifyExchange, 'topic');
  channel.bindQueue('notify', notifyExchange, `${notifyStatusTopic}.*`);

  if (TRANSCRIPT_WORKERS.length < WORKERS) {
    workerFactory(
      WORKERS,
      './transcription.worker.mjs',
      TRANSCRIPT_WORKERS
    );
  }

  for (let index = 0; index < videos.length; index++) {
    const video = videos[index];
    const worker = roundRoubin(TRANSCRIPT_WORKERS)();
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