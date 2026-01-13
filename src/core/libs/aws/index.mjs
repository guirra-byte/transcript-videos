import { config } from "dotenv";
import { GetObjectCommand, PutObjectCommand, S3Client, UploadPartCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Upload } from "@aws-sdk/lib-storage";

config();
function s3() {
  let s3;
  return () => {
    if (!s3) s3 = new S3Client({ region: process.env.AWS_DEFAULT_REGION, endpoint: "https://transcript-videos-bucket.s3.us-east-1.amazonaws.com/" });
    return s3;
  };
}

class S3Provider {
  async download(bucket, s3Key, callback) {
    const createInstance = s3();
    const s3Client = createInstance();
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: s3Key
    });

    return new Promise((resolve, reject) => {
      s3Client.send(
        getObjectCommand,
        async (err, output) => {
          if (err) reject(err);
          try {
            await callback(output);
            resolve(true);
          } catch (callbackErr) {
            reject(callbackErr);
          }
        });
    });
  }

  async getSignedUrl(bucket, s3Key) {
    const createInstance = s3();
    const s3Client = createInstance();
    const putObjectCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: s3Key,
    });

    const signedUrl = getSignedUrl(s3Client, putObjectCommand);
    return signedUrl;
  }

  async streamUpload(key, rawData) {
    const createInstance = s3();
    const s3Client = createInstance();
    const parallelUploadS3 = new Upload({
      client: s3Client,
      params: { Key: key, Body: rawData },
    });

    await parallelUploadS3.done()
      .then((output) => callback(output));
  }
}

export { S3Provider };