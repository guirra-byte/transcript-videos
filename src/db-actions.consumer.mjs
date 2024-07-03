import { channel } from "./main.mjs";
import { prisma } from './prisma/index';
import { filePath } from "./config/path.config.mjs";
import { S3Resources } from './aws/s3.mjs';
import { nanoid } from "nanoid";

export const chunksModel = async (data) => {
  prisma.chunks.create({
    data: {
      id: data.chunk.id,
      video_id: data.video.id,
      s3_identifier: data.chunk.id,
      s3_bucket: 'video.chunks'
    }
  });
}

const statusModel = async (data) => {
  if (data.status === 'Initiated') {
    let videoNanoid = nanoid();
    prisma.video.create({
      id: data.videoId,
      s3_identifier: videoNanoid,
      s3_bucket: 'video.input'
    });

    prisma.transcription.create({
      data: {
        id: data._id,
        readableURL: data.video,
        description: data.description,
        status: data.status,
        endTime: data.endTime,
        startTime: data.startTime,
        videoId: videoNanoid,
        s3Identifier: data._id,
        s3DestineBucket: 'video.transcription.output'
      }
    });
  } else {
    prisma.transcription.update({
      where: { id: data._id },
      data: {
        status: data.status,
      }
    });
  }
}

const s3Resources = new S3Resources();
const NotifyConsumer = () => {
  channel.consume('video_chunks', async (msg) => {
    const parseData = JSON.parse(msg.content.toString());
    await s3Resources.upload({
      video_id: parseData.video.id,
      _id: parseData.chunk.id,
      file_path: parseData.chunk.path
    });

    await chunksModel(parseData);
  });

  channel.consume('notify_status', async (msg) => {
    const parseData = JSON.parse(msg.content().toString());
    const [, , status] = parseData.topic.split('.');

    if (status) {
      const availableStatus = status === 'Initiated' ||
        status === 'Failed' ||
        status === 'Success';

      if (availableStatus) {
        await statusModel(parseData);

        if (availableStatus === 'Success') {
          await s3Resources.upload({
            _id: parseData._id,
            file_path: filePath('trascription', parseData._id)
          });
        }
      }
    }
  });
}

NotifyConsumer();