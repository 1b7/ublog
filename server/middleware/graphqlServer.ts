import { ApolloServer } from '@apollo/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { getDBClient } from './database';

const typeDefs = `#graphql
  type Post {
    text: String,
    timestamp: String
  }

  type User {
    username: String!,
    created: String,
    following: [User]!,
    posts: [Post]!
  }

  type Query {
    posts: [Post],
    users: [User]
  },

  type Mutation {
    addUser(username: String, password: String): User,
    login(username: String, password: String): String
  }
`;

// type Post = {
//   text: String,
//   timestamp: String
// };

// type User = {
//   username: string,
//   created: Date,
//   following: User[],
//   posts: Post[]
// }

const posts = [
  {
    text: 'Hello World',
    author: 'users[0]',
  },
  {
    text: 'Hello Two',
    author: 'users[0]',
  },
  {
    text: 'Some important text',
    author: 'users[1]',
  }
];

const listUsers = async () => {
  const users = getDBClient().db().collection('users');
  const result = users.find({});
  const output = [];
  for await (const doc of result) output.push(doc);
  return output;
};

const createUser = async (username: string, plaintext: string) => {
  const passwordHash = await bcrypt.hash(plaintext, 10);
  const newUser = { username, passwordHash, created: new Date(), posts: [], following: [] };
  const users = getDBClient().db().collection('users');
  await users.insertOne(newUser);
};

const loginUser = async (username: string, plaintext: string) => {
  if (!process.env.SECRET) {
    console.error('env.SECRET MUST be defined for this application to function.');
    process.exit(3); 
  }

  const users = getDBClient().db().collection('users');
  const user = await users.findOne({ username });

  if (user) {
    if (!user.passwordHash) {
      console.error(`Login for user: '${user.username}' attempted, but has no passwordHash.`);
      return { error: 'Something went wrong!' };
    }

    const hashesMatch = await bcrypt.compare(plaintext, user.passwordHash);
    if (hashesMatch) return jwt.sign({ username }, process.env.SECRET, { expiresIn: 60 * 60 });
  } 

  return { error: 'Incorrect username or password' };
};

const resolvers = {
  Query: {
    posts: () => posts,
    users: listUsers,
  },

  Mutation: {
    addUser: async (_: unknown, { username, password }: { username: string, password: string }) => 
      createUser(username, password),

    login: async (_: unknown, { username, password }: { username: string, password: string }) =>
      loginUser(username, password),
  }   
};

const server = new ApolloServer({ typeDefs, resolvers });
export default server;
