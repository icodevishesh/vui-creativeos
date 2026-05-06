import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/clients/[id]/credentials
// Returns the stored plain-text password for the client's portal user account.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const client = await prisma.clientProfile.findUnique({ where: { id } });
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    const user = await prisma.user.findUnique({ where: { email: client.email } });
    if (!user || user.userType !== 'CLIENT') {
      return NextResponse.json({ error: 'No portal account found for this client' }, { status: 404 });
    }

    return NextResponse.json({ email: client.email, generatedPassword: user.password });
  } catch (err) {
    console.error('[POST /api/clients/[id]/credentials]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
