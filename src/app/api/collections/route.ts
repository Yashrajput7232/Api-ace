import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongo';
import type { Collection } from '@/types';

export async function POST(request: Request) {
  try {
    const collectionData: Collection = await request.json();

    // Basic validation
    if (!collectionData || !collectionData.id || !collectionData.name || !Array.isArray(collectionData.requests)) {
      return NextResponse.json({ message: 'Invalid collection data provided.' }, { status: 400 });
    }

    const db = await getDb();
    const collectionsCollection = db.collection<Collection>('collections');

    // Use upsert to either insert a new collection or update an existing one based on the ID
    const result = await collectionsCollection.updateOne(
      { id: collectionData.id },
      { $set: collectionData },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      return NextResponse.json({ message: 'Collection created successfully.', accessCode: collectionData.id }, { status: 201 });
    } else {
      return NextResponse.json({ message: 'Collection updated successfully.', accessCode: collectionData.id }, { status: 200 });
    }

  } catch (error) {
    console.error('Failed to save collection:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
  }
}
