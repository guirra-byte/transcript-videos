import {
  parentPort
} from 'node:worker_threads';
import ffmpeg from 'fluent-ffmpeg';

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
    const { videoDurationInSeconds, videoPath, outputDir, id } = data;
    if (videoDurationInSeconds <= 3600) {
      const chunkingConfig = {
        videoChunks: 5,
        duration: {
          sec: videoDurationInSeconds / chunkingConfig.videoChunks,
          min: videoDurationInSeconds / chunkingConfig.duration.sec,
        }
      }

      const timeSkip = await videoTimeSkip(chunkingConfig);
      function chunking(index) {
        ffmpeg(videoPath)
          .setStartTime(timeSkip[index].start)
          .duration(timeSkip[index].end)
          .output(`${outputDir}/${id}@chunk_${index}`)
          .on('end', () => {
            if (index <= timeSkip.length) {
              chunking(index++);
            }
          })
          .run();
      }

      chunking(0);
    }
  }
});