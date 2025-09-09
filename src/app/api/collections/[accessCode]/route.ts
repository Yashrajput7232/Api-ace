import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongo';
import { Collection } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: { accessCode: string } }
) {
  const { accessCode } = params;

  if (!accessCode) {
    return NextResponse.json({ message: 'Access code is required' }, { status: 400 });
  }

  try {
    const db = await getDb();
    const collection = await db.collection<Collection>('collections').findOne({ id: accessCode });

    if (!collection) {
      return NextResponse.json({ message: 'Collection not found' }, { status: 404 });
    }

    // Omit sensitive data if any in the future
    const { _id, ...collectionData } = collection as any;

    return NextResponse.json(collectionData, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch collection:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
