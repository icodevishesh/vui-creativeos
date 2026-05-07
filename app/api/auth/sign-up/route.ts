import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withApiLogging } from '@/lib/api-logging';


export const POST = withApiLogging(async function POST(req: Request) {
    try {
        const { name, email, password, userType } = await req.json();

        // Basic validation
        if (!name || !email || !password) {
            return NextResponse.json(
                { error: 'Name, email and password are required' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 400 }
            );
        }

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password,
                userType: userType || 'ADMIN_OWNER', // Default to ADMIN_OWNER if not provided
            },
        });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json(
            { message: 'User created successfully', user: userWithoutPassword },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Sign-up error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
});
