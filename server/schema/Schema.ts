import { buildSchema, GraphQLError } from 'graphql';

import { loginUser, createUser, getUser, followUser, unfollowUser } from './User';
import { createPost } from './Post';

export const schema = buildSchema(`#graphql 
  type User {
    username: ID!,
    created: String!,
    posts: [Post]!,
    following: [User]!
  }

  type Post {
    id: ID!,
    text: String!,
    timestamp: String!
  }

  type Query {
    user(username: ID!): User
    loggedIn: User!
  }

  type Mutation {
    login(username: ID!, password: String!): String,
    createUser(username: ID!, password: String!): User,
    createPost(text: String!): Post,
    follow(username: ID!): String,
    unfollow(username: ID!): String
  }
`);

export const resolver = {
  user: ({ username }: { username: string }) => getUser(username),

  loggedIn: (_args: unknown, context: { auth: { username: string } }) => 
    getUser(context.auth.username),
  
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
  },

  follow: async ({ username }: { username: string }, context: { auth: { username: string } }) => {
    if (!context.auth || !context.auth.username) return new GraphQLError('Authentication error');
    const result =  await followUser(context.auth.username, username);
    return (result === 'No such user exists' || result === 'Internal server error')
      ? new GraphQLError(result)
      : result;
  },

  unfollow: async ({ username }: { username: string }, context: { auth: { username: string } }) => {
    if (!context.auth || !context.auth.username) return new GraphQLError('Authentication error');
    const result =  await unfollowUser(context.auth.username, username);
    return (result === 'No such user exists' || result === 'Internal server error')
      ? new GraphQLError(result)
      : result;
  }
};