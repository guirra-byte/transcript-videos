import AWS from 'aws-sdk';
import { filePath } from '../config/path.config.mjs';
const s3 = new AWS.S3({ endpoint: '' });
import fs from 'node:fs';

class S3Resources {
  async list(bucket) {
    const bucketUploads = s3.listObjectsV2({ Bucket: bucket });
    const { body } = bucketUploads.httpRequest;
    return body;
  }

  async dowload(bucket, resource_id) {
    s3.getObject(
      { Bucket: bucket, Key: resource_id },
      (err, output) => {
        if (err) throw err;

        const downloadPath = filePath('transcriptions', resource_id);
        const writeStream = fs.createWriteStream(downloadPath);
        output.Body.pipe(writeStream);
      });
  }

  async upload(data) {
    const fileStream = fs.createReadStream(keyName);
    s3.upload({
      Bucket: data.bucket,
      Key: data._id,
      Body: fileStream
    }, {}, (err) => {
      if (err) throw err;
    });
  }
}

export { S3Resources };