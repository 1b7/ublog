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
      'description': 'An array of \'Post\' objects',
      'minItems': 0, 
      'items': {
        'bsonType': ['object'],
        'required': ['id', 'text', 'timestamp'],
        'uniqueItems': true,
        'additionalProperties': false,
        'properties': {
          'id': {
            'bsonType': 'objectId',
            'description': '\'id\' is required, and must be of type objectId'
          },
          'text': {
            'bsonType': 'string',
            'description': '\'text\' is required, and must be of type string',
            'minLength': 1,
            'maxLength': 250,
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