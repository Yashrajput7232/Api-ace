import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongo';
import { User } from '@/types';
import bcrypt from 'bcryptjs';
import { createToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
        }

        const db = await getDb();
        const usersCollection = db.collection<{_id: ObjectId, email: string, password: string}>('users');
        const user = await usersCollection.findOne({ email });

        if (!user) {
            return NextResponse.json({ message: 'Invalid credentials.' }, { status: 401 });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return NextResponse.json({ message: 'Invalid credentials.' }, { status: 401 });
        }

        const token = createToken({ userId: user._id.toHexString() });

        cookies().set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 1 week
        });
        
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json({ message: 'Login successful.', user: { ...userWithoutPassword, id: user._id.toHexString() } }, { status: 200 });

    } catch (error) {
        console.error('Login failed:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}