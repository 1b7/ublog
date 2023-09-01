import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PullOperator, SetFields } from 'mongodb';

import { getDBClient } from '../database';
  
export const createUser = async (username: string, plaintext: string) => {
  const passwordHash = await bcrypt.hash(plaintext, 10);
  const newUser = { username, passwordHash, created: new Date(), posts: [], following: [] };
  const users = getDBClient().db().collection('users');
  await users.insertOne(newUser);
};

const setFollowUser = async (addFollower: boolean, currentUser: string, targetUser: string) => {
  const operation = addFollower
    ? { '$addToSet': { following: targetUser } as unknown as SetFields<Document> }
    : { '$pull': { following: targetUser } as unknown as PullOperator<Document> };
  
  const users = getDBClient().db().collection('users');
  const toFollow = await users.findOne({ username: targetUser });
  if (!toFollow) return 'No such user exists';

  return await users.findOneAndUpdate(
    { username: currentUser },
    operation,
    { 'returnDocument': 'after' }
  ).then(() => targetUser)
    .catch(() => 'Internal server error');
};

export const followUser = async (currentUser: string, targetUser: string) => 
  setFollowUser(true, currentUser, targetUser);

export const unfollowUser = async (currentUser: string, targetUser: string) =>
  setFollowUser(false, currentUser, targetUser);

export const getUser = (username: string) => 
  getDBClient().db().collection('users').findOne({ username });
  
export const loginUser = async (username: string, plaintext: string) => {
  if (!process.env.JWT_SECRET) {
    console.error('env.JWT_SECRET MUST be defined for this application to function.');
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
    if (hashesMatch) return jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: 60 * 60 });
  } 
  
  return 'Incorrect username or password';
};