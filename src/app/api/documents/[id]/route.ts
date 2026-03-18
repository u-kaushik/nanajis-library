import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import sql from '@/lib/db';
import { getSignedViewUrl } from '@/lib/storage';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifySession(await cookies());
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const rows = await sql`SELECT * FROM documents WHERE id = ${id} LIMIT 1`;
  const doc = rows[0];

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Fetch from R2 server-side and stream back — avoids browser CORS issues
  const signedUrl = await getSignedViewUrl(doc.storage_path);
  const r2Res = await fetch(signedUrl);

  if (!r2Res.ok) {
    return NextResponse.json({ error: 'File unavailable' }, { status: 502 });
  }

  return new NextResponse(r2Res.body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${doc.title}.pdf"`,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
