import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

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
  const { filename, contentType, size, tenantSlug } = (await req.json()) as {
    filename?: string;
    contentType?: string;
    size?: number;
    tenantSlug?: string;
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

  if (typeof size !== "number" || !Number.isInteger(size) || size <= 0) {
    return NextResponse.json({ error: "Missing file size" }, { status: 400 });
  }
  if (size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File is too large (max 10 MB)" }, { status: 413 });
  }

  // Uploads must belong to a tenant: the signed-in admin's, or the public
  // calendar the submission form is embedded on.
  const session = await auth();
  const tenant = session?.user?.tenantId
    ? { id: session.user.tenantId }
    : tenantSlug
      ? await prisma.tenant.findUnique({
          where: { slug: tenantSlug },
          select: { id: true },
        })
      : null;

  if (!tenant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  const key = `events/${tenant.id}/${Date.now()}-${crypto.randomUUID()}-${safeFilename}`;

  const command = new PutObjectCommand({
    Bucket: cfg.bucket,
    Key: key,
    ContentType: contentType,
    // Signed into the URL, so the PUT must be exactly this many bytes.
    ContentLength: size,
  });

  const uploadUrl = await getSignedUrl(s3, command, {
    expiresIn: 300,
    signableHeaders: new Set(["content-type", "content-length"]),
  });
  const base = cfg.publicBaseUrl.replace(/\/$/, "");

  return NextResponse.json({
    uploadUrl,
    publicUrl: `${base}/${key}`,
  });
}
