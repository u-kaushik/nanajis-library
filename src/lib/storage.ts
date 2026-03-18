import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export async function getSignedViewUrl(storagePath: string): Promise<string> {
  const provider = process.env.STORAGE_PROVIDER ?? 'r2';

  if (provider === 'r2') {
    const client = getR2Client();
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: storagePath,
    });
    return getSignedUrl(client, command, { expiresIn: 3600 });
  }

  // Supabase Storage fallback
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data } = await supabase.storage
    .from(process.env.STORAGE_BUCKET!)
    .createSignedUrl(storagePath, 3600);
  return data!.signedUrl;
}

export async function uploadFile(
  storagePath: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  const provider = process.env.STORAGE_PROVIDER ?? 'r2';

  if (provider === 'r2') {
    const client = getR2Client();
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: storagePath,
        Body: buffer,
        ContentType: contentType,
      })
    );
    return;
  }

  // Supabase Storage fallback
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  await supabase.storage
    .from(process.env.STORAGE_BUCKET!)
    .upload(storagePath, buffer, { contentType, upsert: true });
}
