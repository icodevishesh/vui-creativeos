import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

function generatePassword(): string {
  const upper = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '@#$!';
  const all = upper + lower + digits;
  let pwd = '';
  for (let i = 0; i < 8; i++) pwd += all[Math.floor(Math.random() * all.length)];
  pwd += special[Math.floor(Math.random() * special.length)];
  pwd += digits[Math.floor(Math.random() * digits.length)];
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
}

// POST /api/clients/[id]/credentials — generate or reset portal credentials
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const client = await prisma.clientProfile.findUnique({ where: { id } });
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    const plainPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const existingUser = await prisma.user.findUnique({ where: { email: client.email } });

    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { password: hashedPassword, userType: 'CLIENT' },
      });
    } else {
      await prisma.user.create({
        data: {
          email: client.email,
          password: hashedPassword,
          name: client.contactPerson,
          userType: 'CLIENT',
        },
      });
    }

    return NextResponse.json({ email: client.email, generatedPassword: plainPassword });
  } catch (err) {
    console.error('[POST /api/clients/[id]/credentials]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
