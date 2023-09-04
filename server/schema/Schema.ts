import { buildSchema } from 'graphql';

import { loginUser, createUser, getUser, followUser, unfollowUser } from './User';
import { createPost, getPost, getPostsByUser } from './Post';


export const ok = (x: object): Result  => ({ status: Status.Ok, data: x });

// export const err = (x: object): Result  => ({ status: Status.Error, data: x });
export const err = (error: string): Result => ({ status: Status.Error, data: { error } });

const unpack = (result: Result, okType: string, errType: string = 'Error') => {
  const __typename = result.status === Status.Ok ? okType : errType;
  return { __typename, ...result.data };
};

export enum Status { Ok, Error }
export type Result = {
  status: Status, 
  data: object
}


export const schema = buildSchema(`#graphql
  type Error { error: String! }

  type Message { message: String! }
  union MessageResult = Message | Error

  type Token { token: String! }
  union TokenResult = Token | Error

  type User {
    username: ID!,
    created: String!,
    posts: [Post]!,
    following: [User]!
  }
  union UserResult = User | Error

  type Post {
    _id: ID!,
    title: String!,
    content: String!,
    created: String!,
    author: User!
  }
  union PostResult = Post | Error


  type Query {
    post(id: ID!): PostResult
    user(username: ID!): UserResult
    loggedIn: UserResult!
  }

  type Mutation {
    login(username: ID!, password: String!): TokenResult!,
    createUser(username: ID!, password: String!): UserResult!,
    createPost(title: String!, content: String!): PostResult!,
    follow(username: ID!): MessageResult!,
    unfollow(username: ID!): MessageResult!
  }
`);

export const resolver = {
  user: async ({ username }: { username: string }) => unpack(
    await getUser(username), 'User'
  ),  

  post: async ({ id }: { id: string }) => unpack(
    await getPost(id), 'Post'
  ),
  
  posts: async ({ username }: { username: string }) => unpack(
    await getPostsByUser(username), '[Post]'
  ),

  loggedIn: async (_args: unknown, context: { auth: { username: string } }) => unpack(
    await getUser(context.auth.username), 'User'
  ),
  
  login: async ({ username, password }: { username: string, password: string }) =>
    unpack(await loginUser(username, password), 'Token'),
  
  createUser: async ({ username, password }: { username: string, password: string }) => 
    unpack(await createUser(username, password), 'User'),
  
  createPost: async ({ title, content }: { title: string, content: string }, context: { auth: { username: string } }) => {
    if (!context.auth || !context.auth.username) {
      return { __typename: 'Error', error: 'Authentication error' };
    }
    return unpack(await createPost(context.auth.username, title, content), 'Post');
  },

  follow: async ({ username }: { username: string }, context: { auth: { username: string } }) => {
    if (!context.auth || !context.auth.username)  {
      return { __typename: 'Error', error: 'Authentication error' };
    }
    return unpack(await followUser(context.auth.username, username), 'Message');
  },

  unfollow: async ({ username }: { username: string }, context: { auth: { username: string } }) => {
    if (!context.auth || !context.auth.username)  {
      return { __typename: 'Error', error: 'Authentication error' };
    }
    return unpack(await unfollowUser(context.auth.username, username), 'Message');
  }
};