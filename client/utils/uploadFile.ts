"use server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { getErrorMessage } from "./utils";
import { s3 } from "./S3helper";

type UploadProps = {
  file: File;
  folder?: string;
};

export const uploadFile = async ({ file, folder }: UploadProps) => {
  try {
    const fileName = file.name;
    const fileExtension = fileName.slice(fileName.lastIndexOf(".") + 1);
    const uniqueId = uuidv4();
    const key = folder
      ? `${folder}/${uniqueId}.${fileExtension}`
      : `${uniqueId}.${fileExtension}`;

    const bucket = process.env.S3_BUCKET!;
    const region = process.env.AWS_REGION;

    const arrayBuffer = await file.arrayBuffer();
    const body =
      typeof Buffer !== "undefined"
        ? Buffer.from(arrayBuffer)
        : new Uint8Array(arrayBuffer);
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: file.type,
      })
    );
    const fileUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    return { data: { fileUrl: fileUrl }, errorMessage: null };
  } catch (error) {
    return { data: null, errorMessage: getErrorMessage(error) };
  }
};
