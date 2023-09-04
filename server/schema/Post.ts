import { getDBClient } from '../database';
import { ObjectId, PushOperator } from 'mongodb';
import { ok, err, Result, Status } from './Schema';
import { getUser } from './User';
  
export const createPost = async (
  author: string, title: string, content: string
): Promise<Result> => {
  const newPost = { author, title, content, created: new Date() };

  try {
    const postsCollection = getDBClient().db().collection('posts');
    const result = await postsCollection.insertOne(newPost);
    const postId = result.insertedId;

    await getDBClient().db().collection('users').findOneAndUpdate(
      { username: author }, 
      { '$push': { posts: postId } as unknown as PushOperator<Document> },
      { 'returnDocument': 'after' }
    );

    const added = await postsCollection.findOne({ _id: postId });
    return ok({ ...added });
  } catch (e: unknown) {
    if (e instanceof Error && e.message.endsWith('Document failed validation')) {
      return err('Validation error');
    }
    console.error(e);
  }
  
  return err('Internal server error');
};

export const getPostsByUser = async (author: string): Promise<Result> => {
  const postCollection = getDBClient().db().collection('posts');
  const posts = postCollection.find({ author });
  if (!posts) return err('No posts could not be found');
  return ok(posts);
};

export const getPost = async (id: string): Promise<Result> => {
  const postCollection = getDBClient().db().collection('posts');
  const post = await postCollection.findOne({ _id: new ObjectId(id) });
  if (!post) return err('No posts could not be found');

  const authorDetail = await getUser(post.author);
  if (authorDetail.status === Status.Ok) {
    post.author = { ...authorDetail.data };
  } else {
    console.error(`Post requested but no valid author found, post ID: '${id}'`);
    post.author = null;
  }

  return ok({ ...post });
};