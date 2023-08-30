export const UserSchema = {
  'required': [ 'username', 'passwordHash', 'created', 'posts', 'following' ],
  
  'properties': {
    'username': {
      'bsonType': 'string',
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
      'description': 'An array of user objectIds; this is required',
      'minItems': 0, 
      'items': {
        'bsonType': ['objectId'],
        'uniqueItems': true,
        'additionalProperties': false
      }
    },

    'posts': {
      'bsonType': [ 'array' ],
      'description': 'An array of \'Post\' objects',
      'minItems': 0, 
      'items': {
        'bsonType': ['object'],
        'required': ['text', 'timestamp'],
        'uniqueItems': true,
        'additionalProperties': false,
        'properties': {
          'text': {
            'bsonType': 'string',
            'description': '\'text\' is required, and must be of type string' 
          },
          'timestamp': {
            'bsonType': 'date',
            'description': '\'timestamp\' is required, and must be of type date' 
          }
        }
      }
    }
  }
};