import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import sql from '@/lib/db';
import { createSession, sessionCookieOptions } from '@/lib/auth';

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  const rows = await sql`SELECT * FROM users WHERE email = ${email.toLowerCase()} LIMIT 1`;
  const user = rows[0];

  if (!user || !await bcrypt.compare(password, user.password_hash)) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const token = await createSession({ userId: user.id, email: user.email, name: user.name });
  const jar = await cookies();
  jar.set({ ...sessionCookieOptions(), value: token });

  return NextResponse.json({ ok: true, name: user.name });
}
