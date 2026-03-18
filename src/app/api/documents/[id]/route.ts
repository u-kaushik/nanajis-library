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

  const signedUrl = await getSignedViewUrl(doc.storage_path);
  return NextResponse.redirect(signedUrl);
}
