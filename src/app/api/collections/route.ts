import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongo';
import { Collection, User } from '@/types';
import { getUserIdFromRequest, getUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';


export async function GET() {
    const userId = getUserIdFromRequest();
    if (!userId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const db = await getDb();
        const collections = await db.collection<Collection>('collections').find({ userId: new ObjectId(userId) }).toArray();
        
        // Convert ObjectId to string for userId
        const collectionsWithStringId = collections.map(c => ({
            ...c,
            userId: c.userId.toString()
        }));

        return NextResponse.json(collectionsWithStringId, { status: 200 });
    } catch (error) {
        console.error('Failed to fetch collections:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}


export async function POST(request: Request) {
  const userId = getUserIdFromRequest();
  if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    let collectionData: Partial<Collection> = await request.json();

    if (!collectionData.id) {
        collectionData.id = new ObjectId().toHexString();
    }
    
    const finalCollection: Omit<Collection, '_id'> = {
        id: collectionData.id,
        name: collectionData.name || 'New Collection',
        requests: collectionData.requests || [],
        userId: new ObjectId(userId)
    };
    
    const db = await getDb();
    const collectionsCollection = db.collection('collections');

    const result = await collectionsCollection.updateOne(
      { id: finalCollection.id, userId: finalCollection.userId },
      { $set: finalCollection },
      { upsert: true }
    );

    const message = result.upsertedCount > 0 ? 'Collection created successfully.' : 'Collection updated successfully.';
    return NextResponse.json({ message, collectionId: finalCollection.id }, { status: result.upsertedCount > 0 ? 201 : 200 });

  } catch (error) {
    console.error('Failed to save collection:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
