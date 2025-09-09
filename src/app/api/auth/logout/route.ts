import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    try {
        cookies().set('auth_token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'lax',
            path: '/',
            expires: new Date(0),
        });

        return NextResponse.json({ message: 'Logout successful.' }, { status: 200 });
    } catch (error) {
        console.error('Logout failed:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
