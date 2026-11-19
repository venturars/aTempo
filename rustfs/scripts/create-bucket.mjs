import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";

const endpoint = process.env.RUSTFS_ENDPOINT ?? "http://127.0.0.1:9000";
const accessKeyId = process.env.RUSTFS_ACCESS_KEY ?? "atempo";
const secretAccessKey = process.env.RUSTFS_SECRET_KEY ?? "atempoatempo";
const bucket = process.env.RUSTFS_BUCKET ?? "justifications";

const s3 = new S3Client({
  endpoint,
  region: "us-east-1",
  forcePathStyle: true,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function bucketExists() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    return true;
  } catch {
    return false;
  }
}

if (await bucketExists()) {
  console.log(`El bucket "${bucket}" ya existe en ${endpoint}`);
  process.exit(0);
}

await s3.send(new CreateBucketCommand({ Bucket: bucket }));
console.log(`Bucket "${bucket}" creado en ${endpoint}`);
