import { GraphQLObjectType, GraphQLString } from 'graphql';

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
export const getAllPosts = () => posts;
  
export const PostType = new GraphQLObjectType({
  name: 'Post',
  fields: {
    text: { type: GraphQLString },
    author: { type: GraphQLString }
  }
});
