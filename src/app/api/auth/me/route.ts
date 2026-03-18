import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';

export async function GET() {
  const session = await verifySession(await cookies());
  if (!session) return NextResponse.json(null);
  return NextResponse.json({ userId: session.userId, email: session.email, name: session.name });
}
