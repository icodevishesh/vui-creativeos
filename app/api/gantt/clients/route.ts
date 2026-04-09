import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/gantt/clients
// Returns lightweight client list for the project creation form
export async function GET() {
  try {
    const clients = await prisma.clientProfile.findMany({
      select: {
        id: true,
        companyName: true,
        industry: true,
        status: true,
      },
      orderBy: { companyName: 'asc' },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error('[GANTT_CLIENTS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
