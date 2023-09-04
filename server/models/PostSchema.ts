import { Db } from 'mongodb';

export const PostSchema = {
  'required': [ 'author', 'created', 'title', 'content' ],
    
  'properties': {
    'author': {
      'bsonType': 'string',
      'minLength': 3,
      'maxLength': 25,
      'pattern': '^\\w+$',
      'description': '\'username\' is required, and must be of type string' 
    },
  
    'created': {
      'bsonType': 'date',
      'description': '\'created\' is required, and must be of type date'
    },

    'title': {
      'bsonType': 'string',
      'minLength': 1,
      'maxLength': 50,
      'pattern': '^[\\w ]+$',
      'description': '\'title\' is required, and must be of type string' 
    },

    'content': {
      'bsonType': 'string',
      'description': '\'content\' is required, and must be of type string',
      'minLength': 1,
      'maxLength': 500,
    }
  }
};

export const initialisePosts = async (db: Db) => {
  try {
    await db.createCollection('posts', {
      validator: {  $jsonSchema: PostSchema }
    });
    console.log('Post collection has been created.');
  } catch (error) {
    if (error instanceof Error) {
      if (/^Collection (\w+\.)?posts already exists.$/.test(error.message)) {
        console.log('Post collection already exists and will not be recreated.');
      } else {
        console.error(error);
      }
    } else {
      console.error('Non-Error value passed to catch block.'); 
      process.exit(1);
    }
  }
};
