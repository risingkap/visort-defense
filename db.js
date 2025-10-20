const { MongoClient } = require('mongodb');
require('dotenv').config();

// Resolve Mongo connection string from several common variable names (Railway, etc.)
function resolveMongoUri() {
  const candidates = [
    process.env.MONGODB_URI,
    process.env.MONGODB_URL,
    process.env.MONGO_URL,
    process.env.DATABASE_URL,
  ].filter(Boolean);
  return candidates[0] || null;
}

// Determine database name: prefer DB_NAME, fall back to name embedded in URI if present
function resolveDbName(mongoUri) {
  const explicitName = (process.env.DB_NAME || '').trim();
  if (explicitName) return explicitName;
  try {
    const parsed = new URL(mongoUri);
    const fromPath = (parsed.pathname || '').replace(/^\//, '').trim();
    return fromPath || undefined;
  } catch {
    return undefined;
  }
}

async function connectToDatabase() {
  const uri = resolveMongoUri();
  if (!uri) {
    console.error(
      'MongoDB connection string is missing. Set one of MONGODB_URI, MONGODB_URL, MONGO_URL, or DATABASE_URL.'
    );
    throw new Error('MongoDB connection string not provided');
  }

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 30000,
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
  });

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const dbName = resolveDbName(uri);
    const db = dbName ? client.db(dbName) : client.db();
    return db;
  } catch (error) {
    console.error('Connection error:', error.message);
    throw error;
  }
}

module.exports = { connectToDatabase };
