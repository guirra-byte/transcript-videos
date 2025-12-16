import { parentPort } from 'node:worker_threads';
import dotenv from 'dotenv';
import fs from 'node:fs';
import { S3Provider } from "./core/libs/aws/index.mjs";
import { rootDir } from './config/path.config.mjs';
import { pipeline } from 'node:stream/promises';
import OpenAI from 'openai';

dotenv.config();
parentPort.on('message', async (incomming_msg) => {
  const data = JSON.parse(incomming_msg);
  await new Promise(async (resolve, reject) => {
    try {
      const s3Provider = new S3Provider();
      const downloadDir = rootDir().concat(`/uploads`);
      if (!fs.existsSync(downloadDir))
        fs.mkdir(downloadDir, async (err, _) => {
          if (err) {
            console.error(err);
            throw err;
          }
        });

      const filepath = downloadDir.concat(`/${data.s3Key}`);
      s3Provider.download(data.bucket, data.s3Key, async (output) => {
        const writeStream = fs.createWriteStream(filepath);
        await pipeline(output.Body, writeStream);
      }).then(async () => {
        try {
          const openai = new OpenAI({ apiKey: process.env.OPEN_AI_SECRET_KEY });
          const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(filepath),
            model: "whisper-1",
            response_format: "verbose_json",
            timestamp_granularities: ["segment"],
          });

          const outputDir = rootDir().concat(`/transcriptions`);
          if (!fs.existsSync(outputDir))
            fs.mkdirSync(outputDir);

          const outputFilepath = outputDir.concat(`/${transcription._request_id}.json`);
          if (fs.existsSync(outputFilepath)) fs.rmSync(outputFilepath);

          fs.writeFile(
            outputFilepath,
            JSON.stringify(transcription.segments),
            (err) => {
              if (err) throw err;
              
              resolve(true);
              parentPort.postMessage(JSON.stringify({
                success: true,
                transcriptionId: transcription._request_id,
                parentLink: data.s3ObjectId
              }));
            });
        }
        catch (err) {
          reject(err);
        }
      });
    }
    catch (err) {
      reject(err);
    }
  }).catch((err) => {
    console.error("[transcript.worker.mjs] Error:", err);
    parentPort.postMessage(
      JSON.stringify({
        success: false,
        error: err.message || String(err)
      }));
  });
});