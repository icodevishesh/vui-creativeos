import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; copyId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { copyId } = await params;

  try {
    const data = await req.json();
    if (data.publishDate) {
      data.publishDate = new Date(data.publishDate);
    }
    const copy = await prisma.calendarCopy.update({
      where: { id: copyId },
      data,
      include: { bucket: { select: { id: true, name: true } } },
    });
    return NextResponse.json(copy);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update copy' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; copyId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { copyId } = await params;

  try {
    await prisma.calendarCopy.delete({ where: { id: copyId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Copy not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete copy' }, { status: 500 });
  }
}
