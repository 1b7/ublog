import { MongoClient, ServerApiVersion } from 'mongodb';
import { initialiseUsers } from './models/UserSchema';
import { initialisePosts } from './models/PostSchema';
import { initialiseEnv } from './config';

if (!process.env.MONGODB_URI) { initialiseEnv(); }

export const initialiseDB = async () => {
  console.log('Connecting to MongoDB...');
  try {
    await dbClient.connect();
    await initialiseUsers(dbClient.db());
    await initialisePosts(dbClient.db());
    console.log('Successfully initialised MongoDB!');
    return dbClient;
  } catch (e) {
    console.error(e);
    console.error('Error connecting to MongoDB, exiting application');
    await dbClient.close();
    process.exit(2);
  }
};

const dbClient = new MongoClient(process.env.MONGODB_URI!, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
});

export const getDBClient = () => dbClient;