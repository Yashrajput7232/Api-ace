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
        
        // Convert ObjectId to string for userId and _id
        const collectionsWithStringId = collections.map(c => ({
            ...c,
            id: c._id!.toString(),
            userId: c.userId.toString(),
            _id: undefined // remove _id
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
    
    // If an ID is provided, it's an update. Otherwise, it's a new collection.
    const isUpdate = !!collectionData.id;

    if (isUpdate) {
        const { id, ...dataToUpdate } = collectionData;
        const finalCollection: Omit<Collection, '_id' | 'id'> = {
            name: dataToUpdate.name || 'New Collection',
            requests: dataToUpdate.requests || [],
            userId: new ObjectId(userId)
        };

        const db = await getDb();
        await db.collection('collections').updateOne(
          { _id: new ObjectId(id), userId: new ObjectId(userId) },
          { $set: finalCollection }
        );
        return NextResponse.json({ message: 'Collection updated successfully.', collectionId: id }, { status: 200 });

    } else {
        // Create new collection
        const newCollection: Omit<Collection, '_id' | 'id'> = {
            name: collectionData.name || 'New Collection',
            requests: collectionData.requests || [],
            userId: new ObjectId(userId)
        };
        const db = await getDb();
        const result = await db.collection('collections').insertOne(newCollection);
        
        return NextResponse.json({ message: 'Collection created successfully.', collectionId: result.insertedId.toHexString() }, { status: 201 });
    }

  } catch (error) {
    console.error('Failed to save collection:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

    