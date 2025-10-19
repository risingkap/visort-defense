const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('MONGODB_URI is not defined in environment variables');
}

async function connectToDatabase() {
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000, // Increased from 5000 to 30000 (30 seconds)
    connectTimeoutMS: 30000, // 30 seconds connection timeout
    socketTimeoutMS: 30000, // 30 seconds socket timeout
    maxPoolSize: 10, // Maintain up to 10 socket connections
    minPoolSize: 2, // Maintain a minimum of 2 socket connections
    maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  });

  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas");
    return client.db(process.env.DB_NAME); // Explicitly use DB name from .env
  } catch (error) {
    console.error("Connection error:", error.message);
    throw error;
  }
}

module.exports = { connectToDatabase };
