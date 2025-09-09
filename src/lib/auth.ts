import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { getDb } from './mongo';
import { User } from '@/types';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('Please define the JWT_SECRET environment variable inside .env');
}

export const verifyToken = (token: string) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (e) {
        return null;
    }
};

export const createToken = (payload: object) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const getUserIdFromRequest = (): string | null => {
    const token = cookies().get('auth_token')?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded || typeof decoded !== 'object' || !('userId' in decoded)) {
        return null;
    }
    return decoded.userId as string;
};

export const getUserFromRequest = async (): Promise<Omit<User, 'password'> | null> => {
    const userId = getUserIdFromRequest();
    if (!userId) return null;

    try {
        const db = await getDb();
        const user = await db.collection<Omit<User, 'id'>>('users').findOne({ _id: new ObjectId(userId) });
        if (!user) return null;

        const { _id, password, ...userWithoutPassword } = user;
        return { id: _id.toHexString(), ...userWithoutPassword };

    } catch (error) {
        console.error("Failed to fetch user:", error);
        return null;
    }
};