import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const region = process.env.AWS_REGION!;
export const bucket = process.env.S3_BUCKET!;
export const accessKeyId = process.env.AWS_ACCESS_KEY_ID!;
export const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY!;
export const filePrefix = `https://${bucket}.s3.${region}.amazonaws.com/`;

export const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export async function getSignedFileUrl(url: string) {
  const fileKey = url.replace(filePrefix, "");

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: fileKey,
  });

  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

  return signedUrl;
}
