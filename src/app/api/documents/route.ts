import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import sql from '@/lib/db';

export async function GET(request: Request) {
  const session = await verifySession(await cookies());
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') ?? '';
  const collection = searchParams.get('collection') ?? '';
  const category = searchParams.get('category') ?? '';

  if (q) {
    const rows = await sql`
      SELECT * FROM documents
      WHERE title ILIKE ${'%' + q + '%'}
         OR display_title ILIKE ${'%' + q + '%'}
      ORDER BY COALESCE(display_title, title) ASC LIMIT 100
    `;
    return NextResponse.json(rows);
  }

  if (category && collection) {
    const rows = await sql`
      SELECT * FROM documents
      WHERE collection = ${collection} AND category = ${category}
      ORDER BY title ASC
    `;
    return NextResponse.json(rows);
  }

  if (collection) {
    const rows = await sql`
      SELECT * FROM documents
      WHERE collection = ${collection}
      ORDER BY category ASC, title ASC
    `;
    return NextResponse.json(rows);
  }

  // Return category summary grouped by collection + category
  const rows = await sql`
    SELECT collection, category, MIN(display_category) AS display_category, COUNT(*)::int AS count
    FROM documents
    GROUP BY collection, category
    ORDER BY collection ASC, count DESC
  `;
  return NextResponse.json(rows);
}
