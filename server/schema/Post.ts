import { getDBClient } from '../database';
import { ObjectId, PushOperator } from 'mongodb';
  
export const createPost = async (username: string, text: string): Promise<object | string>  => {
  const newPost = { id: new ObjectId(), text, timestamp: new Date() };
  const result = await getDBClient().db().collection('users')
    .findOneAndUpdate(
      { username }, 
      { '$push': { posts: newPost } as unknown as PushOperator<Document> },
      { 'returnDocument': 'after' }
    )
    .then((result) => {
      const newPost = result!.posts[result!.posts.length - 1];
      return newPost;
    })
    .catch((e: unknown) => {
      if (e instanceof Error && e.message.endsWith('Document failed validation')) {
        return'Validation error';
      }
      console.error(e);
      return 'Internal server error';
    });

  return result;
};
