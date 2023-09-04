import { Db } from 'mongodb';

export const UserSchema = {
  'required': [ 'username', 'passwordHash', 'created', 'posts', 'following' ],
  
  'properties': {
    'username': {
      'bsonType': 'string',
      'minLength': 3,
      'maxLength': 25,
      'pattern': '^\\w+$',
      'description': '\'username\' is required, and must be of type string' 
    },

    'passwordHash': {
      'bsonType': 'string',
      'description': '\'passwordHash\' is required, and must be of type string' 
    },

    'created': {
      'bsonType': 'date',
      'description': '\'created\' is required, and must be of type date'
    },

    'following': {
      'bsonType': [ 'array' ],
      'description': 'An array of username strings; this is required',
      'minItems': 0, 
      'items': {
        'bsonType': ['string'],
        'uniqueItems': true,
        'additionalProperties': false
      }
    },

    'posts': {
      'bsonType': [ 'array' ],
      'description': 'An array of \'Post\' objectIds',
      'minItems': 0, 
      'items': {
        'bsonType': ['objectId'],
        'uniqueItems': true,
        'additionalProperties': false
      }
    }
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