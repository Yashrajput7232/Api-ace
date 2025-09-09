import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongo';
import { NewUser } from '@/types';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ message: 'Password must be at least 6 characters long.' }, { status: 400 });
        }

        const db = await getDb();
        const usersCollection = db.collection<NewUser>('users');

        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ message: 'User with this email already exists.' }, { status: 409 });
        }
        
        await db.collection('users').createIndex({ email: 1 }, { unique: true });

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await usersCollection.insertOne({
            email,
            password: hashedPassword,
        });

        return NextResponse.json({ message: 'User registered successfully.', userId: result.insertedId }, { status: 201 });

    } catch (error) {
        console.error('Registration failed:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}