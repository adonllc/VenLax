import { Client } from "minio";
import { randomUUID } from "crypto";

export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT ?? "localhost",
  port: Number(process.env.MINIO_PORT ?? 9000),
  useSSL: false,
  accessKey: process.env.MINIO_ROOT_USER ?? "venlaxiq_admin",
  secretKey: process.env.MINIO_ROOT_PASSWORD ?? "change_me_minio_password",
});

const BUCKET = process.env.MINIO_BUCKET ?? "venlaxiq-receipts";

export async function uploadReceipt(
  fileBuffer: Buffer,
  mimeType: string,
  userId: string
): Promise<string> {
  const ext = mimeType === "application/pdf" ? "pdf" : "jpg";
  const objectName = `receipts/${userId}/${randomUUID()}.${ext}`;

  await minioClient.putObject(BUCKET, objectName, fileBuffer, fileBuffer.length, {
    "Content-Type": mimeType,
  });

  return objectName;
}
