import { config } from 'dotenv';
config();

import { Db, MongoClient, ServerApiVersion } from 'mongodb';
import { UserSchema } from './models/UserSchema';

export const initialiseDB = async () => {
  console.log('Connecting to MongoDB...');
  try {
    await dbClient.connect();
    await initialiseUsers(dbClient.db());
    console.log('Successfully initialised MongoDB!');
    return dbClient;
  } catch (e) {
    console.error(e);
    console.error('Error connecting to MongoDB, exiting application');
    await dbClient.close();
    process.exit(2);
  }
};

export const initialiseUsers = async (db: Db) => {
  try {
    const userCollection = await db.createCollection('users', {
      validator: {  $jsonSchema: UserSchema }
    });
    await userCollection.createIndex({ username: 1 }, { unique: true });

    console.log('User collection has been created.');
  } catch (error) {
    if (error instanceof Error) {
      if (/^Collection (\w+\.)?users already exists.$/.test(error.message)) {
        console.log('User collection already exists and will not be recreated.');
      } else {
        console.error(error);
      }
    } else {
      console.error('Non-Error value passed to catch block.'); 
      process.exit(1);
    }
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