import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;

if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}
if (!dbName) {
  throw new Error('Please define the MONGODB_DB_NAME environment variable inside .env');
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getDb(): Promise<Db> {
  if (cachedDb) {
    return cachedDb;
  }

  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    let globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>
    }

    if (!globalWithMongo._mongoClientPromise) {
      cachedClient = new MongoClient(uri!);
      globalWithMongo._mongoClientPromise = cachedClient.connect();
    }
    cachedClient = await globalWithMongo._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable.
    cachedClient = new MongoClient(uri!);
    await cachedClient.connect();
  }
  
  cachedDb = cachedClient.db(dbName);

  // Create indexes if they don't exist
  try {
    await cachedDb.collection('users').createIndex({ email: 1 }, { unique: true });
    await cachedDb.collection('collections').createIndex({ userId: 1 });
  } catch (error) {
    console.warn('Could not create indexes, they may already exist.', error);
  }

  return cachedDb;
}
