const fs = require('fs');
console.log('--- .env content ---');
console.log(fs.readFileSync('.env', 'utf8'));
console.log('--------------------');
require('dotenv').config();

console.log("cwd:", process.cwd());
console.log("__dirname:", __dirname);
console.log("MONGODB_URI:", process.env.MONGODB_URI ? "LOADED" : "MISSING");

// Debug: Check if environment variable loaded
console.log("MONGODB_URI:", process.env.MONGODB_URI ? "LOADED" : "MISSING");

const { MongoClient } = require('mongodb');

async function test() {
  // Debug: Verify connection string before use
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is undefined!");
  }

  const client = new MongoClient(process.env.MONGODB_URI, {
    connectTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000,
  });

  try {
    await client.connect();
    const db = client.db();
    console.log('✅ Connected to MongoDB! Database:', db.databaseName);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  } finally {
    await client.close();
  }
}

test();