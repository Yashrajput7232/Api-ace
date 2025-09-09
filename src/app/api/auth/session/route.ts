import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

export async function GET() {
    try {
        const user = await getUserFromRequest();
        
        if (!user) {
            return NextResponse.json({ user: null }, { status: 200 });
        }
        
        return NextResponse.json({ user }, { status: 200 });

    } catch (error) {
        console.error("Session check failed:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
