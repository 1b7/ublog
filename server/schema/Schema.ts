import { buildSchema, GraphQLError } from 'graphql';

import { loginUser, createUser, getUser } from './User';
import { createPost } from './Post';

export const schema = buildSchema(`#graphql 
  type User {
    username: String!,
    created: String!,
    posts: [Post]!,
    following: [User]!
  }

  type Post {
    text: String!,
    timestamp: String!
  }

  type Query {
    user(username: String!): User
  }

  type Mutation {
    login(username: String!, password: String!): String,
    createUser(username: String!, password: String!): User,
    createPost(text: String!): Post
  }
`);

export const resolver = {
  user: ({ username }: { username: string }) => 
    getUser(username),
  login: ({ username, password }: { username: string, password: string }) => 
    loginUser(username, password),
  createUser: ({ username, password }: { username: string, password: string }) => 
    createUser(username, password),
  createPost: async ({ text }: { text: string }, context: { auth: { username: string } }) => {
    if (!context.auth || !context.auth.username) return new GraphQLError('Authentication error');
    const result = await createPost(context.auth.username, text);
    return (typeof result === 'string')
      ? new GraphQLError(result)
      : result;
  }
};