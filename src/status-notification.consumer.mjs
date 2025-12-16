import { channel } from "./main.mjs";
import { prisma } from './prisma/index';
import { filePath } from "./config/path.config.mjs";
import { S3Provider } from './aws/s3.mjs';

const statusModel = async (data) => {
  if (data.status === 'Initiated') {
    prisma.transcription.create({
      data: {
        id: data._id,
        url: data.video,
        status: data.status,
        endTime: data.endTime,
        startTime: data.startTime,
        s3Identifier: data._id,
        s3DestineBucket: 'transcription.output'
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

const s3Provider = new S3Provider();
const NotifyConsumer = () => {
  channel.consume('notify_status', async (msg) => {
    const parseData = JSON.parse(msg.toString());
    const [, , status] = parseData.topic.split('.');

    if (status) {
      const availableStatus = status === 'Initiated' ||
        status === 'Failed' ||
        status === 'Success';

      if (availableStatus) {
        await statusModel(parseData);

        if (availableStatus === 'Success') {
          await s3Provider.upload({
            _id: parseData._id,
            file_path: filePath('trascription', parseData._id)
          });
        }
      }
    }
  });
}

NotifyConsumer();