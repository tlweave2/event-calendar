import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";

function getS3Config() {
  const region = process.env.AWS_REGION ?? "auto";
  const endpoint =
    process.env.AWS_ENDPOINT_URL ??
    (process.env.R2_ACCOUNT_ID
      ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : undefined);

  const accessKeyId = process.env.AWS_ACCESS_KEY_ID ?? process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.AWS_SECRET_ACCESS_KEY ?? process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.AWS_BUCKET_NAME ?? process.env.R2_BUCKET_NAME;
  const publicBaseUrl = process.env.AWS_PUBLIC_URL ?? process.env.R2_PUBLIC_URL;

  return {
    region,
    endpoint,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicBaseUrl,
  };
}

export async function POST(req: NextRequest) {
  const { filename, contentType } = (await req.json()) as {
    filename?: string;
    contentType?: string;
  };

  if (!filename || !contentType) {
    return NextResponse.json(
      { error: "Missing filename or contentType" },
      { status: 400 }
    );
  }

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(contentType)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const cfg = getS3Config();

  if (!cfg.accessKeyId || !cfg.secretAccessKey || !cfg.bucket || !cfg.publicBaseUrl) {
    return NextResponse.json(
      { error: "Upload storage is not configured" },
      { status: 500 }
    );
  }

  const s3 = new S3Client({
    region: cfg.region,
    endpoint: cfg.endpoint,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });

  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `events/${Date.now()}-${crypto.randomUUID()}-${safeFilename}`;

  const command = new PutObjectCommand({
    Bucket: cfg.bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  const base = cfg.publicBaseUrl.replace(/\/$/, "");

  return NextResponse.json({
    uploadUrl,
    publicUrl: `${base}/${key}`,
  });
}
