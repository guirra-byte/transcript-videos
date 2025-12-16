import { S3Provider } from "../core/libs/aws/index.mjs";
import { config } from 'dotenv';

config();
function PresignedUrlsIssuerService() {
  let s3Provider = new S3Provider();
  return {
    execute: async (filename) => {
      try {
        const bucket = process.env.AWS_BUCKET_NAME;
        if (!bucket) throw new Error("Destine Bucket not found!");

        const signedUrl = await s3Provider.getSignedUrl(bucket, filename);
        return signedUrl;
      }
      catch (err) {
        console.log(err);
        throw err;
      }
    }
  }
}

export const presignedUrlIssuerService = PresignedUrlsIssuerService();
