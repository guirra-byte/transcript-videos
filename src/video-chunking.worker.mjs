import {
  parentPort
} from 'node:worker_threads';
import ffmpeg from 'fluent-ffmpeg';
import { nanoid } from 'nanoid';
import fs from 'node:fs';
import channel from './main.mjs';

parentPort.on('messageerror', (error) => {
  throw error;
});

async function videoTimeSkip(chunkingConfig) {
  let timeSkipPreset = [];
  for (let chunk = 1; chunk <= chunkingConfig.videoChunks; chunk++) {
    let start = 0;
    let end = chunkingConfig.duration.min;
    if (chunk !== 1) {
      end = chunkingConfig.duration.min * chunk;
      start = end - chunkingConfig.duration.min;
    }

    timeSkipPreset.push({
      end,
      start
    });
  }

  return timeSkipPreset;
}

parentPort.on('message', async (upcomming_msg) => {
  const data = JSON.parse(upcomming_msg);
  if (data) {
    const { videoDurationInSeconds, videoPath, outputDir } = data;
    if (videoDurationInSeconds <= 3600) {
      const chunkingConfig = {
        videoChunks: 5,
        duration: {
          sec: videoDurationInSeconds / chunkingConfig.videoChunks,
          min: videoDurationInSeconds / chunkingConfig.duration.sec,
        }
      }

      const videoId = nanoid();
      const chunksPath = `${outputDir}/${videoId}`
      if (!fs.existsSync(chunksPath)) {
        fs.mkdir(chunksPath, (err) => {
          if (err) throw err;
        });
      }

      const timeSkip = await videoTimeSkip(chunkingConfig);
      const pipelineResponse = {};
      function chunking(index) {
        const chunkId = nanoid();
        const output = `${chunksPath}/${chunkId}@chunk_${index}`;

        ffmpeg(videoPath)
          .setStartTime(timeSkip[index].start)
          .duration(timeSkip[index].end)
          .output(output)
          .on('end', () => {
            if (index <= timeSkip.length) {
              const pipelineData = {
                video: { id: videoId, },
                chunk: {
                  id: chunkId,
                  path: output
                }
              };

              if (pipelineResponse[videoId]) {
                pipelineResponse[videoId].push(pipelineData);
              } else {
                pipelineResponse[videoId] = [pipelineData];
              }

              chunking(index++);
            }
          })
          .run();
      }

      chunking(0);

      channel.assertQueue('video_chunks');
      channel.publish(
        'video_chunks',
        Buffer.from(JSON.stringify(pipelineResponse))
      );
    }
  }
});