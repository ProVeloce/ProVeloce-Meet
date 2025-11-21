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
  MONGO_URI = MONGO_URI.trim();
  
  // Find the position where we need to insert the database name
  // MongoDB URI format: mongodb+srv://[username:password@]hostname[:port][/database][?options]
  // We need to find the position after the hostname (after the last @ or after ://)
  
  // Find the position after the hostname
  // For mongodb+srv://, the hostname comes after the last @
  // For mongodb://, it could be after @ or after ://
  const atIndex = MONGO_URI.lastIndexOf('@');
  const protocolIndex = MONGO_URI.indexOf('://');
  
  // Determine where the hostname ends
  let hostEndIndex: number;
  if (atIndex !== -1) {
    // Has credentials, hostname starts after @
    hostEndIndex = atIndex + 1;
  } else if (protocolIndex !== -1) {
    // No credentials, hostname starts after ://
    hostEndIndex = protocolIndex + 3;
  } else {
    // Invalid URI format, but try to proceed
    hostEndIndex = 0;
  }
  
  // Find the first / or ? after the hostname
  const slashIndex = MONGO_URI.indexOf('/', hostEndIndex);
  const queryIndex = MONGO_URI.indexOf('?', hostEndIndex);
  
  // Check if there's already a database name in the path
  let hasDatabaseName = false;
  if (slashIndex !== -1 && (queryIndex === -1 || slashIndex < queryIndex)) {
    // There's a / after hostname, check if it's followed by a database name
    const pathEnd = queryIndex !== -1 ? queryIndex : MONGO_URI.length;
    const pathAfterSlash = MONGO_URI.slice(slashIndex + 1, pathEnd);
    // If there's content after / and before ? or end, it's likely a database name
    if (pathAfterSlash && !pathAfterSlash.includes('/')) {
      hasDatabaseName = true;
    }
  }
  
  if (hasDatabaseName) {
    // Replace existing database name
    // Match /databaseName followed by ? or end of string
    const dbNamePattern = /\/([^/?]+)(\?|$)/;
    MONGO_URI = MONGO_URI.replace(dbNamePattern, `/${DB_NAME}$2`);
  } else {
    // No database name exists, add it
    if (queryIndex !== -1) {
      // Has query string, insert database name before it
      MONGO_URI = MONGO_URI.slice(0, queryIndex) + `/${DB_NAME}` + MONGO_URI.slice(queryIndex);
    } else {
      // No query string, append database name
      // Remove any trailing slash first
      const cleanedUri = MONGO_URI.replace(/\/+$/, '');
      MONGO_URI = cleanedUri + `/${DB_NAME}`;
    }
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    // Validate URI format before connecting
    if (!MONGO_URI.match(/^mongodb(\+srv)?:\/\//)) {
      throw new Error(`Invalid MongoDB URI format: ${MONGO_URI.replace(/:[^:@]+@/, ':****@')}`);
    }
    
    const opts = {
      bufferCommands: false,
      dbName: DB_NAME, // Explicitly set database name
    };

    cached.promise = mongoose.connect(MONGO_URI, opts).then((mongoose) => {
      console.log(`✅ MongoDB connected successfully to database: ${DB_NAME}`);
      return mongoose;
    }).catch((error) => {
      console.error(`❌ MongoDB connection failed. URI: ${MONGO_URI.replace(/:[^:@]+@/, ':****@')}`);
      throw error;
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
