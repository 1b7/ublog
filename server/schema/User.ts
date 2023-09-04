import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Document, PullOperator, SetFields } from 'mongodb';
import { Result, ok, err } from './Schema';

import { getDBClient } from '../database';
  
export const createUser = async (username: string, plaintext: string) => {
  try {
    const passwordHash = await bcrypt.hash(plaintext, 10);
    const newUser = { username, passwordHash, created: new Date(), posts: [], following: [] };
    const users = getDBClient().db().collection('users');
    const addedUser =  await users.insertOne(newUser);
    return ok({ ...addedUser });
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('E11000 duplicate key error')) {
      return err('User already exists');
    }
    if (e instanceof Error && e.message.startsWith('Document failed validation')) {
      return err('Validation error');
    }
    console.error(e);
    return err('Internal server error');
  }
};

const setFollowUser = async (addFollower: boolean, currentUser: string, targetUser: string): Promise<Result> => {
  const users = getDBClient().db().collection('users');
  const toFollow = await users.findOne({ username: targetUser });
  if (!toFollow) return err('No such user exists');

  const operation = addFollower
    ? { '$addToSet': { following: toFollow.username } as unknown as SetFields<Document> }
    : { '$pull': { following: toFollow.username } as unknown as PullOperator<Document> };

  try {
    const result = await users.findOneAndUpdate(
      { username: currentUser },
      operation,
      { 'returnDocument': 'after' }
    );
    if (!result) return err('No such user exists');
    return ok({ message: `Successfully ${addFollower ? 'followed' : 'unfollowed'} user` });
  } catch (e) {
    console.error(e);
    return err('Internal server error');
  }
};

export const followUser = async (currentUser: string, targetUser: string) => 
  setFollowUser(true, currentUser, targetUser);

export const unfollowUser = async (currentUser: string, targetUser: string) =>
  setFollowUser(false, currentUser, targetUser);

export const getUser = async (username: string, depth = 1): Promise<Result> => {
  const userCollection = getDBClient().db().collection('users');
  const user = await userCollection.findOne({ username });
  if (!user) return err('User could not be found');
  delete user.passwordHash;

  // Retrieve and insert details of followed accounts:
  const following = await userCollection
    .find({ username: { $in: user.following } })
    .map(followedUser => {
      delete followedUser.passwordHash;
      return followedUser;
    }).toArray();
    
  if (depth > 0) {
    user.following = await Promise.all(following.map(
      async u => (await getUser(u.username, depth - 1)).data
    ));
  } else {
    user.following = following;
  }

  // Retrieve and insert details of posts:
  const posts = await getDBClient().db().collection('posts')
    .find({ author: username })
    .toArray();
  user.posts = posts;

  return ok(user);
};
  
export const loginUser = async (username: string, plaintext: string): Promise<Result> => {
  if (!process.env.JWT_SECRET) {
    console.error('env.JWT_SECRET MUST be defined for this application to function.');
    process.exit(3); 
  }
  
  const users = getDBClient().db().collection('users');
  const user = await users.findOne({ username });
  
  if (user) {
    if (!user.passwordHash) {
      console.error(`Login for user: '${user.username}' attempted, but has no passwordHash.`);
      err('Internal Server Error');
    }
  
    const hashesMatch = await bcrypt.compare(plaintext, user.passwordHash);
    if (hashesMatch) return ok(
      ({ token: jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: 60 * 60 }) })
    );
  } 
  
  return err('Incorrect username or password');
};