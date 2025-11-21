import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB(): Promise<typeof mongoose> {
  let MONGO_URI = process.env.MONGO_URI || '';

  if (!MONGO_URI) {
    throw new Error('Please define the MONGO_URI environment variable inside .env');
  }

  // Ensure the database name is 'proveloce-meet'
  const DB_NAME = 'proveloce-meet';
  
  // Parse and update the MongoDB URI to include the database name
  // Handle both formats: mongodb:// and mongodb+srv://
  // Remove trailing slash and any existing database name
  MONGO_URI = MONGO_URI.trim().replace(/\/$/, ''); // Remove trailing slash
  
  // Check if database name is already in the URI
  const dbNamePattern = /\/([^/?]+)(\?|$)/;
  if (dbNamePattern.test(MONGO_URI)) {
    // Replace existing database name
    MONGO_URI = MONGO_URI.replace(dbNamePattern, `/${DB_NAME}$2`);
  } else {
    // Append database name before query parameters
    const queryIndex = MONGO_URI.indexOf('?');
    if (queryIndex !== -1) {
      MONGO_URI = MONGO_URI.slice(0, queryIndex) + `/${DB_NAME}` + MONGO_URI.slice(queryIndex);
    } else {
      MONGO_URI = MONGO_URI + `/${DB_NAME}`;
    }
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: DB_NAME, // Explicitly set database name
    };

    cached.promise = mongoose.connect(MONGO_URI, opts).then((mongoose) => {
      console.log(`✅ MongoDB connected successfully to database: ${DB_NAME}`);
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
