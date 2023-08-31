import { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLList } from 'graphql';

import { UserType, loginUser, createUser } from './User';
import { PostType, getAllPosts } from './Post';

export const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      posts: {
        type: new GraphQLList(PostType),
        resolve: getAllPosts
      }
    }
  }),

  mutation: new GraphQLObjectType({
    name: 'Mutation',
    fields: {
      login: {
        type: GraphQLString,
        args: {
          username: { type: GraphQLString },
          password: { type: GraphQLString }
        },
        resolve(_root, { username, password }) { return loginUser(username, password); }
      },

      createUser: {
        type: UserType,
        args: {
          username: { type: GraphQLString },
          password: { type: GraphQLString }
        },
        resolve(_root, { username, password }) { return createUser(username, password); }
      },

      authTest: {
        type: GraphQLString,
        resolve(root, args, context) {
          if (context.auth === undefined) {
            return 'Not signed in!';
          } else {
            console.log(context.auth);
            return `Signed in as: '${ context.auth.username }'`;
          }
        }
      }
    }
  })
});
