import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import sql from '@/lib/db';
import { uploadFile } from '@/lib/storage';

export async function POST(request: Request) {
  const session = await verifySession(await cookies());
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const collection = (formData.get('collection') as string) || 'Uploads';
  const category = (formData.get('category') as string) || 'Uncategorized';

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const title = file.name.replace(/\.[^.]+$/, '');
  const storagePath = `${collection}/${category}/${file.name}`;

  await uploadFile(storagePath, buffer, file.type || 'application/pdf');

  const rows = await sql`
    INSERT INTO documents (title, collection, category, storage_path, file_size_bytes)
    VALUES (${title}, ${collection}, ${category}, ${storagePath}, ${file.size})
    RETURNING *
  `;

  return NextResponse.json(rows[0], { status: 201 });
}
