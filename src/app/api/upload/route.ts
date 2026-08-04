import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession, can } from "@/lib/authz";
import { getClientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

/** Presigned PUTs are write access to the bucket, so cap what they can store. */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const UPLOAD_URL_TTL_SECONDS = 300;
const ADMIN_UPLOADS_PER_HOUR = 60;
/** Anonymous submitters get a much smaller allowance. */
const PUBLIC_UPLOADS_PER_HOUR = 10;

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

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

  return { region, endpoint, accessKeyId, secretAccessKey, bucket, publicBaseUrl };
}

/**
 * Presigned upload URLs.
 *
 * Two callers are legitimate: a signed-in team member working in the
 * dashboard, and an anonymous visitor attaching a flyer to a public event
 * submission. Anything else previously got a free write handle to our bucket,
 * because this route had no authorization at all.
 */
export async function POST(req: NextRequest) {
  let payload: {
    filename?: string;
    contentType?: string;
    size?: number;
    tenantSlug?: string;
  };
  try {
    payload = (await req.json()) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { filename, contentType, size, tenantSlug } = payload;

  if (!filename || !contentType) {
    return NextResponse.json(
      { error: "Missing filename or contentType" },
      { status: 400 }
    );
  }

  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  if (typeof size === "number" && size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `Images must be smaller than ${MAX_UPLOAD_BYTES / 1024 / 1024}MB.` },
      { status: 413 }
    );
  }

  const scope = await resolveScope(req, tenantSlug);
  if (!scope) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await rateLimit(scope.rateLimitKey, scope.perHour, 60 * 60);
  if (!limit.allowed) return tooManyRequests(limit);

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

  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
  // Namespace by tenant so objects are attributable and can be cleaned up
  // along with the tenant that owns them.
  const key = `tenants/${scope.tenantId}/${scope.prefix}/${Date.now()}-${crypto.randomUUID()}-${safeFilename}`;

  const command = new PutObjectCommand({
    Bucket: cfg.bucket,
    Key: key,
    ContentType: contentType,
    // Signing the length into the URL stops the presigned PUT from being
    // reused to store something far larger than what was declared.
    ...(typeof size === "number" ? { ContentLength: size } : {}),
  });

  const uploadUrl = await getSignedUrl(s3, command, {
    expiresIn: UPLOAD_URL_TTL_SECONDS,
  });
  const base = cfg.publicBaseUrl.replace(/\/$/, "");

  return NextResponse.json({ uploadUrl, publicUrl: `${base}/${key}` });
}

type UploadScope = {
  tenantId: string;
  prefix: string;
  rateLimitKey: string;
  perHour: number;
};

async function resolveScope(
  req: NextRequest,
  tenantSlug: string | undefined
): Promise<UploadScope | null> {
  const ctx = await verifySession();

  if (ctx && can(ctx.role, "events:write")) {
    return {
      tenantId: ctx.tenantId,
      prefix: "events",
      rateLimitKey: `upload:admin:${ctx.userId}`,
      perHour: ADMIN_UPLOADS_PER_HOUR,
    };
  }

  // Anonymous flyer attached to a public submission. The tenant must exist,
  // and the upload is filed under that tenant's submissions.
  if (tenantSlug) {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true },
    });
    if (!tenant) return null;

    return {
      tenantId: tenant.id,
      prefix: "submissions",
      rateLimitKey: `upload:public:${tenant.id}:${getClientIp(req.headers)}`,
      perHour: PUBLIC_UPLOADS_PER_HOUR,
    };
  }

  return null;
}
